// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, ToastieStock, ToastieOrderContent, Permission, PermissionLink, ShopOrder, ShopOrderContent } = require("../database.models.js");
// Stripe if it is needed
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

const toastieProcessor = async (globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo) => {
  console.log("IN processor", globalSubmissionInfo);
  // A toastie will have no global submission info
  const isToastie = Object.keys(globalSubmissionInfo).length === 0;
  const hasComponents = componentSubmissionInfo.length !== 0;

  let modifedParameters = globalOrderParameters;

  // Create an suborder id
  let subOrderIdInsert;

  try {
    subOrderIdInsert = await ShopOrderContent.create({
      orderId
    });
  } catch (error) {
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to create sub order"
    };
  }

  let totalPrice = 0;
  const subOrderId = subOrderIdInsert.id;

  if(isToastie) {
    if(!hasComponents) {
      return {
        errorOccurred: true,
        status: 400,
        error: "Toastie has no fillings"
      };
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
          stockId: id
        })
      } catch (error) {
        return {
          errorOccurred: true,
          status: 500,
          error: "Unable to add filling to order"
        };
      }

      totalPrice += Number(price) * quantity;
    }

    if(modifedParameters.toastie.hasOwnProperty("nonDiscountedToastieCount") && modifedParameters.toastie.nonDiscountedToastieCount !== undefined && modifedParameters.toastie.nonDiscountedToastieCount !== null) {
      modifedParameters.toastie.nonDiscountedToastieCount += 1;
    } else {
      modifedParameters.toastie.nonDiscountedToastieCount = 1;
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

    console.log("Extra:");

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
        stockId: extraId
      })
    } catch (error) {
      return {
        errorOccurred: true,
        status: 500,
        error: "Unable to add extra to order"
      };
    }

    totalPrice += Number(price) * quantity;

    if(modifedParameters.toastie.hasOwnProperty("nonDiscountedConfectionary") && modifedParameters.toastie.nonDiscountedConfectionary !== undefined && modifedParameters.toastie.nonDiscountedConfectionary !== null) {
      modifedParameters.toastie.nonDiscountedConfectionary += 1;
    } else {
      modifedParameters.toastie.nonDiscountedConfectionary = 1;
    }
  }

  return {
    price: Number(totalPrice),
    globalOrderParameters: modifedParameters
  };
};

const stashProcessor = (orderId, quantity, globalSubmissionInfo, componentSubmissionInfo) => {

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

const shopProcessors = {
  "toastie": toastieProcessor,
  "stash": stashProcessor
}

const shopPostProcessors = {
  "toastie": toastiePostProcessor
}

// Called at the base path of your route with HTTP method POST
router.post("/process", async (req, res) => {
  // User only
  const { user } = req.session;
  const submittedCart = req.body.submissionCart;

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

  let validatedPrices = [];
  let dbOrderRecord;

  try {
    dbOrderRecord = await ShopOrder.create({ userId: user.id });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create order in database" });
  }

  const orderId = dbOrderRecord.id;
  let globalOrderParameters = {};

  validShops.forEach((item, i) => {
    globalOrderParameters[item] = {};
  });

  for(let i = 0; i < submittedCart.items.length; i++) {
    item = submittedCart.items[i];
    console.log(item);
    const { shop, quantity, globalSubmissionInfo, componentSubmissionInfo } = item;
    const result = await shopProcessors[shop](globalOrderParameters, orderId, quantity, globalSubmissionInfo, componentSubmissionInfo);

    console.log(shop, result);

    // Errors from the processors must be of the form
    /*
      {
        errorOccurred: true,
        status: 400 or 500, (or suitable code)
        error: Small description of issue
      }
    */
    if(result.hasOwnProperty("errorOccurred") && result.errorOccurred !== undefined && result.errorOccurred !== null) {
      return res.status(result.status).json({ error: result.error });
    }

    // Valid results from the processors must return:
    /*
      {
        price: (Decimal number of all products just processed (quantity * price)),
        globalOrderParameters: (An object storing metadata about the order (e.g. for applying the chocholate + toastie discount))
      }
    */
    console.log(result.price);
    validatedPrices.push(result.price);
  }

  Object.keys(shopPostProcessors).forEach(key => {
    const priceAdjustment = shopPostProcessors[key](globalOrderParameters);
    validatedPrices.push(priceAdjustment);
  });

  console.log(validatedPrices);

  const totalAmount = validatedPrices.reduce((sum, price) => sum + price, 0);
  console.log("ta", totalAmount);
  const totalAmountInPence = Math.round(totalAmount * 100);

  console.log("taip", totalAmountInPence);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmountInPence,
    currency: "gbp",
    metadata: { integration_check: "accept_a_payment" },
    description: `Grey JCR Shop Order`,
    metadata: {
      orderId
    },
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
