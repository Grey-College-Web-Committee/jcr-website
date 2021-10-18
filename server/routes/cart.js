/**
* This file processes the users shopping cart and converts it into database entries that can
* then be altered by payments.js. This is a reasonably complex process.
*
* The basic premise is that each component of the website that requires some form of payment
* is designated as an individual shop and the shops have a shared shopping cart which is sent
* here.
*
* Each of these shops then has a processor (and optionally a post processor which I will come
* to later). The processor for each shop is where the heavy lifting happens. The format of
* the shopping cart when it is sent to the /process endpoint can be found at
* examples/cart_post_example.json which is an example of a stash order. Processors have a
* specific function signature:
*
* const shopProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {};
*
* If the processor is successful then it should return the following format:
*
* return {
*   price: <price as a number in pounds>,
*   globalSubmissionInfo: globalSubmissionInfo,
*   globalOrderParameters: globalOrderParameters
* };
*
* and in the case of error:
*
* return {
*   errorOccurred: true,
*   status: 500,
*   error: "Unable to check open status"
* };
*
* globalSubmissionInfo and globalOrderParameters are special parameters can pass information
* between shops and into the main shopping cart processor
*
* The rest of the /process endpoint handles calculation of the total price and creates the
* metadata that the FACSO can then download from Stripe to use in finanical reports.
* It also generates the payment intent which is returned to the client enabling them to
* pay for their items.
*
* Note: It is fairly convoluted in places but the full functionality of the shopping cart
* was decided immediately and this is the result of trying to allow flexibility while
* ensuring everything works correctly!
*
* Note on post processors: These aren't very important. The idea was that there would be a
* discount on toasties if someone also purchased a drink or confectionary but this was low
* priority and eventually broke and got ignored. They're left in in case they eventually
* are needed again
**/

// Get express
const express = require("express");
const router = express.Router();
// The database models
const { ToastieStock, ToastieOrderContent, ShopOrder, ShopOrderContent, StashOrderCustomisation, StashOrder, StashStock, StashCustomisations, GymMembership, User, Address, Debt, PersistentVariable, GreyDayGuest } = require("../database.models.js");
// Stripe if it is needed
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Op } = require("sequelize");

