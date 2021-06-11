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

router.post("/create", async (req, res) => {
  if(!hasPermission(req.session, "sportsandsocs.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let { name, description, email, facebook, instagram, discord, type } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(!(description !== undefined && description !== null && description.length !== 0)) {
    return res.status(400).json({ error: "description name" });
  }

  if(!(email !== undefined && email !== null && email.length !== 0 && email.endsWith("@durham.ac.uk"))) {
    return res.status(400).json({ error: "Missing email" });
  }

  if(!(type !== undefined && type !== null && type.length !== 0)) {
    return res.status(400).json({ error: "Missing type" });
  }

  if(!(facebook === undefined || facebook === null || facebook.length === 0 || facebook.startsWith("https://"))) {
    return res.status(400).json({ error: "Missing facebook" });
  }

  if(!(instagram === undefined || instagram === null || instagram.length === 0 || instagram.startsWith("https://"))) {
    return res.status(400).json({ error: "Missing instagram" });
  }

  if(!(discord === undefined || discord === null || discord.length === 0 || discord.startsWith("https://"))) {
    return res.status(400).json({ error: "Missing discord" });
  }

  let record;

  try {
    record = await SportAndSoc.create({ name, description, email, facebook, instagram, discord, type });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the entry" });
  }

  return res.status(200).json({ record });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
