// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, GymMembership } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const bodyParser = require('body-parser');

router.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ "error": "Webhook signature verification failed "});
  }

  switch(event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;

      if(!paymentIntent.metadata) {
        break;
      }

      if(!paymentIntent.metadata.type) {
        break;
      }

      switch(paymentIntent.metadata.type) {
        case "toastie_bar":
          processToastieBarOrder(paymentIntent);
          break;
        default:
          break;
      }

      break;
    default:
      break;
  }

  return res.status(200);
});

processToastieBarOrder = (paymentIntent) => {
  const order = JSON.parse(paymentIntent.metadata.order);
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