// Enables ordering of toasties
const toastieProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
  // A toastie will have no global submission info
  const isToastie = Object.keys(globalSubmissionInfo).length === 0;
  const hasComponents = componentSubmissionInfo.length !== 0;

  let openRecord;

  // Check if the toastie bar is open too
  try {
    openRecord = await PersistentVariable.findOne({
      where: {
        key: "TOASTIE_OPEN"
      }
    });
  } catch (error) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to check open status"
    };
  }

  if(openRecord === null) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to fetch open record"
    };
  }

  if(!openRecord.booleanStorage) {
    return {
      errorOccurred: true,
      status: 400,
      error: "The Toastie Bar is currently closed."
    };
  }

  let modifiedParameters = globalOrderParameters;

  let totalPrice = 0;
  let specialRates = {};

  // Handles toasties separately to other items such as drinks
  if(isToastie) {
    // Must have something in it not just bread
    if(!hasComponents) {
      return {
        errorOccurred: true,
        status: 400,
        error: "Toastie has no fillings"
      };
    }

    let firstSubOrderId = -1;

    for(let subOrderCount = 0; subOrderCount < quantity; subOrderCount++) {
      // Create an suborder id
      // This section does seem long but all it is doing is preparing the toastie
      // and converting it to database entries so they can be accessed by the toastie bar
      let subOrderIdInsert;

      try {
        subOrderIdInsert = await ShopOrderContent.create({
          orderId,
          shop: "toastie"
        });
      } catch (error) {
        return {
          errorOccurred: true,
          status: 500,
          error: "Unable to create sub order"
        };
      }

      const subOrderId = subOrderIdInsert.id;

      if(firstSubOrderId === -1) {
        firstSubOrderId = subOrderId;
      }

      const fillingIds = componentSubmissionInfo.map(obj => obj.id);

      let hasBread = false;
      let hasFillings = false;

      for(let i = 0; i < fillingIds.length; i++) {
        id = fillingIds[i];
        // Check if it is in stock
        let fillingRecord;

        try {
          fillingRecord = await ToastieStock.findOne({
            where: { id }
          });
        } catch (error) {
          return {
            errorOccurred: true,
            status: 500,
            error: "Unable to verify toastie contents"
          };
        }

        const { name, available, type, price } = fillingRecord.dataValues;

        if(!available) {
          return {
            errorOccurred: true,
            status: 400,
            error: `${name} is out of stock`
          };
        }

        if(type === "filling") {
          hasFillings = true;
        }

        if(type === "bread") {
          hasBread = true;
        }

        // Now add it to the order
        let orderFillingInsert;

        try {
          orderFillingInsert = await ToastieOrderContent.create({
            orderId: subOrderId,
            stockId: id,
            quantity: 1
          })
        } catch (error) {
          return {
            errorOccurred: true,
            status: 500,
            error: "Unable to add filling to order"
          };
        }

        totalPrice += Number(price);
      }
    }

    // This is used for metadata later in the process endpoint
    specialRates["name"] = `Toastie ${firstSubOrderId}`;
    specialRates["gross"] = totalPrice;

    // Stuff for the discount that seems to be broken
    if(modifiedParameters.hasOwnProperty("toastie")) {
      if(modifiedParameters.toastie.hasOwnProperty("nonDiscountedToastieCount") && modifiedParameters.toastie.nonDiscountedToastieCount !== undefined && modifiedParameters.toastie.nonDiscountedToastieCount !== null) {
        modifiedParameters.toastie.nonDiscountedToastieCount += 1;
      } else {
        modifiedParameters.toastie.nonDiscountedToastieCount = 1;
      }
    }
  } else {
    // Drinks or confectionary
    if(hasComponents) {
      return {
        errorOccurred: true,
        status: 400,
        error: "Additional item has customisation"
      };
    }

    let subOrderIdInsert;

    try {
      subOrderIdInsert = await ShopOrderContent.create({
        orderId,
        shop: "toastie"
      });
    } catch (error) {
      return {
        errorOccurred: true,
        status: 500,
        error: "Unable to create sub order"
      };
    }

    const subOrderId = subOrderIdInsert.id;
    const extraId = globalSubmissionInfo.id;

    // Just performs some checks to make sure everything is available
    let extraRecord;

    try {
      extraRecord = await ToastieStock.findOne({
        where: { id: extraId }
      });
    } catch (error) {
      return {
        errorOccurred: true,
        status: 500,
        error: "Unable to verify extra item content"
      };
    }

    const { name, available, type, price } = extraRecord.dataValues;

    if(!available) {
      return {
        errorOccurred: true,
        status: 400,
        error: `${name} is out of stock`
      };
    }

    // Now add it to the order
    let orderExtraInsert;

    try {
      orderExtraInsert = await ToastieOrderContent.create({
        orderId: subOrderId,
        stockId: extraId,
        quantity
      })
    } catch (error) {
      return {
        errorOccurred: true,
        status: 500,
        error: "Unable to add extra to order"
      };
    }

    totalPrice += Number(price) * quantity;

    // Metadata
    specialRates["name"] = name;
    specialRates["gross"] = totalPrice;

    if(modifiedParameters.hasOwnProperty("toastie")) {
      if(modifiedParameters.toastie.hasOwnProperty("nonDiscountedConfectionary") && modifiedParameters.toastie.nonDiscountedConfectionary !== undefined && modifiedParameters.toastie.nonDiscountedConfectionary !== null) {
        modifiedParameters.toastie.nonDiscountedConfectionary += 1;
      } else {
        modifiedParameters.toastie.nonDiscountedConfectionary = 1;
      }
    }
  }

  return {
    price: Number(totalPrice),
    globalOrderParameters: modifiedParameters,
    specialRates
  };
};

