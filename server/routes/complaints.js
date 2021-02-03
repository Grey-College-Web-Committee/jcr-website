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
const mailer = require("../utils/mailer");

const uploadPath = path.join(__dirname, "../uploads/complaints/signatures/");

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

  let chairEmail = [];

  chairEmail.push(`<p>A new complaint has been received from ${name} with the subject ${subject} regarding ${complainingAbout}</p>`);
  chairEmail.push(`<p><a href="https://services.greyjcr.com/complaints/admin" rel="noopener noreferrer" target="_blank">Please click here to go to the complaints management page.</a></p>`);

  mailer.sendEmail("finlay.boyle@durham.ac.uk", `New Complaint Received`, chairEmail.join(""));

  let userEmail = [];

  userEmail.push(`<p>Your complaint has been recorded successfully.</p>`);
  userEmail.push(`<p>The confirmed details are:</p>`);
  userEmail.push("");
  userEmail.push(`<p>Your Name: ${name}</p>`);
  userEmail.push(`<p>Complaint About: ${complainingAbout}</p>`);
  userEmail.push(`<p>Subject: ${subject}</p>`);
  userEmail.push(`<p>Complaint Details:</p>`);

  reason.split("\n").forEach((paragraph) => {
    if(paragraph.length === 0) {
      return;
    }

    userEmail.push(`<p>${paragraph}</p>`);
  });

  userEmail.push(`<p>The JCR Chair has been notified and will respond in due course in accordance with the JCR's Complaint Procedure.</p>`);

  mailer.sendEmail(user.email, `Complaint Confirmation`, userEmail.join(""));

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
      where: { id },
      include: [ User ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to query database for the complaint" });
  }

  if(complaint === null) {
    return res.status(400).json({ error: "No record found" });
  }

  return res.status(200).json({ complaint });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
