// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, PendingAlumniApplication } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const argon2 = require("argon2");
const { v4: uuidv4 } = require("uuid");
const mailer = require("../utils/mailer");

router.post("/register", async (req, res) => {
  const { username: rawUsername, email, password: rawPassword } = req.body;

  if(!rawUsername || rawUsername.trim().length !== 6) {
    return res.status(400).json({ error: "Missing username" });
  }

  if(!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  if(!rawPassword || rawPassword.trim().length < 8) {
    return res.status(400).json({ error: "Missing password" });
  }

  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if(!re.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const username = rawUsername.trim();
  const password = rawPassword.trim();

  // Check if they had an account, their account is not linked, and they don't have a pending application
  let existingUser;

  try {
    existingUser = await User.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ error: "Error checking user status" });
  }

  if(!existingUser) {
    return res.status(400).json({ error: `An account for ${username} has never existed` });
  }

  if(existingUser.password !== null) {
    return res.status(400).json({ error: "You already have an approved alumni account" });
  }

  let pendingApplicaton;

  try {
    pendingApplicaton = await PendingAlumniApplication.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check for pending applications" });
  }

  if(pendingApplicaton) {
    return res.status(400).json({ error: `A pending application already exists for ${username}` });
  }

  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const verificationToken = uuidv4();

  try {
    await PendingAlumniApplication.create({ username, email, password: hash, verificationToken });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create new application" });
  }

  let firstName = existingUser.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = existingUser.surname.charAt(0).toUpperCase() + existingUser.surname.substr(1).toLowerCase();

  const verifyUrl = `${process.env.WEB_ADDRESS}alumni/verify/${verificationToken}`;

  // Send the verification email
  mailer.sendEmail(email, `Verify Alumni Account`, [
    `<p>Hello ${firstName},</p>`,
    `<p>Please <a href="${verifyUrl}" rel="noopener noreferrer">click here to verify your Grey JCR alumni account.</a></p>`,
    `<p>Alternatively copy and paste the following URL into the address bar of your web browser: ${verifyUrl}</p>`,
    `<p>If you did not make this account please contact grey.website@durham.ac.uk immediately</p>`,
    `<p>Thank you</p>`
  ].join(""));

  return res.status(204).end();
});

router.post("/verify", async (req, res) => {
  const { token } = req.body;

  if(!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  let application;

  try {
    application = await PendingAlumniApplication.findOne({ where: { verificationToken: token } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to search by token" });
  }

  if(!application) {
    return res.status(400).json({ error: "Invalid token" });
  }

  if(application.verified) {
    return res.status(204).end();
  }

  application.verified = true;

  try {
    await application.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save" });
  }

  return res.status(204).end();
})

router.get("/pending", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  // Must have permission
  if(!hasPermission(req.session, "users.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let applications;

  try {
    applications = await PendingAlumniApplication.findAll({
      attributes: [ "id", "username", "email", "updatedAt" ],
      where: { verified: true }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch applications" });
  }

  return res.status(200).json({ applications });
})

router.post("/action", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  // Must have permission
  if(!hasPermission(req.session, "users.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, approved } = req.body;

  if(!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  let application;

  try {
    application = await PendingAlumniApplication.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the application" });
  }

  if(application === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if(!approved) {
    const email = application.email;

    try {
      await application.destroy();
    } catch (error) {
      return res.status(500).json({ error: "Unable to delete application" });
    }

    mailer.sendEmail(email, "Alumni Account Denied", prepareDeniedEmail());
    return res.status(204).end();
  }

  let userRecord;

  try {
    userRecord = await User.findOne({ where: { username: application.username } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the user record" });
  }

  if(!userRecord) {
    return res.status(500).json({ error: "Missing userRecord" });
  }

  userRecord.email = application.email;
  userRecord.password = application.password;

  try {
    await userRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the user record" });
  }

  mailer.sendEmail(application.email, "Alumni Account Approved", prepareApprovedEmail());
  return res.status(204).end();
});

const prepareDeniedEmail = () => {
  return [
    `<p>Hello,</p>`,
    "<p>Your application for an alumni account on the Grey JCR website has been denied.</p>",
    "<p>For more information, please respond to this email.</p>",
    "<p>Thank you.</p>"
  ].join("");
}

const prepareApprovedEmail = () => {
  return [
    `<p>Hello,</p>`,
    "<p>Your application for an alumni account on the Grey JCR website has been approved.</p>",
    "<p>You can now login to the website.</p>",
    "<p>Thank you.</p>"
  ].join("");
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
