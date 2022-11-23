// Get express
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs").promises;
// The database models
const { User, Permission, PermissionLink, DataRequest } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "uploads/images/profile/" });
const mailer = require("../utils/mailer");

const sharp = require("sharp");

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

  if(!["image/jpeg", "image/png"].includes(image.mimetype)) {
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

    return res.status(400).json({ error: "You can only upload images up to 4MB" });
  }

  // Convert to jpg and decrease file size
  let buffer;

  try {
    buffer = await sharp(`uploads/images/profile/${image.filename}`)
                  .withMetadata()
                  .jpeg({ quality: 60 })
                  .toBuffer();
  } catch (error) {
    return res.status(500).json({ error: "Unable to compress the image" });
  }

  try {
    await fs.writeFile(`uploads/images/profile/${image.filename}`, buffer);
  } catch (error) {
    console.log({error})
    return res.status(500).json({ error: "Unable to save the compressed image" });
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

router.get("/email-test/:to", async (req, res) => {
  const { user } = req.session;
  const { to } = req.params;

  if(!hasPermission(req.session, "permissions.edit")) {
    return res.status(403).json({ error: "Permission error" })
  }

  try {
    const outcome = await mailer.sendEmail(to, `No Reply Test`, [
      "<p>Test message</p>"
    ].join(""));

    if(!outcome) {
      return res.status(500).json({ error: outcome });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res.status(200).json({ success: true });
})

router.post("/update", async(req, res) => {
  const { user } = req.session;
  const { year } = req.body;

  if(year === null) {
    return res.status(400).json({ error: "Missing year" });
  }

  const validYears = [1, 2, 3, 4, "1", "2", "3", "4"];

  if(!validYears.includes(year)) {
    return res.status(400).json({ error: "Invalid year specified" });
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

  userRecord.confirmedDetails = true;
  userRecord.year = year;

  try {
    userRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the user's record" });
  }

  return res.status(204).end();
})

router.post("/request", async (req, res) => {
  const { requestType, furtherInformation, accurate } = req.body;

  if(!accurate) {
    return res.status(400).json({ error: "You must agree the request is accurate" });
  }

  try {
    await DataRequest.create({
      userId: req.session.user.id,
      requestType,
      furtherInformation
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create request" });
  }

  const resolvedType = {
    "sar": "Subject Access Request",
    "personalDataChange": "Personal Data Change Request",
    "deletion": "Account Deletion Request"
  };

  // Prep the email for the user and send it
  let userEmail = [];
  let editorEmail = [];

  userEmail.push(`<p>Your request has been recorded successfully.</p>`);
  editorEmail.push(`<p>Request from ${req.session.user.username}</p>`)
  userEmail.push(`<p>The confirmed details are:</p>`);
  editorEmail.push(`<p>The confirmed details are:</p>`);
  userEmail.push("");
  editorEmail.push("");

  userEmail.push(`<p>Request Type: ${resolvedType[requestType]}</p>`);
  userEmail.push(`<p>Further Information:</p>`);
  editorEmail.push(`<p>Request Type: ${resolvedType[requestType]}</p>`);

  if(furtherInformation.length > 0) {
    editorEmail.push(`<p>Further Information:</p>`);

     // Makes the long form reason look nice by splitting into paragraph tags instead
    furtherInformation.split("\n").forEach((paragraph) => {
      if(paragraph.length === 0) {
        return;
      }

      userEmail.push(`<p>${paragraph}</p>`);
      editorEmail.push(`<p>${paragraph}</p>`);
    });
  }

  userEmail.push(`<p>The JCR Website Editor has been notified.</p>`);

  await mailer.sendEmail("grey.website@durham.ac.uk", `New ${resolvedType[requestType]} Confirmation from ${req.session.user.username}`, editorEmail.join(""));
  await mailer.sendEmail(req.session.user.email, `${resolvedType[requestType]} Confirmation`, userEmail.join(""));

  return res.status(204).end();
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
