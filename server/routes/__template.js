// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, Transaction, TransactionType } = require("../database.models.js");

// Called when a GET request is to be served at /api/<route>
router.get("/", async (req, res) => {
  // The user's session object. Contains all of the fields from the database.
  const { user } = req.session;

  return res.status(200).json({ message: "Success", data: {} });
});

// Called when a GET request is to be served at /api/<route>/all
router.get("/all", async (req, res) => {
  // The user's session object. Contains all of the fields from the database.
  const { user } = req.session;

  // Checks if the user is an admin
  if(!user.admin) {
    return res.status(403).json({ message: "You do not have permission to perform this action" });
  }

  return res.status(200).json({ message: "Success", data: {} });
});

// Called when a POST request is to be served at /api/<route>
router.post("/", async (req, res) => {
  // The user's session object. Contains all of the fields from the database.
  const { user } = req.session;

  return res.status(200).json({ message: "Success" });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
