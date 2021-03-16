// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, JCRRole, JCRRoleUserLink, JCRCommittee, JCRCommitteeRoleLink } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.post("/committee", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, description } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined || description === null || description.length === 0) {
    return res.status(400).json({ error: "Missing description" });
  }

  let committee;

  try {
    committee = await JCRCommittee.create({ name, description });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the committee" });
  }

  if(committee === null) {
    return res.status(500).json({ error: "Unable to create the committee, null" });
  }

  return res.status(200).json({ committee });
});

router.get("/committees", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let committees;

  try {
    committees = await JCRCommittee.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the committees" });
  }

  return res.status(200).json({ committees });
});

router.post("/committee/update", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, description } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined || description === null || description.length === 0) {
    return res.status(400).json({ error: "Missing description" });
  }

  let committee;

  try {
    committee = await JCRCommittee.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the committee" });
  }

  if(committee === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  committee.name = name;
  committee.description = description;

  try {
    await committee.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the committee changes" });
  }

  return res.status(204).end();
})

router.delete("/committee/:id", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  try {
    await JCRCommittee.destroy({ where: { id }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the committee" });
  }

  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
