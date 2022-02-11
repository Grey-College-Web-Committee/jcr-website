// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, SwappingCredit, SwappingCreditLog, SwappingPair, PersistentVariable } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");

// This will be where exported CSVs are stored
const csvPath = path.join(__dirname, "../exports/swapping/");

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
});

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

// Reset swapping
router.post("/reset", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "events.swapping")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Clear credit, credit log and pairs
  try {
    await SwappingCredit.destroy({
      where: {},
      truncate: true
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to clear credit" });
  }

  try {
    await SwappingCreditLog.destroy({
      where: {},
      truncate: true
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to clear credit log" });
  }

  try {
    await SwappingPair.destroy({
      where: {},
      truncate: true
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to clear pairs" });
  }

  let openRecord;

  try {
    openRecord = await PersistentVariable.findOne({ where: { key: "SWAPPING_OPEN" } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the swapping status" });
  }

  openRecord.booleanStorage = false;

  try {
    await openRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the open status" });
  }

  req.io.to("swapClients").emit("swappingOpenClose", { open: false });
  return res.status(204).end();
});

// Download the positions of pairs
router.get("/download", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "events.swapping")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let pairRecords;

  try {
    pairRecords = await SwappingPair.findAll({
      order: [[ "position", "ASC" ]]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the pairs" });
  }

  if(pairRecords.length === 0) {
    return res.status(400).json({ error: "No pairs available" });
  }

  let pairs = [...pairRecords];

  const maxPairsPerTable = 3;

  const currentDate = new Date();
  const time = currentDate.getTime();

  let header = [];
  let ids = [];

  for(let i = 0; i < maxPairsPerTable * 2 + 1; i++) {
    if(i === maxPairsPerTable) {
      header.push({
        id: "aisle",
        title: "AISLE"
      });

      continue;
    }

    const pairNumber = i > maxPairsPerTable ? i : i + 1;

    header.push({
      id: i,
      title: pairNumber
    });

    ids.push(i);
  }

  const csvWriter = createCsvWriter({
    path: `${csvPath}SwappingPositions-${time}.csv`,
    header
  });

  let tableData = [];

  while(pairs.length > 0) {
    tableData.push(pairs.splice(0, maxPairsPerTable));
  }

  let csvRecords = [];
  const defaultRecord = ids.reduce((acc, i) => {
    acc[i] = "";
    return acc;
  }, {});

  const defaultTableRecord = ids.reduce((acc, k) => {
    acc[k] = "-";
    return acc;
  }, {});

  for(let i = 0; i < tableData.length / 2; i++) {
    let upperSide = Object.assign({}, defaultRecord);
    let lowerSide = Object.assign({}, defaultRecord);
    let blankRow = Object.assign({}, defaultRecord);
    let tableRow = Object.assign({}, defaultTableRecord);

    const firstTable = tableData[2 * i];

    let id = 0;

    for(const pair of firstTable) {
      upperSide[id] = pair.first;
      lowerSide[id] = pair.second;
      id++;
    }

    if(2 * i + 1 >= tableData.length) {
      csvRecords.push(upperSide);
      csvRecords.push(tableRow);
      csvRecords.push(lowerSide);
      csvRecords.push(blankRow);
      continue;
    }

    const secondTable = tableData[2 * i + 1];

    id = maxPairsPerTable + 1;

    for(const pair of secondTable) {
      upperSide[id] = pair.first;
      lowerSide[id] = pair.second;
      id++;
    }

    csvRecords.push(upperSide);
    csvRecords.push(tableRow);
    csvRecords.push(lowerSide);
    csvRecords.push(blankRow);
  }

  // Save it to a file
  try {
    await csvWriter.writeRecords(csvRecords);
  } catch (error) {
    return res.status(500).end({ error });
  }

  res.set("Content-Type", "text/csv");

  return res.download(path.join(csvPath, `SwappingPositions-${time}.csv`), `SwappingPositions-${time}.csv`, () => {
    res.status(404).end();
  });
});

// Get the status
router.get("/status", async (req, res) => {
  const { user } = req.session;

  // Must have permission - maybe not necessary but users get info from socket instead
  if(!hasPermission(req.session, "events.swapping")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let openRecord;

  try {
    openRecord = await PersistentVariable.findOne({ where: { key: "SWAPPING_OPEN" } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the swapping status" });
  }

  return res.status(200).json({ open: openRecord.booleanStorage });
});

// Set the status
router.post("/status", async (req, res) => {
  const { user } = req.session;

  // Must have permission - maybe not necessary but users get info from socket instead
  if(!hasPermission(req.session, "events.swapping")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { open } = req.body;

  let openRecord;

  try {
    openRecord = await PersistentVariable.findOne({ where: { key: "SWAPPING_OPEN" } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the swapping status" });
  }

  openRecord.booleanStorage = open;

  try {
    await openRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the open record" });
  }

  // Update the clients via the socket
  req.io.to("swapClients").emit("swappingOpenClose", { open: openRecord.booleanStorage });
  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
