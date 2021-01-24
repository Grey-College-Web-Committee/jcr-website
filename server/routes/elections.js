// Get express
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Election, ElectionCandidate, ElectionVote, ElectionVoteLink, ElectionEditLog } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "manifestos/" });
const { Op } = require("sequelize");
const mailer = require("../utils/mailer");

router.post("/election/publish/", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  let election;

  try {
    election = await Election.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the election, db error" });
  }

  if(election === null) {
    return res.status(400).json({ error: "No election with that ID" });
  }

  if(election.winner === null) {
    return res.status(400).json({ error: "The election results have not been generated" });
  }

  election.published = true;

  try {
    await election.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the published state" });
  }

  return res.status(204).end();
});

router.get("/election/admin/:id", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  let election;

  try {
    election = await Election.findOne({
      where: { id },
      include: ElectionCandidate
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the election, db error" });
  }

  if(election === null) {
    return res.status(400).json({ error: "No election with that ID" });
  }

  if(election.winner !== null) {
    return res.status(400).json({ error: "The election results have already been generated" });
  }

  let editLog;

  try {
    editLog = await ElectionEditLog.findAll({
      where: { electionId: election.id },
      include: [ User ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the edit log, db error" });
  }

  return res.status(200).json({ election, editLog });
})

router.post("/edit", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, manifestoReleaseTime, votingOpenTime, votingCloseTime, reason } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "name is missing" });
  }

  if(manifestoReleaseTime === undefined || manifestoReleaseTime === null || manifestoReleaseTime.length === 0) {
    return res.status(400).json({ error: "manifestoReleaseTime is missing" });
  }

  if(votingOpenTime === undefined || votingOpenTime === null || votingOpenTime.length === 0) {
    return res.status(400).json({ error: "votingOpenTime is missing" });
  }

  if(votingCloseTime === undefined || votingCloseTime === null || votingCloseTime.length === 0) {
    return res.status(400).json({ error: "votingCloseTime is missing" });
  }

  if(reason === undefined || reason === null || reason.length === 0) {
    return res.status(400).json({ error: "votingCloseTime is missing" });
  }

  try {
    election = await Election.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error trying to find the election" });
  }

  if(election === null) {
    return res.status(400).json({ error: "No election found for the id" });
  }

  let changes = [];

  if(name !== election.name) {
    changes.push(`name (${election.name} --> ${name})`);
    election.name = name;
  }

  if(new Date(manifestoReleaseTime).getTime() !== new Date(election.manifestoReleaseTime).getTime()) {
    changes.push(`manifestoReleaseTime (${election.manifestoReleaseTime} --> ${manifestoReleaseTime})`);
    election.manifestoReleaseTime = manifestoReleaseTime;
  }

  if(new Date(votingOpenTime).getTime() !== new Date(election.votingOpenTime).getTime()) {
    changes.push(`votingOpenTime (${election.votingOpenTime} --> ${votingOpenTime})`);
    election.votingOpenTime = votingOpenTime;
  }

  if(new Date(votingCloseTime).getTime() !== new Date(election.votingCloseTime).getTime()) {
    changes.push(`votingCloseTime (${election.votingCloseTime} --> ${votingCloseTime})`);
    election.votingCloseTime = votingCloseTime;
  }

  if(changes.length === 0) {
    return res.status(400).json({ error: "No changes made" });
  }

  const action = changes.join(";");

  try {
    await ElectionEditLog.create({
      userId: user.id,
      electionId: id,
      action,
      reason
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to log the change. No changes saved." });
  }

  try {
    await election.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the election changes" });
  }

  return res.status(200).json({ election });
})

router.delete("/:id", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Brief validation
  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  let election;

  // Create the new election
  try {
    election = await Election.findOne({
      where: { id },
      include: [{
        model: ElectionCandidate,
        attributes: [ "id", "manifestoLink" ]
      }]
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  if(election === null) {
    return res.status(400).json({ error: "Invalid election ID" });
  }

  // First delete all of the candidates and their manifestos
  for(candidate of election.ElectionCandidates) {
    let candidateRecord;

    try {
      candidateRecord = await ElectionCandidate.findOne({
        where: { id: candidate.id }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to get individual candidate" });
    }

    // Delete the manifesto
    if(candidateRecord !== null) {
      await fs.unlink(`manifestos/${candidateRecord.manifestoLink}`, (err) => {});
    }

    // Now delete the candidate
    try {
      await candidateRecord.destroy();
    } catch (error) {
      return res.status(500).json({ error: "Unable to delete individual candidate" });
    }
  }

  const { name } = election;

  // Now delete the election
  try {
    await election.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete election" });
  }

  let deletionEmail = [];
  deletionEmail.push(`<p>${user.username} (${user.firstNames} ${user.surname}) has just deleted election ${name}</p>`);

  //mailer.sendEmail("grey.website@durham.ac.uk", `Election Deleted ${name}`, deletionEmail.join(""));
  return res.status(204).end();
});

router.get("/list/admin/", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let elections;

  try {
    elections = await Election.findAll({
      attributes: [ "id", "name", "manifestoReleaseTime", "votingOpenTime", "votingCloseTime", "winner", "published" ],
      include: [{
        model: ElectionCandidate,
        attributes: [ "name", "manifestoLink" ]
      }],
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load the elections" });
  }

  return res.status(200).json({ elections });
});

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
    return res.status(500).json({ error });
  }

  if(candidate === null) {
    return res.status(400).json({ error: "Invalid candidateId" });
  }

  const filename = candidate.manifestoLink;

  try {
    await fs.unlink(`manifestos/${filename}`, (err) => {});
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete manifesto" });
  }

  try {
    await candidate.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete candidate" });
  }

  // Returns a 200 status code
  return res.status(200).end();
});

router.get("/list", async (req, res) => {
  const { user } = req.session;
  // Voting is open
  // So votingOpenTime < now < votingCloseTime
  const now = new Date();

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "Only JCR members can vote" });
  }

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
      }, {
        model: ElectionVote,
        attributes: [ "id" ],
        where: {
          userId: user.id
        },
        required: false
      }],
      attributes: [ "id", "name", "manifestoReleaseTime", "votingOpenTime", "votingCloseTime" ]
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
        },
        manifestoReleaseTime: {
          [Op.lt]: now
        },
      },
      include: [{
        model: ElectionCandidate,
        attributes: [ "name", "manifestoLink" ]
      }],
      attributes: [ "name", "manifestoReleaseTime", "votingOpenTime", "votingCloseTime" ]
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
      },
      attributes: [ "name", "manifestoReleaseTime", "votingOpenTime", "votingCloseTime", "winner", "published" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load previous elections" });
  }

  previousElections.forEach((election, i) => {
    if(election.published === false) {
      election.winner = null;
    }
  });

  return res.status(200).json({ liveElections, upcomingElections, previousElections });
});

