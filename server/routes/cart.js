// Get express
const express = require("express");
const router = express.Router();
// The database models
const { ToastieStock, ToastieOrderContent, ShopOrder, ShopOrderContent, StashOrderCustomisation, StashOrder, StashStock, StashCustomisations, GymMembership, User, Address } = require("../database.models.js");
// Stripe if it is needed
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Array of debtors who are prohibited from buying from the store
// this is temporary until the debt backlog is sorted
const debtors = require("../debtors.json");

const stashLock = new Date("2021-02-01T00:00:00Z");

const toastieProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
  // A toastie will have no global submission info
  const isToastie = Object.keys(globalSubmissionInfo).length === 0;
  const hasComponents = componentSubmissionInfo.length !== 0;

  let modifiedParameters = globalOrderParameters;

  let totalPrice = 0;

  if(isToastie) {
    if(!hasComponents) {
      return {
        errorOccurred: true,
        status: 400,
        error: "Toastie has no fillings"
      };
    }

    for(let subOrderCount = 0; subOrderCount < quantity; subOrderCount++) {
      // Create an suborder id
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
    globalOrderParameters: modifiedParameters
  };
};

const stashProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
  const now = new Date();

  if(now > stashLock) {
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

  if(productRecord === null) {
    return {
      errorOccurred: true,
      status: 400,
      error: "Unable to find record"
    };
  }

  let total = Number(productRecord.price);
  let stashOrder;

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
    "Grey College MCR"
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

const gymProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
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

  const currentMembershipOptions = {
    full_year: {
      expires: new Date("2021-07-01"),
      price: 80,
      nonMemberPrice: 100
    },
    single_term: {
      expires: new Date("2021-03-20"),
      price: 40,
      nonMemberPrice: 55
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

  // Otherwise they don't have a membership so create one

  try {
    await GymMembership.create({
      orderId,
      userId: user.id,
      type,
      expiresAt: selectedExpiry
    });
  } catch (error) {
    console.log({error});
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to create new membership"
    };
  }

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

const jcrMembershipProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user) => {
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

  const currentMembershipOptions = {
    one_year: {
      expires: new Date("2021-08-01"),
      price: 56
    },
    two_year: {
      expires: new Date("2022-08-01"),
      price: 112
    },
    three_year: {
      expires: new Date("2023-08-01"),
      price: 168
    },
    four_year: {
      expires: new Date("2024-08-01"),
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

// Required
const shopProcessors = {
  "toastie": toastieProcessor,
  "stash": stashProcessor,
  "gym": gymProcessor,
  "jcr_membership": jcrMembershipProcessor
};

// Optional
const shopPostProcessors = {
  "toastie": toastiePostProcessor
};

const requiresMembershipShops = [
  "toastie",
  "stash"
];

// Called at the base path of your route with HTTP method POST
router.post("/process", async (req, res) => {
  // User only
  const { user } = req.session;
  const isMember = user.membershipExpiresAt !== null && new Date(user.membershipExpiresAt) > new Date();
  const submittedCart = req.body.submissionCart;

  if(debtors.includes(user.username.toLowerCase())) {
    return res.status(402).json({ error: "Debtor" });
  }

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

  // Now we check the delivery addres
  const delivery = req.body.delivery;

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

  // TODO: Implement some check to make sure the address is real?
  // Address is validated

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

  try {
    dbOrderRecord = await ShopOrder.create({ userId: user.id,  deliveryOption: delivery.option, deliveryAddressId });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create order in database" });
  }

  const orderId = dbOrderRecord.id;
  let globalOrderParameters = {};

  validShops.forEach((item, i) => {
    globalOrderParameters[item] = {};
  });

  let usedShops = [];
  let totalSpentByShop = {};

  // Set the total spent for delivery
  // Will add it to the subtotal and Stripe metadata
  if(delivery.option === "delivery") {
    totalSpentByShop["delivery"] = 3.6;
    usedShops.push("delivery");
    validatedPrices.push(3.6);
  }

  for(let i = 0; i < submittedCart.items.length; i++) {
    item = submittedCart.items[i];
    const { shop, quantity, globalSubmissionInfo, componentSubmissionInfo } = item;

    if(!totalSpentByShop.hasOwnProperty(shop)) {
      totalSpentByShop[shop] = 0;
    }

    const result = await shopProcessors[shop](globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo, user);

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
  }

  Object.keys(usedShops).forEach(key => {
    if(Object.keys(shopPostProcessors).includes(key)) {
      const priceAdjustment = shopPostProcessors[key](globalOrderParameters);
      totalSpentByShop[key] += priceAdjustment;
      validatedPrices.push(priceAdjustment);
    }
  });

  let metadata = {
    integration_check: "accept_a_payment",
    orderId,
    usedShops: JSON.stringify(usedShops)
  };

  const shopCount = Object.keys(totalSpentByShop).length;

  Object.keys(totalSpentByShop).forEach(shop => {
    const shopGross = Math.round(totalSpentByShop[shop] * 100);
    metadata[shop] = shopGross;
    const shopNet = Math.round(shopGross - ((0.014 * shopGross) + (20 / shopCount)));
    metadata[`${shop}_net`] = shopNet;
  });

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

  return res.status(200).json(serverResponse);
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
