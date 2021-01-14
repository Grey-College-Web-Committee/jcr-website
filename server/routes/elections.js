// Get express
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Election, ElectionCandidate, ElectionVote, ElectionVoteLink } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "manifestos/" });
const { Op } = require("sequelize");

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

router.post("/candidate", upload.single("manifesto"), async (req, res) => {
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

router.delete("/candidate/:candidateId", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Brief validation
  const { candidateId } = req.params;

  if(candidateId === undefined || candidateId === null) {
    return res.status(400).json({ error: "candidateId is missing" });
  }

  let candidate;

  // Create the new election
  try {
    candidate = await ElectionCandidate.findOne({
      where: {
        id: candidateId
      }
    });
  } catch (error) {
    console.log("?");
    console.log(error);
    return res.status(500).json({ error });
  }

  if(candidate === null) {
    return res.status(400).json({ error: "Invalid candidateId" });
  }

  const filename = candidate.manifestoLink;

  try {
    await fs.unlink(`manifestos/${filename}`, (err) => {});
  } catch (error) {
    console.log("??");
    console.log(error);
    return res.status(500).json({ error: "Unable to delete manifesto" });
  }

  try {
    await candidate.destroy();
  } catch (error) {
    console.log("???");
    console.log(error);
    return res.status(500).json({ error: "Unable to delete candidate" });
  }

  // Returns a 200 status code
  return res.status(200).end();
});

router.get("/list", async (req, res) => {
  // Voting is open
  // So votingOpenTime < now < votingCloseTime
  const now = new Date();

  let liveElections;

  try {
    liveElections = await Election.findAll({
      where: {
        votingOpenTime: {
          [Op.lt]: now
        },
        votingCloseTime: {
          [Op.gt]: now
        }
      },
      include: [{
        model: ElectionCandidate,
        attributes: [ "name", "manifestoLink" ]
      }]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load live elections" });
  }

  let upcomingElections;

  try {
    upcomingElections = await Election.findAll({
      where: {
        votingOpenTime: {
          [Op.gt]: now
        }
      },
      include: [{
        model: ElectionCandidate,
        attributes: [ "name", "manifestoLink" ]
      }]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load upcoming elections" });
  }

  let previousElections;

  try {
    previousElections = await Election.findAll({
      where: {
        votingCloseTime: {
          [Op.lt]: now
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load previous elections" });
  }

  return res.status(200).json({ liveElections, upcomingElections, previousElections });
});

router.get("/election/:id", async (req, res) => {
  const { user } = req.session;

  const { id } = req.params;
  const now = new Date();

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  // Check if the election exists
  let election;

  try {
    election = await Election.findOne({
      where: { id },
      include: [{
        model: ElectionCandidate,
        attributes: [ "id", "name", "manifestoLink" ]
      }]
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to load election" });
  }

  if(election === null) {
    return res.status(400).json({ error: "Election does not exist" });
  }

  // Check the election is open for voting

  if(new Date(election.votingOpenTime) > now) {
    return res.status(400).json({ error: "Voting is not open yet" });
  }

  if(new Date(election.votingCloseTime) < now) {
    return res.status(400).json({ error: "Voting has already closed" });
  }

  // Election exists, so now check if the user has already voted

  let electionVote;

  try {
    electionVote = await ElectionVote.findOne({
      where: {
        electionId: id,
        userId: user.id
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to verify the user has only voted once" });
  }

  if(electionVote !== null) {
    return res.status(403).json({ error: "You have already voted in the election", election });
  }

  // The user has not voted and the election exists

  return res.status(200).json({ election });
});

router.post("/vote", async (req, res) => {
  const { user } = req.session;
  const { preferences, electionId } = req.body;

  if(preferences === undefined || preferences === null) {
    return res.status(400).json({ error: "Missing preferences" });
  }

  if(!Array.isArray(preferences)) {
    return res.status(400).json({ error: "preferences must be an array" });
  }

  if(electionId === undefined || electionId === null) {
    return res.status(400).json({ error: "Missing electionId" });
  }

  // Get the election and the candidate's ids

  let election;

  try {
    election = await Election.findOne({
      where: { id: electionId },
      include: [{
        model: ElectionCandidate,
        attributes: [ "id" ]
      }]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the election" });
  }

  if(election === null) {
    return res.status(400).json({ error: "Election does not exist" });
  }

  const now = new Date();

  // Check the election is open for voting

  if(new Date(election.votingOpenTime) > now) {
    return res.status(400).json({ error: "Voting is not open yet" });
  }

  if(new Date(election.votingCloseTime) < now) {
    return res.status(400).json({ error: "Voting has already closed" });
  }

  // Election exists, so now check if the user has already voted

  let electionVote;

  try {
    electionVote = await ElectionVote.findOne({
      where: {
        electionId,
        userId: user.id
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to verify the user has only voted once" });
  }

  if(electionVote !== null) {
    return res.status(403).json({ error: "You have already voted in the election", election });
  }

  // The user has not voted and the election exists
  // Now check that the candidates in their preferences are real

  let validCandidateIds = election.ElectionCandidates.map((candidate) => candidate.id);

  for(let entry of preferences) {
    if(!validCandidateIds.includes(entry.id)) {
      return res.status(400).json({ error: "Invalid candidate voted for" });
    }

    validCandidateIds = validCandidateIds.filter(id => id !== entry.id);
  }

  if(validCandidateIds.length !== 0) {
    return res.status(400).json({ error: "Not enough candidates voted for" });
  }

  // Now put the vote in the database

  let voteRecord;

  try {
    voteRecord = await ElectionVote.create({
      userId: user.id,
      electionId
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create a new vote" });
  }

  const voteId = voteRecord.id;

  for(let entry of preferences) {
    try {
      await ElectionVoteLink.create({
        voteId,
        candidateId: entry.id,
        preference: entry.preference
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to place preference on vote" });
    }
  }

  // Vote cast!

  return res.status(200).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
