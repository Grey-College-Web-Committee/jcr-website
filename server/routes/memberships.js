// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const { Op } = require("sequelize");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dateFormat = require("dateformat");
const path = require("path");
const mailer = require("../utils/mailer");

const csvPath = path.join(__dirname, "../exports/memberships/");

router.post("/export", async(req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Now get all memberships between these two dates that have been paid for
  const members = await User.findAll({
    where: {
      membershipExpiresAt: {
        [Op.gt]: new Date()
      }
    }
  });

  const currentDate = new Date();
  const time = currentDate.getTime();
  const fileLocation = `${time}`;

  const csvWriter = createCsvWriter({
    path: `${csvPath}JCRMembers-${fileLocation}.csv`,
    header: [
      { id: "username", title: "Username" },
      { id: "firstNames", title: "First Names" },
      { id: "surname", title: "Surname" },
      { id: "expiresAt", title: "Expires At" }
    ]
  });

  let csvRecords = [];

  members.sort((a, b) => {
    const aName = a.surname.toLowerCase();
    const bName = b.surname.toLowerCase();

    return aName > bName ? 1 : (aName < bName ? -1 : 0);
  }).forEach(member => {
    let record = {};

    record.username = member.username;
    record.firstNames = member.firstNames;
    record.surname = member.surname;
    record.expiresAt = dateFormat(member.membershipExpiresAt, "dd/mm/yyyy");

    csvRecords.push(record);
  });

  try {
    await csvWriter.writeRecords(csvRecords);
  } catch (error) {
    return res.status(500).end({ error });
  }

  return res.status(200).json({ fileLocation });
});

router.get("/download/:file", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const millisecondsStr = req.params.file;

  if(millisecondsStr === undefined || millisecondsStr === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  if(new Date().getTime() > Number(millisecondsStr) + 1000 * 60 * 60) {
    return res.status(410).end();
  }

  const pathName = path.join(csvPath, `JCRMembers-${millisecondsStr}.csv`)

  return res.download(pathName, `JCRMembers-${millisecondsStr}.csv`, () => {
    res.status(404).end();
  });
});

router.get("/user/ids", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let userRecords;

  try {
    userRecords = await User.findAll({
      attributes: [ "id" ]
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  const ids = userRecords.map(record => record.id);
  return res.status(200).json({ ids });
})

router.get("/user/single/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const id = req.params.id;

  if(id === undefined || id === null || !Number.isInteger(Number(id))) {
    return res.status(400).json({ error: "Invalid or missing id" });
  }

  let userRecord;

  try {
    userRecord = await User.findOne({
      where: { id },
      attributes: [ "id", "username", "surname", "firstNames", "year", "lastLogin", "membershipExpiresAt", "createdAt" ]
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  if(userRecord === null) {
    return res.status(400).json({ error: "id does not match record" });
  }

  return res.status(200).json({ user: userRecord.dataValues });
});

const customerJCRGrantedEmail = (user, expiresAt) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<h1>JCR Membership Approved</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your membership has been confirmed and registered with the JCR.</p>`);
  message.push(`<p>Please logout and back into the website to gain access to the JCR services!</p>`);
  message.push(`<p>Your membership will expire on ${dateFormat(expiresAt, "dd/mm/yyyy")}.</p>`);
  message.push(`<p><strong>Thank you!</strong></p>`);

  return message.join("");
}

router.post("/grant", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { userId, expiry } = req.body;

  if(userId === undefined || userId === null || !Number.isInteger(userId)) {
    return res.status(400).json({ error: "Missing userId" });
  }

  if(expiry === undefined || expiry === null || typeof expiry !== "string") {
    return res.status(400).json({ error: "Missing userId" });
  }

  const membershipExpiresAt = new Date(expiry);

  let userRecord;

  try {
    userRecord = await User.findOne({
      where: {
        id: userId
      }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  userRecord.membershipExpiresAt = membershipExpiresAt;

  try {
    await userRecord.save();
  } catch (error) {
    return res.status(500).json({ error });
  }

  let permissionRecord;

  try {
    permissionRecord = await Permission.findOne({
      where: {
        internal: "jcr.member"
      }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  if(permissionRecord === null) {
    return res.status(500).json({ error: "Unable to locate permission" });
  }

  try {
    await PermissionLink.create({
      grantedToId: userRecord.id,
      permissionId: permissionRecord.id,
      grantedById: user.id
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  // Send the user an email to let them know

  //const customerEmail = customerJCRGrantedEmail(userRecord, membershipExpiresAt);
  //mailer.sendEmail(userRecord.email, `JCR Membership Approved`, customerEmail);
  return res.status(204).end();
});

router.post("/revoke", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { userId } = req.body;

  if(userId === undefined || userId === null || !Number.isInteger(userId)) {
    return res.status(400).json({ error: "Missing userId" });
  }

  let userRecord;

  try {
    userRecord = await User.findOne({
      where: {
        id: userId
      }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  userRecord.membershipExpiresAt = null;

  try {
    await userRecord.save();
  } catch (error) {
    return res.status(500).json({ error });
  }

  let permissionRecord;

  try {
    permissionRecord = await Permission.findOne({
      where: {
        internal: "jcr.member"
      }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  if(permissionRecord === null) {
    return res.status(500).json({ error: "Unable to locate permission" });
  }

  try {
    await PermissionLink.destroy({
      where: {
        grantedToId: userRecord.id,
        permissionId: permissionRecord.id
      }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
