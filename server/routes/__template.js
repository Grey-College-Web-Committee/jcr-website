// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, ToastieOrder, ToastieStock, ToastieOrderContent } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { hasPermission } = require("../utils/permissionUtils.js");

router.get("/", async (req, res) => {
  return res.status(200).json({ success: true });
});

router.post("/", async (req, res) => {
  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
