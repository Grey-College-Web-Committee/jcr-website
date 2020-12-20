// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const { Op } = require("sequelize");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dateFormat = require("dateformat");
const path = require("path");

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
    const aName = a.User.surname.toLowerCase();
    const bName = b.User.surname.toLowerCase();

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

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