// Enables ordering of stash
const stashProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
  // Important to note that each ITEM is individually put through this processor
  // First check the stash shop is actually open
  const now = new Date();

  let stashOpenRecord;

  try {
    stashOpenRecord = await PersistentVariable.findOne({ where: { key: "STASH_OPEN" } });
  } catch (error) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to get the stash open variable"
    }
  }

  if(!stashOpenRecord.booleanStorage) {
    return {
      errorOccurred: true,
      status: 400,
      error: "Stash window is closed"
    }
  }

  if(!globalSubmissionInfo.hasOwnProperty("id")) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No id"
    };
  }

  if(globalSubmissionInfo.id === undefined) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No id"
    };
  }

  if(globalSubmissionInfo.id === null) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No id"
    };
  }

  // Get the ID of the product
  const productId = globalSubmissionInfo.id;

  let productRecord;

  try {
    productRecord = await StashStock.findOne({
      where: {
        id: productId
      }
    });
  } catch (error) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to find record"
    };
  }

  // Check it is a valid item
  if(productRecord === null) {
    return {
      errorOccurred: true,
      status: 400,
      error: "Unable to find record"
    };
  }

  let total = Number(productRecord.price);
  let stashOrder;

  // Handle the size, shield and customisation
  // This is essentially manipulation of the JSON datta
  const sizeComponent = componentSubmissionInfo.filter(component => component.type === "size");

  if(sizeComponent.length !== 1) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No size selected"
    };
  }

  const shieldOrCrest = componentSubmissionInfo.filter(component => component.type === "shieldOrCrest");

  if(shieldOrCrest.length !== 1) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No shield or crest selected"
    };
  }

  // 0 = Shield 1 = Crest
  const submitShieldOrCrest = shieldOrCrest[0].shieldOrCrest === "1" ? 1 : 0;

  const underShield = componentSubmissionInfo.filter(component => component.type === "underShieldText");

  if(underShield.length !== 1) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No under shield text"
    };
  }

  const resolvedUnderShieldTexts = [
    "Grey College",
    "Grey College MCR",
    "Grey College 2021 Graduate"
  ];

  const underShieldText = resolvedUnderShieldTexts[Number(underShield[0].underShieldText)];

  const colourComponent = componentSubmissionInfo.filter(component => component.type === "colour");
  let colourId = null;

  if(colourComponent.length === 1) {
    colourId = colourComponent[0].colour;
  } else {
    if(colourComponent.length > 1) {
      return {
        errorOccurred: true,
        status: 400,
        error: "Too many colours"
      };
    }
  }

  try {
    stashOrder = await StashOrder.create({
      orderId,
      productId,
      quantity,
      colourId,
      underShieldText,
      shieldOrCrest: submitShieldOrCrest,
      size: sizeComponent[0].size
    });
  } catch (error) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to create stash sub order"
    };
  }

  const stashOrderId = stashOrder.id;

  // Now add customisations

  const customisationComps = componentSubmissionInfo.filter(component => component.type === "customisation");

  for(let i = 0; i < customisationComps.length; i++) {
    const component = customisationComps[i];
    const { typeId, text } = component;

    let stashCustPriceRecord;

    try {
      stashCustPriceRecord = await StashCustomisations.findOne({
        where: {
          productId,
          customisationChoice: Number(typeId)
        }
      });
    } catch (error) {
      return {
        errorOccurred: true,
        status: 500,
        error: "Unable to find record for customisation"
      };
    }

    if(stashCustPriceRecord === null) {
      return {
        errorOccurred: true,
        status: 400,
        error: "Unknown customisation type"
      };
    }

    let stashCustomisationRecord;

    try {
      stashCustomisationRecord = await StashOrderCustomisation.create({
        orderId: stashOrderId,
        type: Number(typeId),
        text
      });
    } catch (error) {
      return {
        errorOccurred: true,
        status: 500,
        error: "Unable to create customisation"
      };
    }

    total += Number(stashCustPriceRecord.addedPriceForCustomisation);
  }

  return {
    price: total * quantity,
    globalSubmissionInfo: globalSubmissionInfo,
    globalOrderParameters: globalOrderParameters
  };
}

