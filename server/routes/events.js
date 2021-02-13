// Get express
const express = require("express");
const multer = require("multer");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Debt, Event, EventImage, EventTicketType, EventGroupBooking, EventTicket } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "uploads/images/events/" });

router.get("/", async (req, res) => {
  // Loads the 10 most recent events
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let records;

  // List the 10 most recent events
  // Exclude the long description
  // Include only the overview icon
  try {
    records = await Event.findAll({
      attributes: {
        exclude: [ "description", "maxIndividuals", "bookingCloseTime", "createdAt", "updatedAt" ]
      },
      limit: 10,
      include: [
        {
          model: EventImage,
          where: {
            position: "overview"
          },
          attributes: {
            exclude: [ "id", "eventId", "createdAt", "updatedAt" ]
          }
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load events from the database" });
  }

  // Send them back to the client
  return res.status(200).json({ consented: user.eventConsent, records });
});

router.post("/consent", async (req, res) => {
  // Grants and revokes consent for the events data sharing
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Briefly validate
  const { consented } = req.body;

  if(consented === null || consented === undefined) {
    return res.status(400).json({ error: "Missing consented" });
  }

  // Update the record
  try {
    await User.update({ eventConsent: consented }, {
      where: { id: user.id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the user record" });
  }

  user.eventConsent = consented;

  // Success
  return res.status(204).end();
});

router.get("/consent", async (req, res) => {
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  return res.status(200).json({ consent: user.eventConsent });
})

router.post("/create", upload.array("images"), async (req, res) => {
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // TODO: Should check that these properties actually exist
  // Get the data and images from multer
  const { name, date, shortDescription, description, maxIndividuals, bookingCloseTime, ticketTypes, imageData } = JSON.parse(req.body.packaged);
  const images = req.files;

  // This is all very similar to the validateSubmission on the frontend
  // Check the values are defined

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(date === undefined || date === null || date.length === 0) {
    return res.status(400).json({ error: "Missing date" });
  }

  if(shortDescription === undefined || shortDescription === null || shortDescription.length === 0) {
    return res.status(400).json({ error: "Missing shortDescription" });
  }

  if(description === undefined || description === null || description.length === 0) {
    return res.status(400).json({ error: "Missing description" });
  }

  if(maxIndividuals === undefined || maxIndividuals === null || maxIndividuals.length === 0) {
    return res.status(400).json({ error: "Missing maxIndividuals" });
  }

  if(bookingCloseTime === undefined || bookingCloseTime === null || bookingCloseTime.length === 0) {
    return res.status(400).json({ error: "Missing bookingCloseTime" });
  }

  if(ticketTypes === undefined || ticketTypes === null || ticketTypes.length === 0) {
    return res.status(400).json({ error: "Missing ticketTypes" });
  }

  if(images === undefined || images === null || images.length === 0) {
    return res.status(400).json({ error: "Missing images" });
  }

  if(imageData === undefined || imageData === null || imageData.length === 0) {
    return res.status(400).json({ error: "Missing image data" });
  }

  if(images.length !== imageData.length) {
    return res.status(400).json({ error: "Image data does not match the images uploaded" });
  }

  // Now validate the ticket types

  const ticketTypeStringProps = [
    "name",
    "description",
    "firstYearReleaseTime",
    "secondYearReleaseTime",
    "thirdYearReleaseTime",
    "fourthYearReleaseTime"
  ];

  const ticketTypeIntegerProps = [
    "maxOfType",
    "maxPeople",
    "maxGuests",
    "minPeople"
  ];

  const ticketTypeFloatProps = [
    "memberPrice",
    "guestPrice"
  ];

  const ticketTypeBooleanProps = [
    "olderYearsCanOverride"
  ];

  // For all of this, refer to the validateSubmission() in /frontend/src/components/events/admin/create/CreateNewEventPage.js

  for(const ticketTypeId in Object.keys(ticketTypes)) {
    const ticketType = ticketTypes[ticketTypeId];
    for(const property in ticketType) {
      if(ticketTypeStringProps.includes(property) || ticketTypeBooleanProps.includes(property)) {
        if(ticketType[property] === undefined || ticketType[property] === null || ticketType[property].length === 0) {
          return res.status(400).json({ error: `Missing ${property} in ticket type ${ticketType["name"]}` });
        }
      } else if (ticketTypeIntegerProps.includes(property)) {
        if(ticketType[property] === undefined || ticketType[property] === null || ticketType[property].length === 0) {
          return res.status(400).json({ error: `Missing ${property} in ticket type ${ticketType["name"]}` });
        }

        const asInt = parseInt(ticketType[property]);

        if(isNaN(asInt)) {
          return res.status(400).json({ error: `${property} must be a number` });
        }

        if(asInt < 0) {
          return res.status(400).json({ error: `Missing ${property} must be a non-negative value` });
        }
      } else if (ticketTypeFloatProps.includes(property)) {
        if(ticketType[property] === undefined || ticketType[property] === null || ticketType[property].length === 0) {
          return res.status(400).json({ error: `Missing ${property} in ticket type ${ticketType["name"]}` });
        }

        const asFloat = parseFloat(ticketType[property]);

        if(isNaN(asFloat)) {
          return res.status(400).json({ error: `${property} must be a number` });
        }

        if(asFloat < 0) {
          return res.status(400).json({ error: `Missing ${property} must be a non-negative value` });
        }
      } else if (property === "customData") {
        const customData = ticketType[property];

        if(Object.keys(customData).length === 0) {
          continue;
        }

        for(const customFieldId in Object.keys(customData)) {
          const customField = customData[customFieldId];

          if(customField.name.length === 0) {
            return res.status(400).json({ error: `Custom field name missing in ${ticketType.name}` });
          }

          if(customField.type.length === 0) {
            return res.status(400).json({ error: `Custom field type missing in ${ticketType.name}` });
          }

          if(Object.keys(customField.dropdownValues).length === 0) {
            if(customField.type === "dropdown") {
              return res.status(400).json({ error: `Custom dropdown ${customField.name} in ${ticketType.name} is empty` });
            }

            continue;
          }

          for(const customDropdownRowId in Object.keys(customField.dropdownValues)) {
            const customDropdownRow = customField.dropdownValues[customDropdownRowId];

            if(customDropdownRow.value.length === 0) {
              return res.status(400).json({ error: `Custom dropdown value is empty in ticket type ${ticketType.name}, custom field ${customField.name}` });
            }
          }
        }
      } else {
        return res.status(400).json({ error: `Unknown property ${property}` });
      }
    }
  }

  // Finally validate the images

  const types = imageData.map(image => image.position);

  if(!types.includes("overview") || !types.includes("banner") || !types.includes("gallery")) {
    return res.status(400).json({ error: "Must set at least 1 image of each type" });
  }

  // Everything is validated so now save the details

  // First make the event
  let eventRecord;

  try {
    eventRecord = await Event.create({ name, shortDescription, description, maxIndividuals, bookingCloseTime, date });
  } catch (error) {
    return res.status({ error: "Unable to create the event - database error" });
  }

  // Now add the images
  for(let i = 0; i < imageData.length; i++) {
    const imageFileData = images[i];
    const { caption, position } = imageData[i];

    try {
      await EventImage.create({
        eventId: eventRecord.id,
        image: imageFileData.filename,
        caption,
        position
      });
    } catch (error) {
      return res.status(500).json({ error: `Unable to upload an image (${imageFileData.originalname})` });
    }
  }

  // Now add the event ticket types
  for(let i = 0; i < ticketTypes.length; i++) {
    // Stringify the JSON object and remove from the ticketType so we can use the spread operator
    const customData = JSON.stringify(ticketTypes[i].customData);
    delete ticketTypes[i].customData;

    // Create the record
    try {
      await EventTicketType.create({
        eventId: eventRecord.id,
        ...ticketTypes[i],
        requiredInformationForm: customData
      });
    } catch (error) {
      return res.status(500).json({ error: `Unable to create event ticket type with name ${ticketTypes[i].name}`})
    }
  }

  // All done
  return res.status(200).json({ id: eventRecord.id });
});

router.get("/single/:id", async (req, res) => {
  // Gets the details about a single event
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const id = req.params.id;

  // Validate the id briefly
  if(!id || id === null || id === undefined) {
    return res.status(400).json({ error: "Missing id" });
  }

  let record;

  // Find the record by the id
  try {
    record = await Event.findOne({
      where: { id },
      include: [ EventImage, EventTicketType ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the event from the database" });
  }

  if(record === null) {
    return res.status(400).json({ error: "Invalid id, no record found" });
  }

  // Send it to the client
  return res.status(200).json({ record });
})

router.get("/ticketType/:id", async (req, res) => {
  // Gets the details about a single ticket type and if it is available (to this user)
  // If it is not available then it will also give information about why
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const id = req.params.id;

  // Validate the id briefly
  if(!id || id === null || id === undefined) {
    return res.status(400).json({ error: "Missing id" });
  }

  let record;

  // Find the record by the id
  try {
    record = await EventTicketType.findOne({
      where: { id },
      include: [
        {
          model: Event,
          attributes: [ "name", "maxIndividuals", "bookingCloseTime" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the event from the database" });
  }

  if(record === null) {
    return res.status(400).json({ error: "Invalid ID, no record found" });
  }

  // TODO: MUST REFINE THE RECORD BEFORE SENDING

  // First we need to check that booking hasn't closed
  const now = new Date();

  if(now > new Date(record.Event.bookingCloseTime)) {
    return res.status(200).json({
      available: false,
      reason: "closed",
      release,
      record
    });
  }

  // Then lets check if it has been released for this year
  const { year } = user;
  let release = null;

  if(year === "1" || year === 1) {
    release = new Date(record.firstYearReleaseTime);
  } else if (year === "2" || year === 2) {
    release = new Date(record.secondYearReleaseTime);
  } else if (year === "3" || year === 3) {
    release = new Date(record.thirdYearReleaseTime);
  } else {
    release = new Date(record.fourthYearReleaseTime);
  }

  // If it releases for them after now then tell them
  if(release > now) {
    return res.status(200).json({
      available: false,
      reason: "unreleased",
      release,
      record
    });
  }

  // We now know that booking is open and released for this user
  // Now lets check if the event is already full

  let allBookingCounts;

  try {
    allBookingCounts = await EventGroupBooking.findAll({
      where: { eventId: record.eventId },
      attributes: [ "totalMembers", "ticketTypeId" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load the event bookings" });
  }

  // Map to the total members per group and then sum the result
  const totalTicketsOfAllTypes = allBookingCounts.map(booking => booking.totalMembers).reduce((acc, value) => acc + value, 0);

  // The event is sold out entirely
  if(totalTicketsOfAllTypes >= record.Event.maxIndividuals) {
    return res.status(200).json({
      available: false,
      reason: "full:all",
      release,
      record
    });
  }

  // There is limited space but not enough for this type of ticket
  const remainingIndividualSpaces = record.Event.maxIndividuals - totalTicketsOfAllTypes;
  if(remainingIndividualSpaces < record.minPeople) {
    return res.status(200).json({
      available: false,
      reason: "full:limited",
      release,
      record
    });
  }

  // Filter to this ticket type only then count how many there are
  const totalBookingsOfThisType = allBookingCounts.filter(booking => booking.ticketTypeId === record.id).length;
  const remainingSpacesOfType = record.maxOfType - totalBookingsOfThisType;

  // The ticket is sold entirely
  if(remainingSpacesOfType <= 0) {
    return res.status(200).json({
      available: false,
      reason: "full:type",
      release,
      record
    });
  }

  return res.status(200).json({
    available: true,
    reason: "N/A",
    capacity: {
      remainingIndividualSpaces,
      remainingSpacesOfType
    },
    release,
    record
  });
});

router.get("/search/member/:ticketTypeId/:username", async (req, res) => {
  // Gets the details about a single event
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { username, ticketTypeId } = req.params;

  // Validate the username briefly
  if(!username || username === null || username === undefined) {
    return res.status(400).json({ error: "You must enter a username to search" });
  }

  if(username.length !== 6) {
    return res.status(400).json({ error: "The username must be exactly 6 characters" });
  }

  // Validate the ticketTypeId briefly
  if(ticketTypeId === null || ticketTypeId === undefined) {
    return res.status(400).json({ error: "Missing ticketTypeId" });
  }

  let member;

  try {
    member = await User.findOne({
      where: { username },
      attributes: [ "id", "username", "surname", "firstNames", "year", "membershipExpiresAt", "eventConsent" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred completing this request, please try again later (#1)" });
  }

  if(member === null) {
    return res.status(400).json({ error: "The username entered does not match any user. Please check that the username is correct and that the person you are trying to find has logged in to the new website at least once" });
  }

  const now = new Date();

  if(member.membershipExpiresAt === null || now > new Date(member.membershipExpiresAt)) {
    return res.status(400).json({ error: "The user you are trying to find does not have a JCR membership. You may still be able to bring them as a guest (if the ticket type allows)." });
  }

  let debt;

  try {
    debt = await Debt.findOne({
      where: { username: member.username }
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred completing this request, please try again later (#2)" });
  }

  if(debt !== null) {
    return res.status(400).json({ error: "The user you are trying to find has an outstanding debt owed to the JCR. They are not allowed to be booked on to events until this is cleared" });
  }

  // Now check if they already have a ticket for the event
  let ticket;

  try {
    ticket = await EventTicket.findOne({
      where: { bookerId: member.id }
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred completing this request, please try again later (#3)" });
  }

  if(ticket !== null) {
    return res.status(400).json({ error: "The user you are trying to find is already part of a group for this event." });
  }

  // We also need to check that the tickets have released for this year group

  let ticketType;

  try {
    ticketType = await EventTicketType.findOne({
      where: { id: ticketTypeId }
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred completing this request, please try again later (#4)" });
  }

  if(ticketType === null) {
    return res.status(400).json({ error: "The ticket type you are trying to search with respect to does not exist" });
  }

  if(!ticketType.olderYearsCanOverride) {
    const { year } = member;
    let release = null;

    if(year === "1" || year === 1) {
      release = new Date(ticketType.firstYearReleaseTime);
    } else if (year === "2" || year === 2) {
      release = new Date(ticketType.secondYearReleaseTime);
    } else if (year === "3" || year === 3) {
      release = new Date(ticketType.thirdYearReleaseTime);
    } else {
      release = new Date(ticketType.fourthYearReleaseTime);
    }

    if(release > now) {
      return res.status(400).json({ error: `This ticket type has not yet released for those in year ${year} yet.` })
    }
  }

  return res.status(200).json({ member });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
