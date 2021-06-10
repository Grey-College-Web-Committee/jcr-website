// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, PersistentVariable, GreyDayGuest, EventGroupBooking } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.get("/", async (req, res) => {
  // Get the number of available tickets, their booking status, and whether they have brought a guest ticket already

  // Max guest tickets
  let maxTicketRecord;

  try {
    maxTicketRecord = await PersistentVariable.findOne({
      where: {
        key: "GREY_DAY_TICKETS"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the max number of tickets" });
  }

  if(maxTicketRecord === null) {
    return res.status(500).json({ error: "Null PV record for GREY_DAY_TICKETS" });
  }

  const maxTickets = Number(maxTicketRecord.intStorage);

  // Count of purchased tickets

  let purchasedTicketRecords;

  try {
    purchasedTicketRecords = await GreyDayGuest.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the purchased guest tickets" });
  }

  const availableTickets = maxTickets - purchasedTicketRecords.length;

  let openRecord;

  try {
    openRecord = await PersistentVariable.findOne({
      where: {
        key: "GREY_DAY_GUEST_OPEN"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the guest ticket" });
  }

  if(openRecord === null) {
    return res.status(500).json({ error: "Null PV record for GREY_DAY_GUEST_OPEN" });
  }

  const greyDayBookingOpen = openRecord.booleanStorage

  // Here we need to check if they are a logged in user or not

  if(!(req.session && req.session.user && req.cookies.user_sid)) {
    return res.status(200).json({ loggedIn: false, availableTickets, hasGreyDayBooking: false, hasGuestTicket: false, greyDayBookingOpen });
  }

  const { user } = req.session;

  // Now check if they have a Grey Day ticket themselves
  // First get the event ID
  let eventIdRecord;

  try {
    eventIdRecord = await PersistentVariable.findOne({
      where: {
        key: "GREY_DAY_EVENT_ID"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the event ID" });
  }

  if(eventIdRecord === null) {
    return res.status(500).json({ error: "Null PV record for GREY_DAY_EVENT_ID" });
  }

  const greyDayEventId = Number(eventIdRecord.intStorage);

  // Check if they have a Grey Day ticket themselves
  let myGreyDayRecord;

  try {
    myGreyDayRecord = await EventGroupBooking.findOne({
      where: {
        allPaid: true,
        eventId: greyDayEventId,
        leadBookerId: user.id
      }
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the ticket purchase status of the user" });
  }

  const hasGreyDayBooking = myGreyDayRecord !== null;

  // Finally, check if they have purchased a Grey Day Guest ticket
  let myGuestTicket;

  try {
    myGuestTicket = await GreyDayGuest.findOne({
      where: {
        userId: user.id
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the ticket purchase status for guests of the user" });
  }

  const hasGuestTicket = myGuestTicket !== null

  return res.status(200).json({ loggedIn: true, availableTickets, hasGreyDayBooking, hasGuestTicket, greyDayBookingOpen });
});

router.get("/admin", async (req, res) => {
  // Here we need to check if they are a logged in user or not

  if(!(req.session && req.session.user && req.cookies.user_sid)) {
    return res.status(200).json({ loggedIn: false, availableTickets, hasGreyDayBooking: false, hasGuestTicket: false });
  }

  // Must have permission
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Max guest tickets
  let maxTicketRecord;

  try {
    maxTicketRecord = await PersistentVariable.findOne({
      where: {
        key: "GREY_DAY_TICKETS"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the max number of tickets" });
  }

  if(maxTicketRecord === null) {
    return res.status(500).json({ error: "Null PV record for GREY_DAY_TICKETS" });
  }

  const maxTickets = Number(maxTicketRecord.intStorage);

  // Count of purchased tickets

  let purchasedTicketRecords;

  try {
    purchasedTicketRecords = await GreyDayGuest.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the purchased guest tickets" });
  }

  const availableTickets = maxTickets - purchasedTicketRecords.length;

  // First get the event ID
  let eventIdRecord;

  try {
    eventIdRecord = await PersistentVariable.findOne({
      where: {
        key: "GREY_DAY_EVENT_ID"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the event ID" });
  }

  if(eventIdRecord === null) {
    return res.status(500).json({ error: "Null PV record for GREY_DAY_EVENT_ID" });
  }

  const greyDayEventId = Number(eventIdRecord.intStorage);

  // Get the open status
  let openRecord;

  try {
    openRecord = await PersistentVariable.findOne({
      where: {
        key: "GREY_DAY_GUEST_OPEN"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the open status" });
  }

  if(openRecord === null) {
    return res.status(500).json({ error: "Null PV record for GREY_DAY_GUEST_OPEN" });
  }

  const greyDayBookingOpen = openRecord.booleanStorage;

  return res.status(200).json({ greyDayEventId, maxTickets, availableTickets, greyDayBookingOpen })
});

router.post("/update/max", async (req, res) => {
  // Here we need to check if they are a logged in user or not

  if(!(req.session && req.session.user && req.cookies.user_sid)) {
    return res.status(200).json({ loggedIn: false, availableTickets, hasGreyDayBooking: false, hasGuestTicket: false });
  }

  // Must have permission
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { maxTickets } = req.body;

  if(maxTickets === undefined || maxTickets === null) {
    return res.status(400).json({ error: "Missing maxTickets" });
  }

  try {
    await PersistentVariable.update({ intStorage: maxTickets }, {
      where: {
        key: "GREY_DAY_TICKETS"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the maxTickets" });
  }

  return res.status(204).end();
});

router.post("/update/open", async (req, res) => {
  // Here we need to check if they are a logged in user or not

  if(!(req.session && req.session.user && req.cookies.user_sid)) {
    return res.status(200).json({ loggedIn: false, availableTickets, hasGreyDayBooking: false, hasGuestTicket: false });
  }

  // Must have permission
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { open } = req.body;

  if(open === undefined || open === null) {
    return res.status(400).json({ error: "Missing open" });
  }

  try {
    await PersistentVariable.update({ booleanStorage: open }, {
      where: {
        key: "GREY_DAY_GUEST_OPEN"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the open status" });
  }

  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
