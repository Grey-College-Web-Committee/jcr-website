// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, SpecialPhoenixEvent } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Called at the base path of your route with HTTP method GET
router.get("/", async (req, res) => {
  // Returns a 200 status code with a short JSON response
  return res.status(200).json({ success: true });
});

router.post("/create", async (req, res) => {
  const { guestName, myDiet, guestDiet } = req.body;

  if(myDiet === undefined || myDiet === null || myDiet.length === 0) {
    return res.status(400).json({ error: "Missing myDiet" });
  }

  if(guestName !== undefined && guestName !== null && guestName !== "") {
    if(!hasPermission(req.session, "jcr.member")) {
      return res.status(401).json({ error: "You must be a JCR member to book a guest" });
    }

    if(guestDiet === undefined || guestDiet === null || guestDiet.length === 0) {
      return res.status(400).json({ error: "Missing guestDiet" });
    }
  }

  let { user } = req.session;
  let existingBookings;

  try {
    existingBookings = await SpecialPhoenixEvent.findAll({
      where: {
        userId: user.id,
        paid: true
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check for existing bookings" });
  }

  if(existingBookings.length !== 0) {
    return res.status(400).json({ error: "You already have a booking" });
  }

  let ticket;

  try {
    ticket = await SpecialPhoenixEvent.create({
      userId: user.id,
      guestName,
      paid: false,
      diet: myDiet,
      guestDiet
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the event booking" });
  }

  let totalCost = 5500;

  // Non member
  if(!hasPermission(req.session, "jcr.member")) {
    totalCost = 6500;

    if(guestName !== undefined && guestName !== null && guestName !== "") {
      return res.status(400).json({ error: "Only JCR members can book guests" });
    }
  } else {
    // JCR + guest
    if(guestName !== undefined && guestName !== null && guestName !== "") {
      totalCost = 12000;
    }
  }

  let metadata = {
    ticketId: ticket.id,
    phoenix_event: totalCost,
    phoenix_event_net: Math.round(totalCost - ((0.014 * totalCost) + 20)),
    event_name: "Phoenix Ball Replacement",
  }

  let paymentIntent;

  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost,
      currency: "gbp",
      payment_method_types: ["card"],
      capture_method: "manual",
      receipt_email: user.email,
      metadata,
      description: `Phoenix Ball Replacement Event Ticket`
    });
  } catch (error) {
    console.log({error})
    return res.status(500).json({ error: "Unable to create the payment intent" });
  }

  ticket.stripePaymentId = paymentIntent.id;

  try {
    await ticket.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the payment intent ID" });
  }

  const clientSecret = paymentIntent.client_secret;

  return res.status(200).json({ totalCost, clientSecret });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
