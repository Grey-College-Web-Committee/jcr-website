// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, ToastieOrder, ToastieStock, ToastieOrderContent, Permission, PermissionLink } = require("../database.models.js");
// Stripe if it is needed
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

// Called at the base path of your route with HTTP method GET
router.get("/", async (req, res) => {
  // Returns a 200 status code with a short JSON response
  return res.status(200).json({ success: true });
});

// Called at the base path of your route with HTTP method POST
router.post("/", async (req, res) => {
  // Must put .end() if not using .json() otherwise it will timeout
  // and you'll get unexpected behaviour. 204 is success but no content
  return res.status(204).end();
});

// Called at the /admin of your route with HTTP method GET
// Requires your specified permission to access
router.get("/admin", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "YourPermissionHere")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Returns a 200 status code with a short JSON response
  return res.status(200).json({ userHadPermission: true });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
