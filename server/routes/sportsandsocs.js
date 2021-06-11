// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, SportAndSoc } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.get("/", async (req, res) => {
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let sportsAndSocs;

  try {
    sportsAndSocs = await SportAndSoc.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the sports and socs" });
  }

  // Returns a 200 status code with a short JSON response
  return res.status(200).json({ sportsAndSocs });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
