// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Address, Media } = require("../database.models.js");
const dateFormat = require("dateformat");
const { hasPermission } = require("../utils/permissionUtils.js");
const { Op } = require("sequelize");
const rawFs = require("fs");
const fs = rawFs.promises;
const path = require("path");
const imageThumbnail = require("image-thumbnail");

const mediaPath = path.join(__dirname, "../uploads/images/media/");

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

router.get("/images/options", async (req, res) => {
  const options = {
    "Halloween Bop 2021": "halloween2021"
  }

  return res.status(200).json({ options });
});

router.get("/images/list/:eventName", async (req, res) => {
  const { eventName } = req.params;

  if(!eventName) {
    return res.status(400).json({ error: "Missing eventName" });
  }

  let files;

  try {
    files = await fs.readdir(`${mediaPath}${eventName}/`);
  } catch (error) {
    return res.status(400).json({ error: "Invalid eventName" });
  }

  // Don't want to create thumbnails of thumbnails
  files = files.filter(file => !file.startsWith("thumb"));

  return res.status(200).json({ eventName, files });
})

router.get("/images/image/fullres/:eventName/:image", async (req, res) => {
  const { eventName, image } = req.params;
  res.sendFile(path.join(__dirname, `../uploads/images/media/${eventName}/${image}`));
});

router.get("/images/image/thumb/:eventName/:image", async (req, res) => {
  const { eventName, image } = req.params;

  let compressedExists;

  try {
    await fs.access(path.join(__dirname, `../uploads/images/media/${eventName}/thumb_${image}`), rawFs.constants.F_OK);
    compressedExists = true;
  } catch (error) {
    compressedExists = false;
  }

  // console.log({ compressedExists, image })

  if(!compressedExists) {
    const options = {
      responseType: "base64",
      jpegOptions: {
        force: true,
        quality: 80
      },
      withMetaData: false,
      width: 518,
      height: 346,
      fit: "contain"
    }

    let thumbnail;

    try {
      thumbnail = await imageThumbnail(path.join(__dirname, `../uploads/images/media/${eventName}/${image}`), options);
    } catch (error) {
      return res.status(500).end();
    }

    const img = Buffer.from(thumbnail, "base64");

    try {
      await fs.writeFile(path.join(__dirname, `../uploads/images/media/${eventName}/thumb_${image}`), img, "base64");
    } catch (error) {
      return res.status(500).end();
    }
  }

  res.sendFile(path.join(__dirname, `../uploads/images/media/${eventName}/thumb_${image}`))
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
