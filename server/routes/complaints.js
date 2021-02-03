// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Complaint } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const { v4: uuidv4 } = require('uuid');
const fs = require("fs").promises;
const path = require("path");

const uploadPath = path.join(__dirname, "../uploads/complaints/signatures/");

// Called at the base path of your route with HTTP method GET
router.get("/", async (req, res) => {
  // Returns a 200 status code with a short JSON response
  return res.status(200).json({ success: true });
});

router.post("/", async (req, res) => {
  const { user } = req.session;
  const { name, complainingAbout, subject, reason, signature } = req.body;

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "Only JCR members can file complaints" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(complainingAbout === undefined || complainingAbout === null || complainingAbout.length === 0) {
    return res.status(400).json({ error: "Missing complainingAbout" });
  }

  if(subject === undefined || subject === null || subject.length === 0) {
    return res.status(400).json({ error: "Missing subject" });
  }

  if(reason === undefined || reason === null || reason.length === 0) {
    return res.status(400).json({ error: "Missing reason" });
  }

  if(signature === undefined || signature === null || signature.length === 0) {
    return res.status(400).json({ error: "Missing signature" });
  }

  const signatureUUID = uuidv4();
  const signatureLink = `${signatureUUID}.png`;

  const signatureData = signature.replace(/^data:image\/png;base64,/, "");

  try {
    await fs.writeFile(path.join(uploadPath, signatureLink), signatureData, "base64");
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the signature" });
  }

  try {
    await Complaint.create({
      userId: user.id,
      name,
      complainingAbout,
      subject,
      reason,
      signatureLink: signatureLink
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to record the complaint" });
  }

  return res.status(204).end();
});

router.get("/", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "complaints.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let complaints;

  try {
    complaints = await Complaint.findAll({
      attributes: [ "id", "name", "complainingAbout", "subject", "createdAt" ],
      include: [ User ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the complaints" });
  }

  return res.status(200).json({ complaints });
});

router.get("/single/:id", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "complaints.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  let complaint;

  try {
    complaint = await Complaint.findOne({
      include: [ User ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to query database for the complaint" });
  }

  if(record === null) {
    return res.status(400).json({ error: "No record found" });
  }

  return res.status(200).json({ complaint });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
