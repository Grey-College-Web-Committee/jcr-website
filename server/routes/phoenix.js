// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, SpecialPhoenixEvent } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dateFormat = require("dateformat");
const path = require("path");

const csvPath = path.join(__dirname, "../exports/phoenix/");

// Called at the base path of your route with HTTP method GET
router.get("/", async (req, res) => {
  let { user } = req.session;
  let ticket;

  try {
    ticket = await SpecialPhoenixEvent.findOne({
      where: {
        userId: user.id,
        paid: true
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find any existing bookings" });
  }

  // Returns a 200 status code with a short JSON response
  return res.status(200).json({ booked: ticket !== null });
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

router.post("/export", async(req, res) => {
  // Must have permission
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let guests;

  try {
    guests = await SpecialPhoenixEvent.findAll({
      include: [ User ],
      where: {
        paid: true
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the guests" });
  }

  const currentDate = new Date();
  const time = currentDate.getTime();
  const fileLocation = `${time}`;

  const csvWriter = createCsvWriter({
    path: `${csvPath}PhoenixFestival-${fileLocation}.csv`,
    header: [
      { id: "username", title: "Username" },
      { id: "bookerFirstNames", title: "First Names" },
      { id: "bookerSurname", title: "Surname" },
      { id: "diet", title: "Dietary Requirements" },
      { id: "guestName", title: "Guest Name" },
      { id: "guestDiet", title: "Guest Dietary Requirements"},
      { id: "paid", title: "Paid"}
    ]
  });

  let csvRecords = [];

  guests.sort((a, b) => {
    const aName = a.User.surname.toLowerCase();
    const bName = b.User.surname.toLowerCase();

    return aName > bName ? 1 : (aName < bName ? -1 : 0);
  }).forEach(ticket => {
    let record = {};


    let firstName = ticket.User.firstNames.split(",")[0];
    firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
    const lastName = ticket.User.surname.charAt(0).toUpperCase() + ticket.User.surname.substr(1).toLowerCase();

    record.username = ticket.User.username;
    record.bookerFirstNames = ticket.User.firstNames;
    record.bookerSurname = ticket.User.surname;
    record.diet = ticket.diet;
    record.guestName = ticket.guestName === null ? "" : ticket.guestName;
    record.guestDiet = ticket.guestDiet === null ? "" : ticket.guestDiet;
    record.paid = ticket.paid;

    csvRecords.push(record);
  });

  try {
    await csvWriter.writeRecords(csvRecords);
  } catch (error) {
    return res.status(500).end({ error });
  }

  return res.status(200).json({ fileLocation });
});

router.get("/download/:file", async (req, res) => {
  // Must have permission
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const file = req.params.file;

  if(file === undefined || file === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  const split = file.split("-");
  const millisecondsStr = split[0];

  if(new Date().getTime() > Number(millisecondsStr) + 1000 * 60 * 60) {
    return res.status(410).end();
  }

  const pathName = path.join(csvPath, `PhoenixFestival-${file}.csv`)

  return res.download(pathName, `PhoenixFestival-${file}.csv`, () => {
    res.status(404).end();
  });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
