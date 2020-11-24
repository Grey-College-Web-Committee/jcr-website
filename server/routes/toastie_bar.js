// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, ToastieOrder, ToastieStock, ToastieOrderContent } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { hasPermission } = require("../utils/permissionUtils.js");

router.post("/order", async (req, res) => {
  const currentDate = new Date();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();

  // Ignore the time condition if we are developing it
  if(process.env.DEBUG.toLowerCase() === "false") {
    if((hours === 21 && minutes > 32) || hours < 20 || hours >= 22) {
      // Outside 8pm to 9:32pm
      // Past 9:32pm (instead of 9:30pm to avoid problems if users place orders just after 9:30pm)
      return res.status(400).json({ error: "Orders can only be placed between 8pm and 9:30pm", timeIssue: true });
    }
  }

  // User only
  const { user } = req.session;
  // Get the order from the data received
  const { bread, fillings, otherItems } = req.body;

  // Check the bread is actually a bread and is available

  const breadEntry = await ToastieStock.findOne({
    where: {
      id: bread,
      type: "bread"
    }
  });

  if(breadEntry === null && bread != -1) {
    return res.status(400).json({ error: "ID mismatch: bread" });
  }

  // breadEntry now has the database entry for this bread
  // Now check the fillings are actually fillings

  const fillingEntries = await ToastieStock.findAll({
    where: {
      id: fillings,
      available: true,
      type: "filling"
    }
  });

  if(fillingEntries.length !== fillings.length) {
    return res.status(400).json({ error: "Unable to verify fillings" });
  }

  // fillingEntries now has the database entries for each of the fillings
  // Now check the other items

  const otherEntries = await ToastieStock.findAll({
    where: {
      id: otherItems,
      available: true,
      type: ["chocolates", "crisps", "drinks"]
    }
  });

  if(otherEntries.length !== otherItems.length) {
    return res.status(400).json({ error: "Unable to verify other items" });
  }

  // Calculate the cost so we can give it to Stripe
  // never trust the user's price calculation

  let realCost = 0;
  const orderedToastie = (breadEntry !== null);

  if(orderedToastie) {
    realCost += Number(breadEntry.price);
  }

  let chocOrDrinkOrdered = false;

  fillingEntries.forEach(item => realCost += Number(item.price));
  otherEntries.forEach(item => {
    if(item.type === "chocolates" || item.type === "drinks") {
      chocOrDrinkOrdered = true;
    }

    realCost += Number(item.price);
  });

  // Apply a slight discount if they purchase a toastie and (choc or drink)
  if(orderedToastie && chocOrDrinkOrdered) {
    realCost -= 0.2;
  }

  realCost = +realCost.toFixed(2);

  // Make a new order in the database and add each item in the order
  // at the same time we construct the confirmed order to return to the client

  const dbOrder = await ToastieOrder.create({ userId: user.id });

  let confirmedOrder = [];

  if(breadEntry !== null) {
    confirmedOrder.push({
      name: breadEntry.name,
      price: breadEntry.price,
      type: breadEntry.type
    });
  }

  if(breadEntry !== null) {
    await ToastieOrderContent.create({ orderId: dbOrder.id, stockId: breadEntry.id });
  }

  fillingEntries.forEach(async (item) => {
    confirmedOrder.push({
      name: item.name,
      price: item.price,
      type: item.type
    });

    await ToastieOrderContent.create({ orderId: dbOrder.id, stockId: item.id });
  });

  otherEntries.forEach(async (item) => {
    confirmedOrder.push({
      name: item.name,
      price: item.price,
      type: item.type
    });

    await ToastieOrderContent.create({ orderId: dbOrder.id, stockId: item.id });
  });

  // Stripe uses this to take the payment

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(realCost * 100),
    currency: "gbp",
    metadata: { integration_check: "accept_a_payment" },
    description: `Toastie Bar Order #${dbOrder.id}`,
    metadata: {
      type: "toastie_bar",
      orderId: dbOrder.id
    },
    receipt_email: user.email
  });

  // Return the confirmed order, the server-agreed cost and the secret for the Stripe session

  return res.status(200).json({
    confirmedOrder,
    realCost,
    clientSecret: paymentIntent.client_secret
  });
});

// Get the stock available
router.get("/stock", async (req, res) => {
  // User only
  let stock;

  // Just finds all the items and returns them
  try {
    stock = await ToastieStock.findAll();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    return;
  }

  return res.status(200).json({ stock });
});

router.get("/stock/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "toastie.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Gets a single item by its ID
  const id = req.params.id;
  const stockItem = await ToastieStock.findOne({ where: { id } });

  if(stockItem === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  return res.status(200).json({ stockItem });
});

// Add a new item for the stock
router.post("/stock", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "toastie.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const { name, type, price, available } = req.body;

  if(name == null) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(type == null) {
    return res.status(400).json({ error: "Missing type" });
  }

  if(price == null) {
    return res.status(400).json({ error: "Missing price" });
  }

  if(available == null) {
    return res.status(400).json({ error: "Missing available" });
  }

  // Create the new item
  try {
    await ToastieStock.create({ name, type, price, available });
  } catch (error) {
    return res.status(500).json({ error: "Server error creating new item" });
  }

  return res.status(204).end();
});

// Update an item in the stock
router.put("/stock/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "toastie.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Find the item they want to update

  const stockId = req.params.id;
  const stockItem = await ToastieStock.findOne({ where: { id: stockId }});

  if(stockItem === null) {
    return res.status(400).json({ error: "Unknown id submitted" });
  }

  // Construct the changes to the record

  let updatedRecord = {}

  if(req.body.name !== undefined && req.body.name !== null) {
    updatedRecord.name = req.body.name;
  }

  if(req.body.type !== undefined && req.body.type !== null) {
    updatedRecord.type = req.body.type;
  }

  if(req.body.price !== undefined && req.body.price !== null) {
    updatedRecord.price = req.body.price;
  }

  if(req.body.available !== undefined && req.body.available !== null) {
    updatedRecord.available = req.body.available;
  }

  // Let sequelize update the record;

  try {
    await stockItem.update(updatedRecord);
  } catch (error) {
    return res.status(500).json({ error: "Server error: Unable to update the item" });
  }

  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