router.get("/election/:id", async (req, res) => {
  const { user } = req.session;

  const { id } = req.params;
  const now = new Date();

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "Only JCR members can vote" });
  }

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

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "Only JCR members can vote" });
  }

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

router.get("/result/:electionId", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "elections.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { electionId } = req.params;

  if(electionId === undefined || electionId === null) {
    return res.status(400).json({ error: "Missing the election ID" });
  }

  // Check the election exists and is finished

  const now = new Date();

  let election;

  try {
    election = await Election.findOne({
      where: { id: electionId },
      include: [{
        model: ElectionCandidate,
        attributes: [ "id", "name" ]
      }]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the election" });
  }

  if(election === null) {
    return res.status(400).json({ error: "Election does not exist" });
  }

  // We've already generated the results
  if(election.winner !== null) {
    return res.status(200).json({
      election,
      overallWinner: election.winner !== "draw" ? election.winner : null,
      overallDraw: election.winner === "draw",
      deepLog: JSON.parse(election.deepLog),
      roundSummaries: JSON.parse(election.roundSummaries),
      fresh: false
    })
  }

  // Check the election is closed

  if(new Date(election.votingCloseTime) > now) {
    return res.status(400).json({ error: "Voting has not closed yet" });
  }

  const candidateIds = election.ElectionCandidates.map(candidate => candidate.id);
  const totalCandidates = candidateIds.length;

  // We now have to work out who wins
  /*
  1. Calculate quota (floor(votes / 2) + 1)
  2. Calculate the first preference votes for each candidate
  3. If one achieves quota we are done
  4. If none do then eliminate the lowest
  --> If we have losers' tie then tally everyones 2nd preference votes that are the two runoff losers
  --> If we still have a draw then we are going to have to randomly select one
  5. Repeat from step 1 but using the next preference for those who voted for the loser
  */

  let voteRecords;

  try {
    voteRecords = await ElectionVote.findAll({
      where: { electionId }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the votes from the database" });
  }

  const totalVotes = voteRecords.length;

  if(totalVotes === 0) {
    // No votes??
    return res.status(400).json({ error: "No votes cast" });
  }

  // Now lets get each users total preference order
  let voterPreferences = [];
  let validVoters = 0;
  let invalidVoters = 0;

  for(const record of voteRecords) {
    let individualPreferenceRecords;

    try {
      individualPreferenceRecords = await ElectionVoteLink.findAll({
        where: {
          voteId: record.id
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the preferences from the database" });
    }

    // Shouldn't happen but means they haven't voted enough
    if(individualPreferenceRecords.length !== totalCandidates) {
      invalidVoters++;
      return;
    }

    const individualPreferences = individualPreferenceRecords.sort((a, b) => {
      return a.preference < b.preference ? -1 : (a.preference > b.preference ? 1 : 0);
    }).map(record => record.candidateId);

    // Shouldn't happen but means they haven't voted for every candidate
    if(candidateIds.filter(id => individualPreferences.includes(id)).length !== candidateIds.length) {
      invalidVoters++;
      return;
    }

    voterPreferences.push(individualPreferences);
    validVoters++;
  }

  if(validVoters !== totalVotes) {
    // Shouldn't happen
    return res.status(500).json({ error: "Some votes were deemed invalid" });
  }

  // So we now have everyones preferences
  const { overallWinner, overallDraw, deepLog, roundSummaries } = findSTVWinner(candidateIds, voterPreferences);

  // Change the winner's ID to the winner's name
  if(overallDraw) {
    election.winner = "draw";
  } else {
    election.winner = election.ElectionCandidates.filter(candidate => candidate.id === Number(overallWinner))[0].name;
  }

  election.deepLog = JSON.stringify(deepLog);

  // We change the IDs to the actual names here
  roundSummaries.forEach(round => {
    if(round.roundSummaryData.eliminated !== null) {
      round.roundSummaryData.eliminated = election.ElectionCandidates.filter(candidate => candidate.id === Number(round.roundSummaryData.eliminated))[0].dataValues.name;
    }

    if(round.roundSummaryData.winner !== null && round.roundSummaryData.winner !== "draw") {
      round.roundSummaryData.winner = election.ElectionCandidates.filter(candidate => candidate.id === Number(round.roundSummaryData.winner))[0].dataValues.name;
    }

    let votesByCandidate = {};

    Object.keys(round.roundSummaryData.votes).forEach(id => {
      const candidateName = election.ElectionCandidates.filter(candidate => candidate.id === Number(id))[0].dataValues.name;
      votesByCandidate[candidateName] = round.roundSummaryData.votes[id];
    });

    round.roundSummaryData.votes = votesByCandidate;
  });

  election.roundSummaries = JSON.stringify(roundSummaries);

  try {
    await election.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the results to the database "});
  }

  return res.status(200).json({ election, overallWinner, overallDraw, deepLog, roundSummaries, fresh: true });
});

const findSTVWinner = (candidateIds, voterPreferences) => {
  const deepLog = [];
  const roundSummaries = [];

  let contenderIds = candidateIds;
  let loserIds = [];
  let overallWinner = null;
  let round = 0;
  let overallDraw = false;

  while(overallWinner === null && !overallDraw) {
    const { winner, draw, eliminatedId, roundLog, roundSummaryData } = performSTVRound(contenderIds, voterPreferences);

    deepLog.push({ round, roundLog });
    roundSummaries.push({ round, roundSummaryData });

    if(eliminatedId !== null) {
      loserIds.push(eliminatedId);
      contenderIds = contenderIds.filter(id => id !== eliminatedId);
    }

    round++;
    overallWinner = winner;
    overallDraw = draw;
  }

  return { overallWinner, overallDraw, deepLog, roundSummaries };
}

const performSTVRound = (contenderIds, voterPreferences) => {
  const roundLog = [];
  const roundSummaryData = {};

  // We will use this to track the votes
  let talliedVotes = {};

  contenderIds.forEach((id) => {
    talliedVotes[id] = [];
  });

  let trueVoterCount = 0;

  for(let voterIndex = 0; voterIndex < voterPreferences.length; voterIndex++) {
    const preferences = voterPreferences[voterIndex];
    let voted = false;

    // Cast the vote
    // We look at their nth pref, if they are still in we cast the vote
    // otherwise we go to the (n + 1)th pref
    for(let i = 0; i < preferences.length; i++) {
      const id = preferences[i];
      if(contenderIds.includes(id)) {
        talliedVotes[id].push(voterIndex);
        voted = true;
        // We will keep a log of what is happening in the vote
        roundLog.push(`Vote cast for ${id} (preference position: ${i}, voter index: ${voterIndex})`);
        break;
      }
    }

    if(!voted) {
      roundLog.push(`[ERROR] No vote cast by voter index ${voterIndex}`);
    } else {
      trueVoterCount++;
    }
  }

  if(trueVoterCount !== voterPreferences.length) {
    roundLog.push(`[ERROR] Not all voters (${trueVoterCount}/${voterPreferences.length}) cast a vote. This shouldn't happen.`);
  }

  // The minimum number of votes to win on this round
  const quota = Math.floor(trueVoterCount / 2) + 1;
  roundLog.push(`Quota: ${quota}`);
  roundSummaryData.totalVotes = trueVoterCount;
  roundSummaryData.quota = quota;

  // Now lets check if anyone has reached quota
  let winner = null;
  let lowestVotes = trueVoterCount + 1;
  let lowestContenderIds = [];

  roundSummaryData.votes = {};
  for(const contenderId of contenderIds) {
    const votes = talliedVotes[contenderId].length;

    // Things get more interesting when we have draw for the losers
    if(votes === lowestVotes) {
      lowestContenderIds.push(contenderId);
    }

    if(votes < lowestVotes) {
      lowestVotes = votes;
      lowestContenderIds = [contenderId];
    }

    if(votes >= quota) {
      winner = contenderId;
    }

    roundLog.push(`Candidate ${contenderId}: ${votes} votes`);
    roundSummaryData.votes[contenderId] = votes;
  }

  // We've found a winner
  if(winner !== null) {
    roundLog.push(`Candidate ${winner} achieves quota!`);
    roundSummaryData.winner = winner;
    roundSummaryData.tiebreakerDepth = 0;
    roundSummaryData.eliminated = null;
    roundSummaryData.overallDraw = false;

    return {
      winner: winner,
      draw: false,
      eliminatedId: null,
      roundLog,
      roundSummaryData
    }
  }

  roundSummaryData.winner = null;

  // Otherwise lets determine who gets eliminated
  // Easy when we only have 1 with the lowest
  if(lowestContenderIds.length === 1) {
    roundLog.push(`Candidate ${lowestContenderIds[0]} is eliminated with ${lowestVotes} votes`);
    roundSummaryData.tiebreakerDepth = 0;
    roundSummaryData.eliminated = lowestContenderIds[0];
    roundSummaryData.overallDraw = false;

    return {
      winner: null,
      draw: false,
      eliminatedId: Number(lowestContenderIds[0]),
      roundLog,
      roundSummaryData
    }
  }

  // We have a complete draw
  if(lowestContenderIds.length === contenderIds.length) {
    roundLog.push(`Candidates ${lowestContenderIds.join(", ")} have ended in a complete tie. Nobody achieves quota.`);
    roundSummaryData.tiebreakerDepth = 0;
    roundSummaryData.eliminated = null;
    roundSummaryData.overallDraw = true;
    roundSummaryData.winner = "draw";

    return {
      winner: null,
      draw: true,
      eliminatedId: null,
      roundLog,
      roundSummaryData
    }
  }

  // We have a loser tie
  // Have to do a tiebreaker
  roundLog.push(`Multiple candidates have the lowest number of votes (candidates ${lowestContenderIds.join(", ")}) with ${lowestVotes} votes`);

  // We now look at everyone who didn't voter for any of the candidates in the tiebreaker
  // We take their choice of losers from their next preferences (e.g. 21, 22 in tiebreaker
  // and someone voted for 20 with the voting preferences [20, 24, 22, 21] they would put
  // a tiebreaker vote for 22)
  // It becomes FPTP instead of STV
  let tiebreakerVotes = {};

  lowestContenderIds.forEach((id) => {
    tiebreakerVotes[id] = 0;
  });

  let tiebreakerVoterIndices = [];

  contenderIds.forEach((id) => {
    if(lowestContenderIds.includes(id)) {
      return;
    }

    // We're only interested in those not in the tiebreaker
    tiebreakerVoterIndices = tiebreakerVoterIndices.concat(talliedVotes[id]);
  });

  const totalTiebreakerVotes = tiebreakerVoterIndices.length;
  roundLog.push(`Total tiebreaker votes: ${totalTiebreakerVotes}`);
  let validTiebreakerVotes = 0;

  // We now have an array of indices matching to the preferences of the tiebreaker voters
  for(const voterIndex of tiebreakerVoterIndices) {
    const preferences = voterPreferences[voterIndex];
    let voted = false;

    for(let preference = 0; preference < preferences.length; preference++) {
      const candidateId = preferences[preference];

      if(lowestContenderIds.includes(candidateId)) {
        tiebreakerVotes[candidateId]++;
        roundLog.push(`Voter index ${voterIndex} voted for ${candidateId} in the tiebreaker`);
        voted = true;
        break;
      }
    }

    if(voted) {
      validTiebreakerVotes++;
    } else {
      roundLog.push(`Voter index ${voterIndex} did not vote in the tiebreaker (no candidate found)`);
    }
  }

  // We now have the votes

  let lowestTiebreakerVotes = validTiebreakerVotes + 1;
  let lowestTiebreakerIds = [];

  // I think 'in' should be fine here as it's iterating object keys
  for(const tiebreakerId in tiebreakerVotes) {
    const votes = tiebreakerVotes[tiebreakerId];

    // Things get more interesting when we have draw for the losers of the tiebreaker
    if(votes === lowestTiebreakerVotes) {
      lowestTiebreakerIds.push(tiebreakerId);
    }

    if(votes < lowestTiebreakerVotes) {
      lowestTiebreakerVotes = votes;
      lowestTiebreakerIds = [tiebreakerId];
    }

    roundLog.push(`Candidate ${tiebreakerId}: ${votes} tiebreaker votes`);
  }

  if(lowestTiebreakerIds.length === 1) {
    roundLog.push(`Candidate ${lowestTiebreakerIds[0]} is eliminated with ${lowestTiebreakerVotes} votes after 1st tiebreaker`);
    roundSummaryData.tiebreakerDepth = 1;
    roundSummaryData.eliminated = lowestTiebreakerIds[0];
    roundSummaryData.overallDraw = false;
    return {
      winner: null,
      draw: false,
      eliminatedId: Number(lowestTiebreakerIds[0]),
      roundLog,
      roundSummaryData
    }
  }

  roundLog.push(`Multiple candidates have the lowest number of votes in the 2nd tiebreaker (candidates ${lowestTiebreakerIds.join(", ")}) with ${lowestTiebreakerVotes} votes`);

  // If we end up with another tie then it is luck of the draw who gets eliminated
  // this is the tiebreaker of the tiebreaker and only involves the losing candidates from
  // the tiebreaker itself
  const unluckyTiebreakerId = lowestTiebreakerIds[Math.floor(Math.random() * lowestTiebreakerIds.length)];
  roundLog.push(`Candidate ${unluckyTiebreakerId} was eliminated with ${lowestTiebreakerVotes} votes after 2nd tiebreaker (randomly eliminated from losers of 2nd tiebreaker)`);

  roundSummaryData.tiebreakerDepth = 2;
  roundSummaryData.eliminated = unluckyTiebreakerId;
  roundSummaryData.overallDraw = false;

  return {
    winner: null,
    draw: false,
    eliminatedId: Number(unluckyTiebreakerId),
    roundLog,
    roundSummaryData
  }
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
