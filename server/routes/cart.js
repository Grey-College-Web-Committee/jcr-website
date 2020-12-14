// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, ToastieOrder, ToastieStock, ToastieOrderContent, Permission, PermissionLink } = require("../database.models.js");
// Stripe if it is needed
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

const processToastieShop = () => {

};

const shopProcessors = {
  "toastie": processToastieShop
}

// Called at the base path of your route with HTTP method POST
router.post("/process", async (req, res) => {

  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
