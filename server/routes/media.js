// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Address, Media } = require("../database.models.js");
const dateFormat = require("dateformat");
const { hasPermission } = require("../utils/permissionUtils.js");
const { Op } = require("sequelize");

// Get the media available
router.get("/all", async (req, res) => {
  // User only
  let media;

  // Just finds all the items and returns them
  try {
    media = await Media.findAll();
  } catch (error) {
    res.status(500).json({ error: "Server error"+error.toString() });
    return;
  }

  return res.status(200).json({ media });
});

router.get("/item/:id", async (req, res) => {
  const id = req.params.id;

  if(!id || id === null || id === undefined) {
    return res.status(400).json({ error: "Missing id" });
  }

  let item;

  try {
    item = await Media.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error });
  }

  if(item === null) {
    return res.status(400).json({ error: `Unknown id ${id}` })
  }

  return res.status(200).json({ item });
});

router.post("/new", async (req, res) => {
    // Admin only
    const { user } = req.session;

    if(!hasPermission(req.session, "media.manage")) {
        return res.status(403).json({ error: "You do not have permission to perform this action" });
    }

    // Validate the details briefly
    const { title, type, category, link } = req.body;

    if(title == null) {
        return res.status(400).json({ error: "Missing title" });
    }

    if(type == null) {
        return res.status(400).json({ error: "Missing type" });
    }

    if(category == null) {
        return res.status(400).json({ error: "Missing category" });
    }

    if(link == null) {
        return res.status(400).json({ error: "Missing link" });
    }

    let Desc = "";
    if (req.body.description != null){
      Desc = req.body.description;
    }

    // Create the new colour
    try {
        await Media.create({ mediaTitle:title, mediaType:type, mediaCategory:category, mediaLink:link, mediaDescription: Desc });
    } catch (error) {
        return res.status(500).json({ error: "Server error creating new item"+error.toString() });
    }

    return res.status(204).end();
});

// Delete an item.
router.delete("/item/:itemID", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "media.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const itemID = req.params.itemID;

  if(itemID == null) {
    return res.status(400).json({ error: "Missing itemID", receivedRequest:req });
  }

  const item = await Media.findOne({ where: { id:itemID } });

  if(item === null) {
    return res.status(200).json({ error: "Entry not in table" });
  }
  const id = item.id;
  try {
    await Media.destroy({ where: { id:id } });
  } catch (error) {
    return res.status(500).json({ error: "Server error deleting item", messg:error.toString() });
  }

  return res.status(204).end();
});
// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;