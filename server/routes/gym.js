// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, ShopOrder } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const { Op } = require("sequelize");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dateFormat = require("dateformat");
const path = require("path");

const csvPath = path.join(__dirname, "../exports/gym/");

router.get("/active", async (req, res) => {
  const { user } = req.session;

  // Check if they have an existing membership
  let existingMemberships;

  try {
    existingMemberships = await GymMembership.findAll({
      include: [
        {
          model: User,
          where: {
            id: user.id
          },
          required: true
        },
        {
          model: ShopOrder,
          where: {
            paid: true
          },
          required: true
        }
      ]
    });
  } catch (error) {
    console.log({error});
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to check existing memberships"
    };
  }

  if(existingMemberships.length !== 0) {
    const currentDate = new Date();
    const unexpiredMemberships = existingMemberships.filter(membership => membership.expiresAt > currentDate);

    if(unexpiredMemberships.length !== 0) {
      return res.status(200).json({
        membership: unexpiredMemberships[0]
      });
    }
  }

  return res.status(200).json({ membership: null });
});

router.post("/export", async(req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "gym.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const startDateAsStr = req.body.startDate;
  const endDateAsStr = req.body.endDate;
  const expiredOnly = req.body.expiredOnly;

  if(startDateAsStr === null || startDateAsStr === undefined) {
    return res.status(400).json({ message: "Missing startDate" });
  }

  if(endDateAsStr === null || endDateAsStr === undefined) {
    return res.status(400).json({ message: "Missing endDate" });
  }

  if(expiredOnly === null || expiredOnly === undefined) {
    return res.status(400).json({ message: "Missing expiredOnly" });
  }

  const startDate = new Date(startDateAsStr);
  const endDate = new Date(endDateAsStr);

  const whereClause = {
    createdAt: {
      [Op.between]: [startDate, endDate]
    }
  };

  if(expiredOnly) {
    whereClause.expiresAt = {
      [Op.lt]: new Date()
    }
  }

  // Now get all memberships between these two dates that have been paid for
  const orders = await GymMembership.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        required: true
      },
      {
        model: ShopOrder,
        where: {
          paid: true
        },
        required: true
      }
    ]
  });

  const currentDate = new Date();
  const time = currentDate.getTime();
  const fileLocation = `${time}-${dateFormat(startDate, "yyyy-mm-dd")}-to-${dateFormat(endDate, "yyyy-mm-dd")}`;
  const fileNamePart = expiredOnly ? "ExpiredGymMemberships" : "AllGymMemberships";

  const csvWriter = createCsvWriter({
    path: `${csvPath}${fileNamePart}-${fileLocation}.csv`,
    header: [
      { id: "username", title: "Username" },
      { id: "firstNames", title: "First Names" },
      { id: "surname", title: "Surname" },
      { id: "createdAt", title: "Purchased At" },
      { id: "type", title: "Type" },
      { id: "expiresAt", title: "Expires At" },
      { id: "expired", title: "Expired?" },
      { id: "paid", title: "Paid?" }
    ]
  });

  let csvRecords = [];

  orders.sort((a, b) => {
    const aName = a.User.surname.toLowerCase();
    const bName = b.User.surname.toLowerCase();

    return aName > bName ? 1 : (aName < bName ? -1 : 0);
  }).forEach(order => {
    let record = {};

    record.username = order.User.username;
    record.firstNames = order.User.firstNames;
    record.surname = order.User.surname;
    record.createdAt = dateFormat(order.createdAt, "dd/mm/yyyy");
    record.type = order.type;
    record.expiresAt = dateFormat(order.expiresAt, "dd/mm/yyyy");

    record.expired = order.expiresAt < currentDate;
    record.paid = order.ShopOrder.paid;

    csvRecords.push(record);
  });

  try {
    await csvWriter.writeRecords(csvRecords);
  } catch (error) {
    return res.status(500).end({ error });
  }

  return res.status(200).json({ fileLocation });
});

router.get("/download/all/:file", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const file = req.params.file;

  if(file === undefined || file === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  const split = file.split("-");
  const millisecondsStr = split[0];

  if(new Date().getTime() > Number(millisecondsStr) + 1000 * 60 * 60) {
    return res.status(410).end();
  }

  const pathName = path.join(csvPath, `AllGymMemberships-${file}.csv`)

  return res.download(pathName, `AllGymMemberships-${file}.csv`, () => {
    res.status(404).end();
  });
});

router.get("/download/expired/:file", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const file = req.params.file;

  if(file === undefined || file === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  const split = file.split("-");
  const millisecondsStr = split[0];

  if(new Date().getTime() > Number(millisecondsStr) + 1000 * 60 * 60) {
    return res.status(410).end();
  }

  const pathName = path.join(csvPath, `ExpiredGymMemberships-${file}.csv`)

  return res.download(pathName, `ExpiredGymMemberships-${file}.csv`, () => {
    res.status(404).end();
  });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
