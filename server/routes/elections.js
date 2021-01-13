// Get express
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Election, ElectionCandidate } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "manifestos/" });

router.post("/create", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Brief validation
  const { name, manifestoReleaseTime, votingOpenTime, votingCloseTime } = req.body;

  if(name === null) {
    return res.status(400).json({ error: "Name is missing" });
  }

  if(name.length === 0) {
    return res.status(400).json({ error: "Name is empty" });
  }

  if(manifestoReleaseTime === null) {
    return res.status(400).json({ error: "manifestoReleaseTime is missing" });
  }

  if(votingOpenTime === null) {
    return res.status(400).json({ error: "votingOpenTime is missing" });
  }

  if(votingCloseTime === null) {
    return res.status(400).json({ error: "votingCloseTime is missing" });
  }

  let result;

  // Create the new election
  try {
    result = await Election.create({ name, manifestoReleaseTime, votingOpenTime, votingCloseTime });
  } catch (error) {
    return res.status(500).json({ error });
  }

  // Returns a 200 status code with a short JSON response
  return res.status(200).json(result);
});

router.post("/candidate/create", upload.single("manifesto"), async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, electionId } = req.body;
  const manifestoLink = req.file.filename;

  // Check the election exists
  let election;

  try {
    election = await Election.findOne({
      where: {
        id: electionId
      }
    });
  } catch (error) {
    await fs.unlink(`manifestos/${manifestoLink}`, (err) => {});
    return res.status(500).json({ error });
  }

  if(election === null) {
    await fs.unlink(`manifestos/${manifestoLink}`, (err) => {});
    return res.status(400).json({ error: "Election does not exist" });
  }

  // Election exists

  let candidate;

  try {
    candidate = await ElectionCandidate.create({ name, electionId, manifestoLink });
  } catch (error) {
    return res.status(500).json({ error });
  }

  // Returns a 200 status code with a short JSON response
  return res.status(200).json(candidate);
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
