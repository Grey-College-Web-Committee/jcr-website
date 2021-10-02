// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, SwappingCredit, SwappingCreditLog, SwappingPair, PersistentVariable } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Prepares the payment intent for a donation
router.post("/donate", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { amount: unparsedAmount } = req.body;

  // Parse the amount
  if(!unparsedAmount) {
    return res.status(400).json({ error: "Missing amount" });
  }

  const amount = Number(unparsedAmount);

  if(Number.isNaN(amount)) {
    return res.status(400).json({ error: "Amount must be a number" });
  }

  if(amount > 100 || amount < 2) {
    return res.status(400).json({ error: "Amount must be between £2.00 and £100.00" });
  }

  // Calculate the metadata for the FACSO
  const gross = Math.round(amount * 100);
  const net = Math.round(gross - ((0.014 * gross) + 20));

  // We can keep this stateless by passing the username through instead
  const paymentIntent = await stripe.paymentIntents.create({
    amount: gross,
    currency: "gbp",
    description: `Grey JCR Swapping Donation`,
    metadata: {
      donation_gross: gross,
      donation_net: net,
      integration_check: "accept_a_payment",
      userId: user.id,
      swapping: true
    },
    receipt_email: user.email
  });

  // Must put .end() if not using .json() otherwise it will timeout
  // and you'll get unexpected behaviour. 204 is success but no content
  return res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    totalAmountInPence: gross
  });
});

router.get("/credit", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Get their credit record
  let creditRecord;
  let created;

  try {
    [creditRecord, created] = await SwappingCredit.findOrCreate({
      where: {
        userId: user.id
      },
      defaults: {
        userId: user.id,
        credit: 0
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check credit" });
  }

  let history;

  try {
    history = await SwappingCreditLog.findAll({
      where: {
        userId: user.id
      },
      order: [[ "updatedAt", "DESC" ]]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check log" });
  }

  return res.status(200).json({ credit: creditRecord.credit, history });
})

// Create the initial pairings
router.post("/initial", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "events.swapping")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { initialPairs } = req.body;

  // Check there are no pairs
  let existingPairs;

  try {
    existingPairs = await SwappingPair.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch existing pairs" });
  }

  if(existingPairs.length !== 0) {
    return res.status(400).json({ error: "There already exists pairs. Please clear them before uploading a new set of pairs." });
  }

  for(let position = 0; position < initialPairs.length; position++) {
    const { first, second } = initialPairs[position];

    try {
      await SwappingPair.create({ first, second, position, count: 0 });
    } catch (error) {
      return res.status(500).json({ error: `Unable to create pair for ${first} and ${second}` });
    }
  }

  return res.status(204).end();
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
