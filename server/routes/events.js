// Get express
const express = require("express");
const multer = require("multer");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Event, EventImage, EventTicketType, EventGroupBooking, EventTicket } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "events/" });

router.get("/", async (req, res) => {
  return res.status(200).json({ success: true });
});

router.post("/create", upload.array("images"), async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, date, shortDescription, description, maxIndividuals, bookingCloseTime, ticketTypes, imageData } = JSON.parse(req.body.packaged);

  console.log(req.files);
  console.log(name);
  console.log(date);
  console.log(shortDescription);
  console.log(description);
  console.log(maxIndividuals);
  console.log(bookingCloseTime);
  console.log(JSON.stringify(ticketTypes, null, 2));
  console.log(JSON.stringify(imageData, null, 2));

  return res.status(200).json({ success: true });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