// Attempts to apply a discount to toasties in certain circumstances
// Doesn't seem to be working at the moment though
const toastiePostProcessor = (globalOrderParameters) => {
  const { toastie } = globalOrderParameters;

  // apply the discount
  // this is going to cause problems with multiple orders I think
  if(toastie.hasOwnProperty("nonDiscountedConfectionary") && toastie.nonDiscountedConfectionary !== undefined && toastie.nonDiscountedConfectionary !== null) {
    if(toastie.hasOwnProperty("nonDiscountedToastieCount") && toastie.nonDiscountedToastieCount !== undefined && toastie.nonDiscountedToastieCount !== null) {
      if(toastie.nonDiscountedToastieCount > 0 && toastie.nonDiscountedConfectionary > 0) {
        return -0.2;
      }
    }
  }

  return 0;
}

// Enables purchasing of gym memberships
const gymProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
  // Basic validation - type is whether it is a term or year long membership
  if(!globalSubmissionInfo.hasOwnProperty("type")) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No type"
    };
  }

  if(globalSubmissionInfo.type === undefined) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No type"
    };
  }

  if(globalSubmissionInfo.type === null) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No type"
    };
  }

  const type = globalSubmissionInfo.type;

  if(quantity !== 1) {
    return {
      errorOccurred: true,
      status: 400,
      error: "You can only order 1 gym membership"
    }
  }

  // The available options to purchase - needs yearly update
  const currentMembershipOptions = {
    full_year: {
      expires: new Date("2021-07-01"),
      price: 80,
      nonMemberPrice: 100
    },
    single_term: {
      expires: new Date("2021-06-25"),
      price: 20,
      nonMemberPrice: 30
    }
  };

  // Same ideas as JCR membership
  // stops purchasing of invalid memberships
  if(!Object.keys(currentMembershipOptions).includes(type)) {
    return {
      errorOccurred: true,
      status: 400,
      error: "Invalid membership type"
    }
  }

  const selectedExpiry = currentMembershipOptions[type].expires;
  const currentDate = new Date();
  const isMember = user.membershipExpiresAt !== null && new Date(user.membershipExpiresAt) > currentDate;

  if(currentDate > selectedExpiry) {
    return {
      errorOccurred: true,
      status: 400,
      error: "New memberships are not available at this time"
    }
  }

  // Need to check if they already have a gym membership

  let existingMemberships;

  try {
    existingMemberships = await GymMembership.findAll({
      include: [
        {
          model: User,
          where: {
            id: user.id
          },
          required: true
        },
        {
          model: ShopOrder,
          where: {
            paid: true
          },
          required: true
        }
      ]
    });
  } catch (error) {
    console.log({error});
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to check existing memberships"
    };
  }

  // Make sure they don't have a membership already
  if(existingMemberships.length !== 0) {
    const unexpiredMemberships = existingMemberships.filter(membership => membership.expiresAt > currentDate);

    if(unexpiredMemberships.length !== 0) {
      return {
        errorOccurred: true,
        status: 400,
        error: "You already have an active membership"
      };
    }
  }

  // Used to get their household number during covid
  const householdComps = componentSubmissionInfo.filter(comp => comp.type === "household");

  if(householdComps.length === 0) {
    return {
      errorOccurred: true,
      status: 400,
      error: "You must specify your household"
    };
  }

  const household = Number(householdComps[0].value);

  // Used to get their postcode during covid
  const postcodeComps = componentSubmissionInfo.filter(comp => comp.type === "postcode");

  if(postcodeComps.length === 0 && household === 0) {
    return {
      errorOccurred: true,
      status: 400,
      error: "You must specify your postcode"
    }
  }

  const postcode = postcodeComps[0].value;

  // Otherwise they don't have a membership so create one

  // Note the membership cannot be trusted until they check out fully which can be checked
  // by including ShopOrder when selecting GymMemberships
  // this was poor design but it does work you just need to take care if making changes
  try {
    await GymMembership.create({
      orderId,
      userId: user.id,
      type,
      expiresAt: selectedExpiry,
      household,
      postcode
    });
  } catch (error) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to create new membership"
    };
  }

  // Create the shop order
  try {
    await ShopOrderContent.create({
      orderId,
      shop: "gym"
    });
  } catch (error) {
    console.log({error});
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to create new sub order for membership"
    };
  }

  return {
    price: isMember ? currentMembershipOptions[type].price : currentMembershipOptions[type].nonMemberPrice,
    globalSubmissionInfo: globalSubmissionInfo,
    globalOrderParameters: globalOrderParameters
  };
}

