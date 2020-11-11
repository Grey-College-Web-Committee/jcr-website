// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, GymMembership, Transaction, TransactionType } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;


// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
