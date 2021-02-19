// Get express
const express = require("express");
const multer = require("multer");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Debt, Event, EventImage, EventTicketType, EventGroupBooking, EventTicket } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "uploads/images/events/" });
const mailer = require("../utils/mailer");
const { Op } = require("sequelize");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
          eventId: record.Event.id
        }
      ]
    });
  } catch (error) {
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
    if(username === undefined || username === null || username.length !== 6) {
      return res.status(400).json({ error: "username is missing for a member of your group" });
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

  return res.status(204).end();
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

  const { memberPrice, guestPrice } = ticket.EventGroupBooking.EventTicketType;

  const memberPricePence = Number(memberPrice) * 100;
  const guestPricePence = Number(guestPrice) * 100;

  const totalCost = Math.round(memberPricePence + guestPricePence * guestTickets.length);

  // We need to make the reset the stripePaymentId and save it

  let metadata = {
    ticketId: ticket.id,
    events: totalCost,
    events_net: Math.round(totalCost - ((0.014 * totalCost) + 20))
  }

  // We make a fresh payment intent each time they load the page
  // Probably safest to avoid the payment intent expiring
  // and then we don't have to store the client secret
  // Could potentially run into a double pay problem if they have
  // two pages open but hopefully they will remember they already paid
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCost,
    currency: "gbp",
    payment_method_types: ["card"],
    capture_method: "manual",
    receipt_email: user.email,
    metadata,
    description: `${ticket.EventGroupBooking.Event.name} Event Ticket`
  });

  const clientSecret = paymentIntent.client_secret;
  ticket.stripePaymentId = paymentIntent.id;

  try {
    await ticket.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the payment intent ID" });
  }

  return res.status(200).json({ ticket, guestTickets, totalCost, paid: false, clientSecret });
})

router.post("/booking/pay", async (req, res) => {
  return res.status(204).end();
})

const createPaymentEmail = (event, ticketType, booker, ticket) => {
  let contents = [];

  contents.push(`<h1>${event.name} Ticket</h1>`);
  contents.push(`<p>You have been booked onto this event by ${booker.firstNames} ${booker.surname}.</p>`);
  contents.push(`<p>Ticket Type: ${ticketType.name}</p>`);
  contents.push(`<p>${ticketType.description}</p>`);
  contents.push(`<p>You now have 24 hours to make payment for this ticket otherwise the group's booking will be cancelled</p>`);
  contents.push(`<a href="${process.env.WEB_ADDRESS}/events/bookings/payment/${ticket.id}" target="_blank" rel="noopener noreferrer"><p>To make payment, please click here.</p></a>`);

  return contents.join("");
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
