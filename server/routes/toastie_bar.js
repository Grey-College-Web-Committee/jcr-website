// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, ToastieOrder, ToastieStock, ToastieOrderContent } = require("../database.models.js");

// Get the stock available
router.get("/stock", async (req, res) => {
  // User only
  let stock;

  try {
    stock = await ToastieStock.findAll();
  } catch (error) {
    //handle
    return;
  }

  return res.status(200).json({ stock });
});

// Add a new item for the stock
router.post("/stock", async (req, res) => {
  // Admin only
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

  try {
    await ToastieStock.create({ name, type, price, available });
  } catch (error) {
    //handle
    return;
  }

  return res.status(200).json({});
});

// Update an item in the stock
router.patch("/stock", async (req, res) => {
  // Admin only
});

// Delete an item from the stock
router.delete("/stock", async (req, res) => {
  // Admin only
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
