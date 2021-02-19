// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Feedback } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const { v4: uuidv4 } = require('uuid');
const fs = require("fs").promises;
const path = require("path");
const mailer = require("../utils/mailer");

// Submits feedback
router.post("/", async (req, res) => {
  const { user } = req.session;
  const { type, subject, details, anonymous, agreement } = req.body;

  // Don't have to be a member

  // Brief validation of the data
  if(type === undefined || type === null || type.length === 0) {
    return res.status(400).json({ error: "Missing type" });
  }

  const validTypes = ["jcr", "website", "events"];

  if(!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  if(subject === undefined || subject === null || subject.length === 0) {
    return res.status(400).json({ error: "Missing subject" });
  }

  if(details === undefined || details === null || details.length === 0) {
    return res.status(400).json({ error: "Missing details" });
  }

  if(anonymous === undefined || anonymous === null) {
    return res.status(400).json({ error: "Missing anonymous" });
  }

  if(agreement === undefined || agreement === null) {
    return res.status(400).json({ error: "Missing agreement" });
  }

  let feedbackRecord;

  // Create the feedback record
  try {
    feedbackRecord = await Feedback.create({
      userId: user.id,
      type,
      subject,
      details,
      anonymous,
      agreement
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to record the feedback" });
  }

  if(feedbackRecord === null) {
    return res.status(500).json({ error: "Unable to record the feedback, was null" });
  }

  // Prep the email for the VP and send it
  let vpEmail = [];

  vpEmail.push(`<p>Feedback has been received with the subject ${subject}</p>`);
  vpEmail.push(`<p><a href="https://services.greyjcr.com/feedback/view/${feedbackRecord.id}" rel="noopener noreferrer" target="_blank">Please click here to view it.</a></p>`);

  mailer.sendEmail("grey.website@durham.ac.uk", `New Feedback Received`, vpEmail.join(""));

  // Prep the email for the user and send it
  let userEmail = [];

  userEmail.push(`<p>Your feedback has been recorded successfully.</p>`);
  userEmail.push(`<p>The confirmed details are:</p>`);
  userEmail.push("");
  userEmail.push(`<p>Subject: ${subject}</p>`);
  userEmail.push(`<p>Anonymous: ${anonymous ? "Yes" : "No"}</p>`)
  userEmail.push(`<p>Feedback Details:</p>`);

  // Makes the long form reason look nice by splitting into paragraph tags instead
  details.split("\n").forEach((paragraph) => {
    if(paragraph.length === 0) {
      return;
    }

    userEmail.push(`<p>${paragraph}</p>`);
  });

  userEmail.push(`<p>The JCR Vice President has been notified and will review your feedback.</p>`);

  mailer.sendEmail(user.email, `Feedback Confirmation`, userEmail.join(""));

  return res.status(204).end();
});

// Lists the feedback
router.get("/", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "feedback.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let feedback;

  // Will find all of the feedback and who wrote them
  try {
    feedback = await Feedback.findAll({
      include: [ User ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the feedback" });
  }

  return res.status(200).json({ feedback });
});

// Loads the in-depth details about a single feedback record
router.get("/single/:id", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "feedback.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  // Basic validation
  if(id === undefined || id === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  let feedback;

  // Loads all of the data about the complaint and gets the user's details too
  try {
    feedback = await Feedback.findOne({
      where: { id },
      include: [ User ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to query database for the complaint" });
  }

  // If it is null then the id was wrong
  if(feedback === null) {
    return res.status(400).json({ error: "No record found" });
  }

  return res.status(200).json({ feedback });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