// Enables purchasing of JCR memberships
const jcrMembershipProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
  // Type is whether it is a one, two, three or four year membership
  if(!globalSubmissionInfo.hasOwnProperty("type")) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No type"
    };
  }

  if(globalSubmissionInfo.type === undefined) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No type"
    };
  }

  if(globalSubmissionInfo.type === null) {
    return {
      errorOccurred: true,
      status: 400,
      error: "No type"
    };
  }

  const type = globalSubmissionInfo.type;

  if(quantity !== 1) {
    return {
      errorOccurred: true,
      status: 400,
      error: "You can only order 1 JCR membership"
    }
  }

  // Purchasable options, needs updating yearly currentl
  const currentMembershipOptions = {
    one_year: {
      expires: new Date("2022-08-01"),
      price: 56
    },
    two_year: {
      expires: new Date("2023-08-01"),
      price: 112
    },
    three_year: {
      expires: new Date("2024-08-01"),
      price: 168
    },
    four_year: {
      expires: new Date("2025-08-01"),
      price: 208
    }
  };

  if(!Object.keys(currentMembershipOptions).includes(type)) {
    return {
      errorOccurred: true,
      status: 400,
      error: "Invalid membership type"
    }
  }

  const selectedExpiry = currentMembershipOptions[type].expires;
  const currentDate = new Date();

  if(currentDate > selectedExpiry) {
    return {
      errorOccurred: true,
      status: 400,
      error: "New memberships are not available at this time"
    }
  }

  // Check they don't have an active membership
  // would usually use session but this can cause problems if they don't bother logging out

  let userRecord;

  try {
    userRecord = await User.findOne({
      where: {
        id: user.id
      }
    });
  } catch (error) {
    console.log({error});
    return;
  }

  if(userRecord === null) {
    console.log("NULL UR");
    return;
  }

  const { membershipExpiresAt } = userRecord;

  // Check that they don't already have a membership
  if(membershipExpiresAt !== null) {
    const membershipExpiresAtDate = new Date(membershipExpiresAt);

    if(membershipExpiresAtDate > currentDate) {
      return {
        errorOccurred: true,
        status: 400,
        error: "You already have an active JCR membership!"
      }
    }
  }

  // Create the order entry
  try {
    await ShopOrderContent.create({
      orderId,
      shop: "jcr_membership",
      additional: type
    });
  } catch (error) {
    console.log({error});
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to create new sub order for membership"
    };
  }

  return {
    price: currentMembershipOptions[type].price,
    globalSubmissionInfo: globalSubmissionInfo,
    globalOrderParameters: globalOrderParameters
  };
}

// Used for paying off debt
const debtProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
  // Quite a simple processor
  // Just checks if they have debt, if so it is added to the order
  let debtRecord;

  try {
    debtRecord = await Debt.findOne({ where: { username: user.username }});
  } catch (error) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to get the debt record"
    };
  }

  if(debtRecord === null) {
    return {
      errorOccurred: true,
      status: 400,
      error: "User doesn't have debt"
    };
  }

  try {
    await ShopOrderContent.create({
      orderId,
      shop: "debt"
    });
  } catch (error) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to create new sub order for debt"
    };
  }

  return {
    price: Number(debtRecord.debt),
    globalSubmissionInfo: globalSubmissionInfo,
    globalOrderParameters: globalOrderParameters
  };
}

