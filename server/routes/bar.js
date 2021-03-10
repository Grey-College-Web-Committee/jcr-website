// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, BarDrinkType, BarDrinkSize, BarBaseDrink, BarDrink, BarMixer } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.get("/", async (req, res) => {
  return res.status(200).end();
});

router.post("/", async (req, res) => {
  return res.status(204).end();
});

router.get("/admin", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  return res.status(200).json({ userHadPermission: true });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
