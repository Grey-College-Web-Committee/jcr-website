// Get express
const express = require("express");
const multer = require("multer");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Event, EventImage, EventTicketType, EventGroupBooking, EventTicket } = require("../database.models.js");
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
  return res.status(200).json({ records });
});

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

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