// Required - put the shop name and the processor function in here
const shopProcessors = {
  "toastie": toastieProcessor,
  "stash": stashProcessor,
  "gym": gymProcessor,
  "jcr_membership": jcrMembershipProcessor,
  "debt": debtProcessor
};

// Optional
const shopPostProcessors = {
  "toastie": toastiePostProcessor
};

// Self-explanatory, these shops require a JCR membership to use
const requiresMembershipShops = [
  "toastie",
  "stash"
];

// Called at the base path of your route with HTTP method POST
router.post("/process", async (req, res) => {
  // Logged in only
  const { user } = req.session;
  const isMember = user.membershipExpiresAt !== null && new Date(user.membershipExpiresAt) > new Date();
  const submittedCart = req.body.submissionCart;

  // Validate some basic data from the cart
  if(!submittedCart.hasOwnProperty("items")) {
    return res.status(400).json({ error: "Missing items (no property)" });
  }

  if(submittedCart.items === undefined) {
    return res.status(400).json({ error: "Missing items (undefined)" });
  }

  if(submittedCart.items === null) {
    return res.status(400).json({ error: "Missing items (null)" });
  }

  if(!Array.isArray(submittedCart.items)) {
    return res.status(400).json({ error: "Missing items (non-array)" });
  }

  if(submittedCart.items.length === 0) {
    return res.status(400).json({ error: "Missing items (empty)" });
  }

  // Get the names of every shop that is registered in this file
  const validShops = Object.keys(shopProcessors);

  //Validate each first then we'll process all at once
  for(let i = 0; i < submittedCart.items.length; i++) {
    item = submittedCart.items[i];

    if(item === null) {
      return res.status(400).json({ error: `${i} is null`});
    }

    if(!item.hasOwnProperty("shop")) {
      return res.status(400).json({ error: `${i} missing shop (no property)`});
    }

    if(item.shop === undefined) {
      return res.status(400).json({ error: `${i} missing shop (undefined)`});
    }

    if(item.shop === null) {
      return res.status(400).json({ error: `${i} missing shop (null)`});
    }

    if(typeof item.shop !== "string") {
      return res.status(400).json({ error: `${i} missing shop (non-string)`});
    }

    if(!validShops.includes(item.shop)) {
      return res.status(400).json({ error: `${i} missing shop (invalid type)`});
    }

    if(requiresMembershipShops.includes(item.shop) && !isMember) {
      return res.status(400).json({ error: {
        error: "You must be a JCR member to buy one of the items in your bag."
      }});
    }

    if(!item.hasOwnProperty("quantity")) {
      return res.status(400).json({ error: `${i} missing quantity (no property)`});
    }

    if(item.quantity === undefined) {
      return res.status(400).json({ error: `${i} missing quantity (undefined)`});
    }

    if(item.quantity === null) {
      return res.status(400).json({ error: `${i} missing quantity (null)`});
    }

    if(!Number.isInteger(item.quantity)) {
      return res.status(400).json({ error: `${i} missing quantity (non-number)`});
    }

    if(item.quantity <= 0) {
      return res.status(400).json({ error: `${i} missing quantity (not positive)`})
    }

    if(!item.hasOwnProperty("globalSubmissionInfo")) {
      return res.status(400).json({ error: `${i} missing globalSubmissionInfo (no property)`});
    }

    if(item.globalSubmissionInfo === undefined) {
      return res.status(400).json({ error: `${i} missing globalSubmissionInfo (undefined)`});
    }

    if(item.globalSubmissionInfo === null) {
      return res.status(400).json({ error: `${i} missing globalSubmissionInfo (null)`});
    }

    if(!item.hasOwnProperty("componentSubmissionInfo")) {
      return res.status(400).json({ error: `${i} missing componentSubmissionInfo (no property)`});
    }

    if(item.componentSubmissionInfo === undefined) {
      return res.status(400).json({ error: `${i} missing componentSubmissionInfo (undefined)`});
    }

    if(item.componentSubmissionInfo === null) {
      return res.status(400).json({ error: `${i} missing componentSubmissionInfo (null)`});
    }

    if(!Array.isArray(item.componentSubmissionInfo)) {
      return res.status(400).json({ error: `${i} missing componentSubmissionInfo (non-array)` });
    }
  }

  // Check if they are a debtor

  let debtRecord;

  try {
    debtRecord = await Debt.findOne({ where: { username: user.username.toLowerCase() }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to check debtor status" });
  }

  const debtInCart = submittedCart.items.filter(item => item.shop === "debt").length !== 0;

  // Debtors cannot check out unless they have their debt in their cart
  if(debtRecord !== null && !debtInCart) {
    return res.status(402).json({ error: "Debtor" });
  }

  // Delivery is left over from the Covid-19 lockdowns
  // It is left in in case it is needed again
  // It is disabled on the frontend instead
  // Now we check the delivery address
  const delivery = req.body.delivery;

  // All of this belows validates the delivery information if it is needed
  if(!delivery.hasOwnProperty("required")) {
    return res.status(400).json({ error: "Missing required (no property)" });
  }

  if(delivery.required === undefined) {
    return res.status(400).json({ error: "Missing required (undefined)" });
  }

  if(delivery.required === null) {
    return res.status(400).json({ error: "Missing required (null)" });
  }

  if(!delivery.hasOwnProperty("option")) {
    return res.status(400).json({ error: "Missing option (no property)" });
  }

  if(delivery.option === undefined) {
    return res.status(400).json({ error: "Missing option (undefined)" });
  }

  if(delivery.option === null) {
    return res.status(400).json({ error: "Missing option (null)" });
  }

  if(!["none", "collection", "delivery"].includes(delivery.option)) {
    return res.status(400).json({ error: "Invalid option (wrong type)" });
  }

  if(!delivery.hasOwnProperty("address")) {
    return res.status(400).json({ error: "Missing address (no property)" });
  }

  if(delivery.address === undefined) {
    return res.status(400).json({ error: "Missing address (undefined)" });
  }

  if(delivery.address === null) {
    return res.status(400).json({ error: "Missing address (null)" });
  }

  const requiredProperties = ["recipient", "line1", "line2", "city", "postcode"];

  for(let property of requiredProperties) {
    if(!delivery.address.hasOwnProperty(property)) {
      return res.status(400).json({ error: "Address is missing properties (null)" });
    }

    if(delivery.address[property] === undefined) {
      return res.status(400).json({ error: "Address is missing properties (undefined)" });
    }
  }

  // Address is validated, could add checks that it is a real address
  // But delivery isn't really an option anymore

  let addressRecord = null;

  // They've opted for a delivery to their address
  if(delivery.option === "delivery") {
    try {
      addressRecord = await Address.create({
        recipient: delivery.address.recipient,
        line1: delivery.address.line1,
        line2: delivery.address.line2,
        city: delivery.address.city,
        postcode: delivery.address.postcode
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to add the address to the database "});
    }
  }

  let validatedPrices = [];
  let dbOrderRecord;

  let deliveryAddressId = -1;

  if(addressRecord) {
    deliveryAddressId = addressRecord.id;
  }

  // Create the overarching order related to the cart that can be used in the Stripe webhook
  // to link the payment to the order
  // You should never trust a ShopOrder unless it is marked as paid!
  // stripeId alone is not enough to verify payment!
  try {
    dbOrderRecord = await ShopOrder.create({ userId: user.id,  deliveryOption: delivery.option, deliveryAddressId });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create order in database" });
  }

  const orderId = dbOrderRecord.id;
  let globalOrderParameters = {};

  // Prepare the global parameters object
  validShops.forEach((item, i) => {
    globalOrderParameters[item] = {};
  });

  // Track which shops are used so they can be added to the metadata
  let usedShops = [];
  let totalSpentByShop = {};

  // Set the total spent for delivery
  // Will add it to the subtotal and Stripe metadata
  if(delivery.option === "delivery") {
    totalSpentByShop["delivery"] = 3.6;
    usedShops.push("delivery");
    validatedPrices.push(3.6);
  }

  // Begin constructing the metadata
  let metadata = {
    integration_check: "accept_a_payment",
    orderId
  };

  // Toasties need a slightly different breakdown and this handles this
  let toastieGrosses = [];

  for(let i = 0; i < submittedCart.items.length; i++) {
    item = submittedCart.items[i];
    const { shop, quantity, globalSubmissionInfo, componentSubmissionInfo } = item;

    if(!totalSpentByShop.hasOwnProperty(shop)) {
      totalSpentByShop[shop] = 0;
    }

    // Process each item from the cart in the corresponding shop
    const result = await shopProcessors[shop](globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user);

    // Keep track of everything that is being used
    if(!usedShops.includes(shop)) {
      usedShops.push(shop);
    }

    // Errors from the processors must be of the form
    /*
      {
        errorOccurred: true,
        status: 400 or 500, (or suitable code)
        error: Small description of issue
      }
    */
    if(result.hasOwnProperty("errorOccurred") && result.errorOccurred !== undefined && result.errorOccurred !== null) {
      return res.status(result.status).json({ error: result });
    }

    // Valid results from the processors must return:
    /*
      {
        price: (Decimal number of all products just processed (quantity * price)),
        globalOrderParameters: (An object storing metadata about the order (e.g. for applying the chocholate + toastie discount))
      }
    */
    globalOrderParameters = result.globalOrderParameters;
    totalSpentByShop[shop] += result.price;
    validatedPrices.push(result.price);

    if(result.hasOwnProperty("specialRates")) {
      const { name, gross } = result.specialRates;
      const realGross = Math.round(gross * 100);
      metadata[`TB_${name}`] = realGross;
      // metadata[`TB_${name}_net`] = Math.round(realGross - ((0.014 * realGross) + (20 / shopCount)));
      toastieGrosses.push({ name, realGross });
    }
  }

  // This applies the post processor
  Object.keys(usedShops).forEach(key => {
    if(Object.keys(shopPostProcessors).includes(key)) {
      const priceAdjustment = shopPostProcessors[key](globalOrderParameters);
      totalSpentByShop[key] += priceAdjustment;
      validatedPrices.push(priceAdjustment);
    }
  });

  // Used to help the FACSO track debt payments
  if(debtInCart) {
    metadata["debt_username"] = user.username;
  }

  metadata["usedShops"] = JSON.stringify(usedShops);

  const shopCount = Object.keys(totalSpentByShop).length;

  // Special toastie information for the metadata
  let toastieExcess = 0;
  let toastieGross = 0;

  Object.keys(totalSpentByShop).forEach(shop => {
    const shopGross = Math.round(totalSpentByShop[shop] * 100);
    metadata[shop] = shopGross;
    const shopNet = Math.round(shopGross - ((0.014 * shopGross) + (20 / shopCount)));

    if(shop === "toastie") {
      toastieExcess = shopGross - shopNet;
      toastieGross = shopGross;
    }

    metadata[`${shop}_net`] = shopNet;
  });

  if(toastieGrosses.length !== 0 && toastieExcess !== 0) {
    toastieGrosses.forEach(item => {
      const proportion = item.realGross / toastieGross;
      const diff = Math.round(toastieExcess * proportion);
      metadata[`TB_${item.name}_net`] = item.realGross - diff;
    });
  }

  // Create a Stripe payment intent so they can actually pay for the items
  const totalAmount = validatedPrices.reduce((sum, price) => sum + price, 0);
  const totalAmountInPence = Math.round(totalAmount * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmountInPence,
    currency: "gbp",
    description: `Grey JCR Shop Order`,
    metadata,
    receipt_email: user.email
  });

  let serverResponse = {
    clientSecret: paymentIntent.client_secret,
    validatedPrices,
    totalAmountInPence
  };

  // Send back the information needed for checkout
  return res.status(200).json(serverResponse);
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
