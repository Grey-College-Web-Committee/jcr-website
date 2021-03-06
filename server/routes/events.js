// Get express
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Debt, Event, EventImage, EventTicketType, EventGroupBooking, EventTicket } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "uploads/images/events/" });
const mailer = require("../utils/mailer");
const dateFormat = require("dateformat");
const { Op } = require("sequelize");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvPath = path.join(__dirname, "../exports/events/");

router.get("/", async (req, res) => {
  // Loads the 10 most recent events
  const { user } = req.session;

  // Must be a member to list the events
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
        exclude: [ "description", "maxIndividuals", "createdAt", "updatedAt" ]
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

  // Must be a member to set their consent
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

  // Must be a member to get their own consent
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
  const { name, date, shortDescription, description, maxIndividuals, bookingCloseTime, inviteOnly, ticketTypes, imageData } = JSON.parse(req.body.packaged);
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

  if(inviteOnly === undefined || inviteOnly === null) {
    return res.status(400).json({ error: "Missing inviteOnly" });
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
    eventRecord = await Event.create({ name, shortDescription, description, maxIndividuals, bookingCloseTime, date, inviteOnly });
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

  // Must be a member to get the event
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

  // Must be a member to get the ticket type
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
          attributes: [ "id", "name", "maxIndividuals", "bookingCloseTime", "inviteOnly" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the event from the database" });
  }

  if(record === null) {
    return res.status(400).json({ error: "Invalid ID, no record found" });
  }

  if(!user.eventConsent) {
    return res.status(200).json({
      available: false,
      reason: "not_consented",
      release: null,
      record
    });
  }

  if(record.Event.inviteOnly) {
    return res.status(200).json({
      available: false,
      reason: "invite_only",
      release: null,
      record
    });
  }

  // Check for a debt

  let debt;

  try {
    debt = await Debt.findOne({
      where: { username: user.username }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the debt from the database" });
  }

  if(debt !== null) {
    return res.status(200).json({
      available: false,
      reason: "in_debt",
      release: null,
      record
    });
  }

  // Check if they already have a ticket

  let ticket;

  try {
    ticket = await EventTicket.findOne({
      where: {
        bookerId: user.id
      },
      include: [
        {
          model: EventGroupBooking,
          where: {
            eventId: record.Event.id,
          }
        }
      ]
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Unable to get event ticket from database" });
  }

  if(ticket !== null) {
    return res.status(200).json({
      available: false,
      reason: "already_booked",
      release: null,
      record
    });
  }

  // TODO: MUST REFINE THE RECORD BEFORE SENDING

  // First we need to check that booking hasn't closed
  const now = new Date();

  if(now > new Date(record.Event.bookingCloseTime)) {
    return res.status(200).json({
      available: false,
      reason: "closed",
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

  if(!member.eventConsent) {
    return res.status(400).json({ error: "The user you are trying to find has not consented to the terms and conditions for events." });
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

  // We also need to check that the tickets have released for this year group

  let ticketType;

  try {
    ticketType = await EventTicketType.findOne({
      where: { id: ticketTypeId },
      include: [
        {
          model: Event,
          attributes: [ "id" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred completing this request, please try again later (#4)" });
  }

  try {
    ticket = await EventTicket.findOne({
      where: {
        bookerId: user.id
      },
      include: [
        {
          model: EventGroupBooking,
          where: {
            eventId: ticketType.Event.id,
          }
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred completing this request, please try again later (#3)" });
  }

  if(ticket !== null) {
    return res.status(400).json({ error: "The user you are trying to find is already part of a group for this event." });
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

router.post("/booking", async (req, res) => {
  // Creates a booking
  const { user } = req.session;

  // Must be a member to create a booking
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { group, ticketTypeId } = req.body;

  // Do some quick validation on the data
  if(group === undefined || group === null || group.length === 0) {
    return res.status(400).json({ error: "No group submitted" });
  }

  if(ticketTypeId === undefined || ticketTypeId === null) {
    return res.status(400).json({ error: "No ticketTypeId submitted" });
  }

  // Now we do more in-depth validation on the group
  for(const groupMember of group) {
    // Check that each object has the following properties
    if(!groupMember.hasOwnProperty("id")) {
      return res.status(400).json({ error: "Missing ID for a member of your group" });
    }

    if(!groupMember.hasOwnProperty("username")) {
      return res.status(400).json({ error: "Missing username for a member of your group" });
    }

    if(!groupMember.hasOwnProperty("displayName")) {
      return res.status(400).json({ error: "Missing displayName for a member of your group" });
    }

    if(!groupMember.hasOwnProperty("guest")) {
      return res.status(400).json({ error: "Missing guest for a member of your group" });
    }

    const { id, username, displayName, guest } = groupMember;

    // Make sure ID is defined
    if(id === undefined) {
      return res.status(400).json({ error: "ID is undefined for a member of your group" });
    }

    // Make sure username is defined and exactly 6 characters
    if(username === undefined || username === null) {
      return res.status(400).json({ error: "username is missing for a member of your group" });
    }

    if(username !== "n/a" && username.length !== 6) {
      return res.status(400).json({ error: "username must be 6 characters long (or n/a)"});
    }

    // Make sure displayName is defined
    if(displayName === undefined || displayName === null || displayName.length === 0) {
      return res.status(400).json({ error: "displayName is missing for a member of your group" });
    }

    // Make sure guest is defined
    if(guest === undefined) {
      return res.status(400).json({ error: "guest is missing for a member of your group" });
    }

    // Guests don't have an ID
    if(!guest && id === null) {
      return res.status(400).json({ error: "guest is false and id is missing for a member of your group" });
    }
  }

  // Now we need to check that there is space for them to book

  let record;

  // Find the record by the id
  try {
    record = await EventTicketType.findOne({
      where: { id: ticketTypeId },
      include: [
        {
          model: Event,
          attributes: [ "id", "name", "maxIndividuals", "bookingCloseTime" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the event ticket type from the database" });
  }

  if(record === null) {
    return res.status(400).json({ error: "Invalid ticket type ID, no record found" });
  }

  // First we need to check that booking hasn't closed
  const now = new Date();

  if(now > new Date(record.Event.bookingCloseTime)) {
    return res.status(400).json({ error: "Booking has closed" });
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
    return res.status(400).json({ error: "This event is already sold out" });
  }

  // There is limited space but not enough for this type of ticket
  const remainingIndividualSpaces = record.Event.maxIndividuals - totalTicketsOfAllTypes;

  if(remainingIndividualSpaces < group.length) {
    return res.status(400).json({ error: "There is not enough space on the event for your group" });
  }

  // Filter to this ticket type only then count how many there are
  const totalBookingsOfThisType = allBookingCounts.filter(booking => booking.ticketTypeId === record.id).length;
  const remainingSpacesOfType = record.maxOfType - totalBookingsOfThisType;

  // The ticket is sold entirely
  if(remainingSpacesOfType <= 0) {
    return res.status(400).json({ error: "There are no more tickets of this type available" });
  }

  // TODO: Validate min and maxs

  // There are tickets available
  // Now we get the user records for each member

  // We only want those that aren't guests
  const ids = group.filter(member => member.guest === false).map(member => member.id);

  let jcrMembers;

  try {
    jcrMembers = await User.findAll({
      where: {
        id: ids
      },
      include: [
        {
          model: EventGroupBooking,
          where: {
            eventId: record.Event.id
          },
          required: false
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the members against the database" });
  }

  let realJCRMembers = [];

  for(const jcrMember of jcrMembers) {
    let givenData = group.filter(m => m.id === jcrMember.id);

    if(givenData.length === 0) {
      return res.status(500).json({ error: "Unexpected length assertion failed" });
    }

    const { id, username, membershipExpiresAt } = jcrMember;
    givenData = givenData[0];

    if(givenData.username !== username) {
      return res.status(400).json({ error: "Inconsistent username submitted" });
    }

    // Check their debt status
    let debtRecord;

    try {
      debtRecord = await Debt.findOne({ where: { username: givenData.username }});
    } catch (error) {
      return res.status(500).json({ error: "Unable to check the debt status" });
    }

    // If they have a debt record then prevent them booking
    if(debtRecord !== null) {
      return res.status(400).json({ error: `${username} has a debt owed to the JCR` });
    }

    // Check they don't already have a ticket
    if(jcrMember.EventGroupBookings.length !== 0) {
      return res.status(400).json({ error: `${username} already has a ticket for this event` });
    }

    // Make sure they have a valid membership
    if(membershipExpiresAt === null || now > new Date(membershipExpiresAt)) {
      return res.status(400).json({ error: `${username} does not have a JCR membership and must be booked on as a guest instead` });
    }

    // Check for whether older years can book younger years regardless of the release time
    if(!record.olderYearsCanOverride) {
      const { year } = jcrMember;
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

      // If it releases for them after now then prevent the booking
      if(release > now) {
        return res.status(400).json({ error: `Booking has not opened for members in year ${year} yet` });
      }
    }

    realJCRMembers.push({
      id,
      email: jcrMember.email
    });
  }

  const guestList = group.filter(m => m.guest === true);
  const totalMembers = guestList.length + realJCRMembers.length;

  // Think everything is checked at this point so we can actually make the booking

  let groupBooking;

  try {
    groupBooking = await EventGroupBooking.create({
      eventId: record.Event.id,
      leadBookerId: user.id,
      ticketTypeId,
      totalMembers
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the booking in the database" });
  }

  let emails = [];
  let leadTicketId = null;

  // Have the booking so now we create the tickets for the members first
  for(const jcrGroupMember of realJCRMembers) {
    let ticket;

    try {
      ticket = await EventTicket.create({
        groupId: groupBooking.id,
        bookerId: jcrGroupMember.id
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create the ticket for a member of the group" });
    }

    if(jcrGroupMember.id === user.id) {
      leadTicketId = ticket.id;
    }

    emails.push({
      email: jcrGroupMember.email,
      ticket
    });
  }

  // Now we create the tickets for the guests
  for(const guest of guestList) {
    let ticket;

    try {
      ticket = await EventTicket.create({
        groupId: groupBooking.id,
        bookerId: user.id,
        isGuestTicket: true,
        guestName: guest.displayName,
        guestUsername: guest.username
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create the ticket for a guest of the group" });
    }
  }

  // Now we send the emails out

  for(const emailData of emails) {
    const emailContent = createPaymentEmail(record.Event, record, user, emailData.ticket);
    mailer.sendEmail(emailData.email, `${record.Event.name} Ticket`, emailContent);
  }

  return res.status(200).json({ leadTicketId });
});

router.get("/booking/payment/:id", async (req, res) => {
  // Get the information about the booking using the ticket ID
  const { user } = req.session;

  // Must be a member to get the ticket type
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const id = req.params.id;

  // Validate the id briefly
  if(!id || id === null || id === undefined) {
    return res.status(400).json({ error: "Missing id" });
  }

  let ticket;

  try {
    ticket = await EventTicket.findOne({
      where: {
        id,
        bookerId: user.id,
        isGuestTicket: false
      },
      include: [{
        model: EventGroupBooking,
        include: [{
          model: Event,
          attributes: [ "name" ]
        }, {
          model: EventTicket,
          attributes: [ "paid", "isGuestTicket", "guestName", "guestUsername" ],
          include: [{
            model: User,
            attributes: [ "username", "surname", "firstNames" ]
          }]
        }, {
          model: EventTicketType,
          attributes: [ "name", "memberPrice", "guestPrice", "requiredInformationForm" ]
        }]
      }]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to contact the database to get the ticket information" });
  }

  if(ticket === null) {
    return res.status(400).json({ error: "Ticket does not exist or is not linked to this account" });
  }

  if(ticket.paid) {
    return res.status(200).json({ paid: true });
  }

  // Now check for any guest tickets

  let guestTickets;

  try {
    guestTickets = await EventTicket.findAll({
      where: {
        bookerId: user.id,
        id: {
          [Op.ne]: ticket.id
        },
        groupId: ticket.groupId
      }
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to contact the database to get the guest ticket information" });
  }

  // Calculate the price to pay

  const { memberPrice, guestPrice, name: ticketTypeName } = ticket.EventGroupBooking.EventTicketType;

  const memberPricePence = Number(memberPrice) * 100;
  const guestPricePence = Number(guestPrice) * 100;

  const totalCost = Math.round(memberPricePence + guestPricePence * guestTickets.length);

  // We need to make the reset the stripePaymentId and save it

  let metadata = {
    ticketId: ticket.id,
    events: totalCost,
    events_net: Math.round(totalCost - ((0.014 * totalCost) + 20)),
    event_name: ticket.EventGroupBooking.Event.name,
    event_ticket_type: ticketTypeName
  }

  const { stripePaymentId } = ticket;
  let paymentIntent = null;

  if(stripePaymentId === null) {
    // We make a new payment intent on the first time only
    // This is to avoid the overwriting of the payment intent ID
    // and causing a crash when trying to capture it
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: totalCost,
        currency: "gbp",
        payment_method_types: ["card"],
        capture_method: "manual",
        receipt_email: user.email,
        metadata,
        description: `${ticket.EventGroupBooking.Event.name} Event Ticket`
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create the payment intent" });
    }

    ticket.stripePaymentId = paymentIntent.id;

    try {
      await ticket.save();
    } catch (error) {
      return res.status(500).json({ error: "Unable to save the payment intent ID" });
    }
  } else if (stripePaymentId === "overridden") {
    return res.status(400).json({ error: "Payment overridden" });
  } else {
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentId);
    } catch (error) {
      return res.status(500).json({ error: "Unable to retrieve the payment intent" });
    }
  }

  if(paymentIntent.status !== "requires_payment_method") {
    return res.status(400).json({ error: `Your payment intent status is incorrect ${paymentIntent.status}` });
  }

  const clientSecret = paymentIntent.client_secret;

  return res.status(200).json({ ticket, guestTickets, totalCost, paid: false, clientSecret });
});

router.post("/booking/forms", async (req, res) => {
  // Sets the required information requested for a ticket type
  const { user } = req.session;

  // Must be a member
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Do a small validation
  const { providedInfo } = req.body;

  if(providedInfo === undefined || providedInfo === null || Object.keys(providedInfo).length === 0) {
    return res.status(400).json({ error: "Missing providedInfo" });
  }

  // TODO: Could definitely improve this by making sure they update all of their tickets
  // And validating the providedInfo

  // Loop over the keys
  for(const ticketId in providedInfo) {
    let ticketRecord;

    // Get the ticket matching the ID but only if they are the booker
    try {
      ticketRecord = await EventTicket.findOne({
        where: {
          bookerId: user.id,
          id: ticketId
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to contact the database to get the ticket record" });
    }

    // Either they weren't the booker or the ID was invalid
    if(ticketRecord === null) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    // Update the requiredInformation field
    ticketRecord.requiredInformation = JSON.stringify(providedInfo[ticketId]);

    // Save the record
    try {
      ticketRecord.save();
    } catch (error) {
      return res.status(500).json({ error: "Unable to contact the database to update the ticket record" });
    }
  }

  // No content but successful
  return res.status(204).end();
})

router.get("/groups/:eventId", async (req, res) => {
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { eventId } = req.params;

  // Check the eventId was set
  if(eventId === undefined || eventId === null) {
    return res.status(400).json({ error: "Missing eventId" });
  }

  let eventRecord;

  // Select the event
  try {
    eventRecord = await Event.findOne({
      where: { id: eventId }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the event" });
  }

  // Makes sure the event is real
  if(eventRecord === null) {
    return res.status(400).json({ error: "Invalid eventId" });
  }

  let groups;

  // Find all of the groups
  try {
    groups = await EventGroupBooking.findAll({
      where: { eventId },
      include: [
        {
          model: EventTicket,
          include: [ User ]
        },
        {
          model: User
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the bookings" });
  }

  let ticketTypes;

  // Inner joining the ticket types might be needlessly expensive
  // We can just look them up instead
  try {
    ticketTypes = await EventTicketType.findAll({
      where: { eventId }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the ticket types" });
  }

  // Send it all back to the client
  return res.status(200).json({ event: eventRecord, groups, ticketTypes });
});

router.post("/booking/override", async (req, res) => {
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { ticketId } = req.body;

  if(ticketId === undefined || ticketId === null) {
    return res.status(400).json({ error: "No ticketId" });
  }

  let purchasedTicket;

  try {
    purchasedTicket = await EventTicket.findOne({
      where: { id: ticketId },
      include: [ User, EventGroupBooking ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the event ticket" });
  }

  if(purchasedTicket === null) {
    return res.status(400).json({ error: "Invalid ticketID" });
  }

  purchasedTicket.paid = true;
  purchasedTicket.stripePaymentId = "overridden";

  try {
    await purchasedTicket.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the ticket changes" });
  }

  // Now we need to update the guests as well if they have some

  try {
    await EventTicket.update({ paid: true }, {
      where: {
        bookerId: purchasedTicket.User.id,
        isGuestTicket: true
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to contact the database to update the event tickets for the guests" });
  }

  // Now lets check if everyone in the group has placed a hold (if so we can capture the payments)

  let groupsTickets;

  try {
    groupTickets = await EventTicket.findAll({
      where: {
        groupId: purchasedTicket.groupId
      },
      include: [ User ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to contact the database to get all the tickets in the group" });
  }

  let allPaid = true;
  let notPaid = [];

  // Start by assuming they all have then loop and change it if necessary
  // Also collect everyone who hasn't paid so we can put it in the email
  for(let ticket of groupTickets) {
    if(!ticket.paid) {
      allPaid = false;
      notPaid.push(ticket);
    }
  }

  // Now we can capture
  if(allPaid) {
    for(let ticket of groupTickets) {
      // We will capture the guests via the lead booker
      if(ticket.isGuestTicket) {
        continue;
      }

      // Can't capture this as this is overridden by the FACSO
      if(ticket.stripePaymentId === "overridden") {
        continue;
      }

      // Capture each payment
      // https://stripe.com/docs/payments/capture-later
      try {
        await stripe.paymentIntents.capture(ticket.stripePaymentId);
      } catch (error) {
        console.log(error);
        return res.status(500).json({ error: `Unable to capture the payment for ticket ${ticket.id}` });
      }
    }

    // All captured so update the group
    // Will prevent the booking from being deleted
    try {
      await EventGroupBooking.update({ allPaid: true }, {
        where: { id: purchasedTicket.groupId }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to update the group's payment status" });
    }

    // This will have triggered the payment_intent.captured event from Stripe
    // we send the emails there instead for those who have

    // All captured so now we can send emails to those who had their payment overridden
    for(let ticket of groupTickets) {
      if(ticket.isGuestTicket) {
        continue;
      }

      if(ticket.stripePaymentId === "overridden") {
        // Send emails to those who had it overridden
        const completedEmail = createCompletedEventPaymentEmail(ticket);
        mailer.sendEmail(ticket.User.email, `Event Booking Confirmation`, completedEmail);
      }
    }
  } else {
    // Send them an email confirming their hold
    // And list who hasn't paid and how long they have left
    const notPaidEmail = overriddenEmail(purchasedTicket.User, notPaid, purchasedTicket.createdAt);
    mailer.sendEmail(purchasedTicket.User.email, `Event Ticket Hold Authorised`, notPaidEmail);
  }

  return res.status(204).end();
});

router.get("/export/:eventId", async (req, res) => {
  // Admin only, generates the export list of the people attending
  const { user } = req.session;

  if(!hasPermission(req.session, "events.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { eventId } = req.params;

  if(eventId === undefined || eventId === null) {
    return res.status(400).json({ error: "No eventId" });
  }

  let eventRecord;

  // Get the event
  try {
    eventRecord = await Event.findOne({ where: { id: eventId } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the event record" });
  }

  if(eventRecord === null) {
    return res.status(400).json({ error: "Invalid eventId" });
  }

  let groups;

  // Get the groups
  try {
    groups = await EventGroupBooking.findAll({
      where: {
        eventId: eventRecord.id,
        allPaid: true
      },
      include: [{
        model: EventTicket,
        include: [ User ]
      }]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the event group bookings" });
  }

  let ticketTypes;

  // Get the ticket types
  try {
    ticketTypes = await EventTicketType.findAll({
      where: {
        eventId: eventRecord.id
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the ticket types" });
  }

  // Want to map the ticketTypes to an object with the key as the ticket type ID
  const ticketTypesByID = ticketTypes.reduce((obj, ticketType) => {
    obj[ticketType.id] = ticketType;
    return obj;
  }, {});

  // This will be used to construct the file name
  const eventNameNoWS = eventRecord.name.replace(/\s/g, "");
  const time = new Date().getTime();

  // Header for the CSV file
  let header = [
    { id: "name", title: "Name" },
    { id: "username", title: "Username" },
    { id: "ticketType", title: "Ticket Type" },
    { id: "guest", title: "Is Guest?" },
    { id: "groupId", title: "Group ID" },
    { id: "paid", title: "Paid" }
  ];

  let usedIds = [];

  // Loop over the ticketTypes
  // This is to build the extra headers for the ticket type's extra information
  ticketTypes.forEach(type => {
    const { requiredInformationForm } = type;
    const parsedForm = JSON.parse(requiredInformationForm);
    const fieldNames = Object.keys(parsedForm).map(key => parsedForm[key].name);

    fieldNames.forEach(name => {
      if(usedIds.includes(name)) {
        return;
      }

      usedIds.push(name);
      header.push({ id: name, title: name });
    });
  });

  // Create the CSV writer
  const fileLocation = `${eventNameNoWS}-${time}`;
  const csvTicketWriter = createCsvWriter({
    path: `${csvPath}Tickets-${fileLocation}.csv`,
    header
  });

  let ticketCSVRecords = [];

  // Now create the records
  groups.forEach(group => {
    // Each group has tickets
    group.EventTickets.forEach(ticket => {
      // The record that will be put in the CSV file
      let record = {};

      if(ticket.isGuestTicket) {
        // Guests have their fields in a different place
        record.name = ticket.guestName;
        record.username = ticket.guestUsername;
        record.guest = "Yes";
      } else {
        // Normalise the name for displaying
        const split = ticket.User.firstNames.split(",");
        let firstName = split[0];
        firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
        let surname = ticket.User.surname;
        surname = surname.substring(0, 1).toUpperCase() + surname.substring(1).toLowerCase();

        record.name = `${firstName} ${surname}`;
        record.username = ticket.User.username;
        record.guest = "No";
      }

      // Store some extra basic details
      record.ticketType = ticketTypesByID[group.ticketTypeId].name;
      record.groupId = group.id;
      record.paid = ticket.paid ? "Yes" : "No";

      const { requiredInformation } = ticket;

      // If they have provided extra info then set it in the record
      if(requiredInformation !== null) {
        const parsedInfo = JSON.parse(requiredInformation);

        Object.keys(parsedInfo).forEach(key => {
          // Shouldn't happen but just in case
          if(!usedIds.includes(key)) {
            return;
          }

          record[key] = parsedInfo[key];
        });
      }

      // Put it in the CSV writer
      ticketCSVRecords.push(record);
    });
  });

  // Now write it all to the file
  try {
    await csvTicketWriter.writeRecords(ticketCSVRecords);
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the CSV file" });
  }

  // Return the file name
  return res.status(200).json({ fileLocation });
});

router.get("/download/:file", async (req, res) => {
  // Only admins can download the file
  const { user } = req.session;

  if(!hasPermission(req.session, "events.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { file } = req.params;

  // Validate the file parameter
  if(file === undefined || file === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  // File location consists of eventNameNoWS-time
  // Use split.length - 1 in case the event name has dashes in it (rather than split[1])
  const split = file.split("-");
  const millisecondsStr = split[split.length - 1];

  // If it has been more than hour then the file has expired (410 = Gone)
  if(new Date().getTime() > Number(millisecondsStr) + 1000 * 60 * 60) {
    return res.status(410).end();
  }

  // Construct the path to the file
  const pathName = path.join(csvPath, `Tickets-${file}.csv`);

  // Finally download the file, if there is an error then 404 it
  return res.download(pathName, `Tickets-${file}.csv`, () => {
    res.status(404).end();
  });
});

router.get("/bookings/my", async (req, res) => {
  // Gets all of the user's bookings
  const { user } = req.session;

  // Must be a member to create a booking
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let tickets;

  // Select all of their tickets, the corresponding group, event and lead booker
  try {
    tickets = await EventTicket.findAll({
      where: {
        bookerId: user.id,
        isGuestTicket: false
      },
      attributes: [ "id", "paid" ],
      include: [
        {
          model: EventGroupBooking,
          attributes: [ "leadBookerId", "ticketTypeId", "allPaid", "createdAt" ],
          include: [
            {
              model: Event,
              attributes: [ "id", "name", "date", "shortDescription" ]
            },
            {
              model: User,
              attributes: [ "surname", "firstNames" ]
            },
            {
              model: EventTicketType,
              attributes: [ "name" ]
            }
          ]
        }
      ]
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the tickets" });
  }

  // Send it back to the client
  return res.status(200).json({ tickets });
});

router.get("/ticket/my/:ticketId", async (req, res) => {
  // Gets a specific ticket for the user
  const { user } = req.session;

  // Must be a member to create a booking
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { ticketId } = req.params;

  if(ticketId === undefined || ticketId === null || ticketId.length === 0) {
    return res.status(400).json({ error: "Missing ticketId" });
  }

  let ticket;

  // Get the ticket and basically everything important about it
  try {
    ticket = await EventTicket.findOne({
      where: {
        bookerId: user.id,
        isGuestTicket: false,
        id: ticketId
      },
      attributes: [ "id", "requiredInformation", "paid" ],
      include: [
        {
          model: EventGroupBooking,
          attributes: [ "leadBookerId", "ticketTypeId", "allPaid", "createdAt" ],
          include: [
            {
              model: Event,
              attributes: [ "id", "name", "date" ]
            },
            {
              model: User,
              attributes: [ "surname", "firstNames" ]
            },
            {
              model: EventTicketType,
              attributes: [ "name", "description" ]
            },
            {
              model: EventTicket,
              attributes: [ "bookerId", "isGuestTicket", "guestName", "guestUsername", "requiredInformation", "paid" ],
              include: [
                {
                  model: User,
                  attributes: [ "surname", "firstNames", "username" ]
                }
              ]
            }
          ]
        }
      ]
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Unable to load the ticket" });
  }

  // If the ticketId was wrong it is not owned by the user
  if(ticket === null) {
    return res.status(400).json({ error: "Invalid ticketId" });
  }

  // Send the ticket to the client
  return res.status(200).json({ ticket });
});

router.delete("/group/:id", async (req, res) => {
  // Deletes the specified group
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  // Check the eventId was set
  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  let group;

  // Get the group
  try {
    group = await EventGroupBooking.findOne({
      where: { id },
      include: [
        {
          model: EventTicket,
          include: [ User ]
        },
        {
          model: Event
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to search for the group" });
  }

  // No group then the ID was wrong
  if(group === null) {
    return res.status(400).json({ error: "Invalid group ID" });
  }

  // Email each non-guest
  group.EventTickets.forEach(ticket => {
    if(ticket.isGuestTicket) {
      return;
    }

    const emailContent = deletedEmail(ticket.User, group.Event);
    mailer.sendEmail(ticket.User.email, `${group.Event.name} Booking Cancelled`, emailContent);
  });

  // Delete the group
  try {
    await group.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the booking - user's have already been emailed about the cancellation."});
  }

  return res.status(204).end();
})

router.post("/update", upload.array("images"), async (req, res) => {
  const { user } = req.session;

  // Must be an admin to create events
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { eventId } = req.body;

  if(eventId === undefined || eventId === null) {
    return res.status(400).json({ error: "No eventId" });
  }

  // First find the event
  let eventRecord;

  try {
    eventRecord = await Event.findOne({ where: { id: eventId } });
  } catch (error) {
    return res.status({ error: "Unable to create the event - database error" });
  }

  if(eventRecord === null) {
    return res.status(400).json({ error: "Invalid eventId" });
  }

  // TODO: Should check that these properties actually exist
  // Get the data and images from multer
  const { name, date, shortDescription, description, maxIndividuals, bookingCloseTime, ticketTypes, imageData, inviteOnly } = JSON.parse(req.body.packaged);
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

  if(inviteOnly === undefined || inviteOnly === null) {
    return res.status(400).json({ error: "Missing inviteOnly" });
  }

  if(ticketTypes === undefined || ticketTypes === null || ticketTypes.length === 0) {
    return res.status(400).json({ error: "Missing ticketTypes" });
  }

  if(imageData === undefined || imageData === null || imageData.length === 0) {
    return res.status(400).json({ error: "Missing image data" });
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
        if(property === "id") {
          continue;
        }

        return res.status(400).json({ error: `Unknown property ${property}` });
      }
    }
  }

  // Finally validate the images

  const types = imageData.map(image => image.position);

  if(!types.includes("overview") || !types.includes("banner") || !types.includes("gallery")) {
    return res.status(400).json({ error: "Must set at least 1 image of each type" });
  }

  // Everything is validated
  // Update the event details

  try {
    await eventRecord.update({ name, shortDescription, description, maxIndividuals, bookingCloseTime, date, inviteOnly });
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the event record" });
  }

  // Then we will process the image changes
  const alreadyUploadedImages = imageData.filter(img => img.alreadyUploaded === true);
  let knownImages;

  try {
    knownImages = await EventImage.findAll({
      where: { eventId: eventRecord.id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the images for the event" });
  }

  // Delete any images they no longer want
  for(const knownImage of knownImages) {
    // Deleted the image
    if(alreadyUploadedImages.filter(img => img.id === knownImage.id).length === 0) {
      // Need to unlink from file system first
      try {
        await fs.unlink(`uploads/images/events/${knownImage.image}`, (err) => {});
      } catch (error) {
        return res.status(500).json({ error: "Unable to delete an image from the file system" });
      }

      // Delete from the database
      try {
        knownImage.destroy();
      } catch (error) {
        return res.status(500).json({ error: "Unable to delete the image record" });
      }

      continue;
    }
  }

  let offset = 0;

  // Now add the images that didn't already exist
  for(let i = 0; i < imageData.length; i++) {
    const imageFileData = images[i - offset];
    const { caption, position, alreadyUploaded } = imageData[i];

    // Don't reupload images
    if(alreadyUploaded || imageFileData === null) {
      offset++;
      continue;
    }

    // Create the new image entry
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

  // Now deal with ticket types
  const alreadyUploadedTTs = ticketTypes.filter(ticketType => ticketType.id !== null);
  let knownTicketTypes;

  try {
    knownTicketTypes = await EventTicketType.findAll({
      where: { eventId: eventRecord.id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the ticket types for the event" });
  }

  // Delete any ticket types they no longer want
  for(const knownTicketType of knownTicketTypes) {
    // Deleted the ticket type
    if(alreadyUploadedTTs.filter(ticketType => ticketType.id === knownTicketType.id).length === 0) {
      // Delete from the database
      try {
        knownTicketType.destroy();
      } catch (error) {
        return res.status(500).json({ error: "Unable to delete the ticket type record" });
      }

      continue;
    }
  }

  // Now add/update the event ticket types
  for(let i = 0; i < ticketTypes.length; i++) {
    // Stringify the JSON object and remove from the ticketType so we can use the spread operator
    const customData = JSON.stringify(ticketTypes[i].customData);
    delete ticketTypes[i].customData;

    // Already exists
    if(ticketTypes[i].id !== null) {
      let eventTicketType;

      // Find the ticket type
      try {
        eventTicketType = await EventTicketType.findOne({
          where: {
            id: ticketTypes[i].id,
            eventId: eventRecord.id
          }
        });
      } catch (error) {
        return res.status(500).json({ error: `Unable to get event ticket type with id ${ticketTypes[i].id}`});
      }

      // Update it with the new details (even if they are the same as sequelize will handle it)
      try {
        await eventTicketType.update({
          ...ticketTypes[i],
          requiredInformationForm: customData
        });
      } catch (error) {
        return res,status(500).json({ error: `Unable to update the ticket type with id ${ticketTypes[i].id}`});
      }

      continue;
    }

    // Create the record
    try {
      await EventTicketType.create({
        eventId: eventRecord.id,
        ...ticketTypes[i],
        requiredInformationForm: customData
      });
    } catch (error) {
      return res.status(500).json({ error: `Unable to create event ticket type with name ${ticketTypes[i].name}`});
    }
  }

  // All done
  return res.status(200).json({ id: eventRecord.id });
});

router.get("/ticketType/admin/:id", async (req, res) => {
  // Gets the details about a single ticket type
  // Admin endpoint as it doesn't check if the requesting user has access to the ticket
  const { user } = req.session;

  // Must be a member to get the ticket type
  if(!hasPermission(req.session, "events.manage")) {
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
          attributes: [ "name", "maxIndividuals", "bookingCloseTime", "inviteOnly" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the event from the database" });
  }

  if(record === null) {
    return res.status(400).json({ error: "Invalid ID, no record found" });
  }

  // First we need to check that booking hasn't closed
  const now = new Date();

  if(now > new Date(record.Event.bookingCloseTime)) {
    return res.status(200).json({
      available: false,
      reason: "closed",
      record
    });
  }

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
      record
    });
  }

  // There is limited space but not enough for this type of ticket
  const remainingIndividualSpaces = record.Event.maxIndividuals - totalTicketsOfAllTypes;
  if(remainingIndividualSpaces < record.minPeople) {
    return res.status(200).json({
      available: false,
      reason: "full:limited",
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
    record
  });
});

router.post("/booking/admin", async (req, res) => {
  // Completes a booking by an admin on behalf of another group
  const { user } = req.session;

  // Must be a member to get the ticket type
  if(!hasPermission(req.session, "events.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { group, ticketTypeId } = req.body;

  // Do some quick validation on the data
  if(group === undefined || group === null || group.length === 0) {
    return res.status(400).json({ error: "No group submitted" });
  }

  if(ticketTypeId === undefined || ticketTypeId === null) {
    return res.status(400).json({ error: "No ticketTypeId submitted" });
  }


  /*

  {
  group: [
  {
    id: 15,
    username: 'chpf93',
    removable: false,
    displayName: 'Finlay Boyle',
    guest: false,

    lead: true
  },

  */

  // Now we do more in-depth validation on the group
  for(const groupMember of group) {
    // Check that each object has the following properties
    if(!groupMember.hasOwnProperty("id")) {
      return res.status(400).json({ error: "Missing ID for a member of your group" });
    }

    if(!groupMember.hasOwnProperty("username")) {
      return res.status(400).json({ error: "Missing username for a member of your group" });
    }

    if(!groupMember.hasOwnProperty("displayName")) {
      return res.status(400).json({ error: "Missing displayName for a member of your group" });
    }

    if(!groupMember.hasOwnProperty("guest")) {
      return res.status(400).json({ error: "Missing guest for a member of your group" });
    }

    if(!groupMember.hasOwnProperty("lead")) {
      return res.status(400).json({ error: "Missing lead for a member of your group" });
    }

    const { id, username, displayName, guest, lead } = groupMember;

    // Make sure ID is defined
    if(id === undefined) {
      return res.status(400).json({ error: "ID is undefined for a member of your group" });
    }

    // Make sure username is defined and exactly 6 characters
    if(username === undefined || username === null) {
      return res.status(400).json({ error: "username is missing for a member of your group" });
    }

    if(username !== "n/a" && username.length !== 6) {
      return res.status(400).json({ error: "username must be 6 characters long (or n/a)"});
    }

    // Make sure displayName is defined
    if(displayName === undefined || displayName === null || displayName.length === 0) {
      return res.status(400).json({ error: "displayName is missing for a member of your group" });
    }

    // Make sure guest is defined
    if(guest === undefined) {
      return res.status(400).json({ error: "guest is missing for a member of your group" });
    }

    // Guests don't have an ID
    if(!guest && id === null) {
      return res.status(400).json({ error: "guest is false and id is missing for a member of your group" });
    }

    if(guest && lead) {
      return res.status(400).json({ error: "guest cannot be lead" });
    }
  }

  // Now we need to check that there is space for them to book

  let record;

  // Find the record by the id
  try {
    record = await EventTicketType.findOne({
      where: { id: ticketTypeId },
      include: [
        {
          model: Event,
          attributes: [ "id", "name", "maxIndividuals", "bookingCloseTime" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the event ticket type from the database" });
  }

  if(record === null) {
    return res.status(400).json({ error: "Invalid ticket type ID, no record found" });
  }

  // First we need to check that booking hasn't closed
  const now = new Date();

  if(now > new Date(record.Event.bookingCloseTime)) {
    return res.status(400).json({ error: "Booking has closed" });
  }

  // We now know that booking is open
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
    return res.status(400).json({ error: "This event is already sold out" });
  }

  // There is limited space but not enough for this type of ticket
  const remainingIndividualSpaces = record.Event.maxIndividuals - totalTicketsOfAllTypes;

  if(remainingIndividualSpaces < group.length) {
    return res.status(400).json({ error: "There is not enough space on the event for your group" });
  }

  // Filter to this ticket type only then count how many there are
  const totalBookingsOfThisType = allBookingCounts.filter(booking => booking.ticketTypeId === record.id).length;
  const remainingSpacesOfType = record.maxOfType - totalBookingsOfThisType;

  // The ticket is sold entirely
  if(remainingSpacesOfType <= 0) {
    return res.status(400).json({ error: "There are no more tickets of this type available" });
  }

  // There are tickets available
  // Now we get the user records for each member

  // We only want those that aren't guests
  const ids = group.filter(member => member.guest === false).map(member => member.id);

  let jcrMembers;

  try {
    jcrMembers = await User.findAll({
      where: {
        id: ids
      },
      include: [
        {
          model: EventGroupBooking,
          where: {
            eventId: record.Event.id
          },
          required: false
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the members against the database" });
  }

  const leads = group.filter(member => member.lead === true);

  if(leads.length !== 1) {
    return res.status(400).json({ error: "No lead booker" });
  }

  const leadId = leads[0].id;

  let realJCRMembers = [];
  let leadBooker = null;

  for(const jcrMember of jcrMembers) {
    let givenData = group.filter(m => m.id === jcrMember.id);

    if(givenData.length === 0) {
      return res.status(500).json({ error: "Unexpected length assertion failed" });
    }

    const { id, username, membershipExpiresAt } = jcrMember;
    givenData = givenData[0];

    if(givenData.username !== username) {
      return res.status(400).json({ error: "Inconsistent username submitted" });
    }

    // Check their debt status
    let debtRecord;

    try {
      debtRecord = await Debt.findOne({ where: { username: givenData.username }});
    } catch (error) {
      return res.status(500).json({ error: "Unable to check the debt status" });
    }

    // If they have a debt record then prevent them booking
    if(debtRecord !== null) {
      return res.status(400).json({ error: `${username} has a debt owed to the JCR` });
    }

    // Check they don't already have a ticket
    if(jcrMember.EventGroupBookings.length !== 0) {
      return res.status(400).json({ error: `${username} already has a ticket for this event` });
    }

    // Make sure they have a valid membership
    if(membershipExpiresAt === null || now > new Date(membershipExpiresAt)) {
      return res.status(400).json({ error: `${username} does not have a JCR membership and must be booked on as a guest instead` });
    }

    // Select the lead record
    if(id === leadId) {
      leadBooker = jcrMember;
    }

    realJCRMembers.push({
      id,
      email: jcrMember.email
    });
  }

  if(leadBooker === null) {
    return res.status(400).json({ error: "Unable to find the lead booker" });
  }

  const guestList = group.filter(m => m.guest === true);
  const totalMembers = guestList.length + realJCRMembers.length;

  // Think everything is checked at this point so we can actually make the booking

  let groupBooking;

  try {
    groupBooking = await EventGroupBooking.create({
      eventId: record.Event.id,
      leadBookerId: leadBooker.id,
      ticketTypeId,
      totalMembers
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the booking in the database" });
  }

  let emails = [];

  // Have the booking so now we create the tickets for the members first
  for(const jcrGroupMember of realJCRMembers) {
    let ticket;

    try {
      ticket = await EventTicket.create({
        groupId: groupBooking.id,
        bookerId: jcrGroupMember.id
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create the ticket for a member of the group" });
    }

    emails.push({
      email: jcrGroupMember.email,
      ticket
    });
  }

  // Now we create the tickets for the guests
  for(const guest of guestList) {
    let ticket;

    try {
      ticket = await EventTicket.create({
        groupId: groupBooking.id,
        bookerId: leadBooker.id,
        isGuestTicket: true,
        guestName: guest.displayName,
        guestUsername: guest.username
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create the ticket for a guest of the group" });
    }
  }

  // Now we send the emails out

  for(const emailData of emails) {
    const emailContent = createInviteOnlyEmail(record.Event, record, user, leadBooker, emailData.ticket);
    mailer.sendEmail(emailData.email, `${record.Event.name} Ticket`, emailContent);
  }

  return res.status(204).end();
})

const createPaymentEmail = (event, ticketType, booker, ticket) => {
  let firstName = booker.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = booker.surname.charAt(0).toUpperCase() + booker.surname.substr(1).toLowerCase();

  let contents = [];

  contents.push(`<h1>${event.name} Ticket</h1>`);
  contents.push(`<p>You have been booked onto this event by ${firstName} ${lastName}.</p>`);
  contents.push(`<p>Ticket Type: ${ticketType.name}</p>`);
  contents.push(`<p>${ticketType.description}</p>`);
  contents.push(`<p>You now have 24 hours to make payment for this ticket otherwise the group's booking will be cancelled</p>`);
  contents.push(`<a href="${process.env.WEB_ADDRESS}/events/bookings/payment/${ticket.id}" target="_blank" rel="noopener noreferrer"><p>To make payment, please click here.</p></a>`);
  contents.push(`<p>Thank you</p>`);

  return contents.join("");
}

const overriddenEmail = (user, notPaid, groupCreatedAtDate) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  const paymentClose = new Date(new Date(groupCreatedAtDate).getTime() + 1000 * 60 * 60 * 24);

  message.push(`<p>Hello ${firstName} ${lastName},`);
  message.push(`<p>Your payment has been authorised in line with an agreement you have with the JCR.</p>`);
  message.push(`<p>Not everyone in your group has authorised their payment yet and <strong>they have until ${dateFormat(paymentClose, "dd/mm/yyyy HH:MM")} to do this otherwise your booking will be cancelled</strong>.<p>`);
  message.push(`<p>The remaining members of your group who have not paid are:</p>`);
  message.push(`<ul>`);

  notPaid.forEach((record, i) => {
    if(record.isGuestTicket) {
      message.push(`<li>${record.guestName} (Guest)</li>`);
      return;
    }

    let firstNameNotPaid = record.User.firstNames.split(",")[0];
    firstNameNotPaid = firstNameNotPaid.charAt(0).toUpperCase() + firstNameNotPaid.substr(1).toLowerCase();
    const lastNameNotPaid = record.User.surname.charAt(0).toUpperCase() + record.User.surname.substr(1).toLowerCase();

    message.push(`<li>${firstNameNotPaid} ${lastNameNotPaid}</li>`);
  });


  message.push(`</ul>`);
  message.push(`<p>Please encourage them to authorise their payment before the deadline!</p>`);
  message.push(`<p><strong>Thank you!</strong></p>`);

  return message.join("");
}

const deletedEmail = (user, event) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Hello ${firstName} ${lastName},`);
  message.push(`<p>Your group's booking for ${event.name} has been cancelled.</p>`);
  message.push(`<p>Please contact the FACSO to discuss any refunds that may be necessary.</p>`);

  return message.join("");
}

const createInviteOnlyEmail = (event, ticketType, realBooker, leadBooker, ticket) => {
  let realBookerFirstName = realBooker.firstNames.split(",")[0];
  realBookerFirstName = realBookerFirstName.charAt(0).toUpperCase() + realBookerFirstName.substr(1).toLowerCase();
  const realBookerLastName = realBooker.surname.charAt(0).toUpperCase() + realBooker.surname.substr(1).toLowerCase();

  let leadBookerFirstName = leadBooker.firstNames.split(",")[0];
  leadBookerFirstName = leadBookerFirstName.charAt(0).toUpperCase() + leadBookerFirstName.substr(1).toLowerCase();
  const leadBookerLastName = leadBooker.surname.charAt(0).toUpperCase() + leadBooker.surname.substr(1).toLowerCase();

  let contents = [];

  contents.push(`<h1>${event.name} Ticket</h1>`);
  contents.push(`<p>You have been booked onto this event by ${realBookerFirstName} ${realBookerLastName} on behalf of ${leadBookerFirstName} ${leadBookerLastName}.</p>`);
  contents.push(`<p>Ticket Type: ${ticketType.name}</p>`);
  contents.push(`<p>${ticketType.description}</p>`);
  contents.push(`<p>You now have 24 hours to make payment for this ticket otherwise the group's booking will be cancelled</p>`);
  contents.push(`<a href="${process.env.WEB_ADDRESS}/events/bookings/payment/${ticket.id}" target="_blank" rel="noopener noreferrer"><p>To make payment, please click here.</p></a>`);
  contents.push(`<p>Thank you</p>`);

  return contents.join("");
}

const createCompletedEventPaymentEmail = (ticket) => {
  // This email will be sent once we capture the hold amount
  let firstName = ticket.User.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = ticket.User.surname.charAt(0).toUpperCase() + ticket.User.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Hello ${firstName} ${lastName},`);
  message.push(`<p>Everybody in your group has successfully paid for their ticket!</p>`);
  message.push(`<p>This email is confirmation of your booking.</p>`);
  message.push(`<p><strong>Thank you!</strong></p>`);

  return message.join("");
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
