// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, GymMembership } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

const createPaymentIntent = async (total) => {
  const intent = await stripe.paymentIntents.create({
    amount: total,
    currency: "gbp",
    metadata: { integration_check: "accept_a_payment" }
  });
}

// Called when a GET request is to be served at /api/payments/create_checkout
router.get("/create_checkout", async (req, res) => {
  /*
  Expects a request in the format:
  {
    "type": "toastie_bar",
    "items": {
      "topping_id": quantity
    }
  }
  */
  const { type, items } = req.body;

  if(type == null) {
    //handle
    return;
  }

  if(items == null) {
    //handle
    return;
  }

  return res.status(200).json({ message: "Success", data: {} });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
