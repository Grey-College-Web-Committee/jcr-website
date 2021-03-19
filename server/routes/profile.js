// Get express
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs").promises;
// The database models
const { User, Permission, PermissionLink } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "uploads/images/profile/" });

router.get("/", async (req, res) => {
  const { user } = req.session;

  let userRecord;

  try {
    userRecord = await User.findOne({ where: { id: user.id }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to query the database" });
  }

  if(userRecord === null) {
    return res.status(400).json({ error: "No user found" });
  }

  return res.status(200).json({ user: userRecord });
});

router.post("/picture", upload.single("image"), async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "Only JCR members can change their profile picture" })
  }

  const { id } = req.body;
  const image = req.file;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(image === undefined || image === null) {
    return res.status(400).json({ error: "Missing image" });
  }

  if(!["image/jpeg", "image/gif", "image/png"].includes(image.mimetype)) {
    try {
      await fs.unlink(`uploads/images/profile/${image.filename}`, (err) => {});
    } catch (error) {
      return res.status(500).json({ error: "Unable to delete an image from the file system" });
    }

    return res.status(400).json({ error: "You can only upload image files (png/gif/jpg/jpeg)" });
  }

  // 4mb
  if(image.size > 4194304) {
    try {
      await fs.unlink(`uploads/images/profile/${image.filename}`, (err) => {});
    } catch (error) {
      return res.status(500).json({ error: "Unable to delete an image from the file system" });
    }

    return res.status(400).json({ error: "You can only upload images up to 2MB" });
  }

  let userRecord;

  try {
    userRecord = await User.findOne({ where: { id: user.id }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to query the database" });
  }

  if(userRecord === null) {
    return res.status(400).json({ error: "No user found" });
  }

  const { profilePicture } = userRecord;

  if(profilePicture !== null) {
    // Delete the old picture
    try {
      await fs.unlink(`uploads/images/profile/${profilePicture}`, (err) => {});
    } catch (error) {
      return res.status(500).json({ error: "Unable to delete an image from the file system" });
    }
  }

  userRecord.profilePicture = image.filename;

  try {
    await userRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the user record" });
  }

  return res.status(200).json({ profilePicture: image.filename });
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
