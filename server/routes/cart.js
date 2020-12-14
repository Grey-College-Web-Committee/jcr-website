// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, ToastieOrder, ToastieStock, ToastieOrderContent, Permission, PermissionLink, ShopOrder } = require("../database.models.js");
// Stripe if it is needed
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

const toastieProcessor = (orderId, quantity, globalSubmissionInfo, componentSubmissionInfo) => {

};

const stashProcessor = (orderId, quantity, globalSubmissionInfo, componentSubmissionInfo) => {

}

const shopProcessors = {
  "toastie": toastieProcessor,
  "stash": stashProcessor
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

  for(let i = 0; i < submittedCart.items.length; i++) {
    item = submittedCart.items[i];
    const { shop, quantity, globalSubmissionInfo, componentSubmissionInfo } = item;
    const result = shopProcessors[shop](orderId, quantity, globalSubmissionInfo, componentSubmissionInfo);

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

    // Valid results from the processors must return a positive number which is the total price of all of the products just processed
    validatedPrices.push(result);
  }

  const totalAmount = validatedPrices.reduce((sum, price) => sum + price);
  const totalAmountInPence = Math.round(totalAmount * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmountInPence,
    currency: "gbp",
    metadata: { integration_check: "accept_a_payment" },
    description: `Grey JCR Shop Order`,
    metadata: {
      orderId: dbOrder.id
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
