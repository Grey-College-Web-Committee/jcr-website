// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, WelfareThread, WelfareThreadMessage } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const hash = require("object-hash");

router.get("/threads", async (req, res) => {
  const { user } = req.session;
  const userIdHash = hash({ username: user.id });

  let threads;

  try {
    threads = await WelfareThread.findAll({
      where: {
        userHash: userIdHash
      },
      attributes: [ "id", "title", "createdAt" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the welfare threads" });
  }

  return res.status(200).json({ threads });
});

router.get("/threads/admin", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "welfare.anonymous")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let threads;

  try {
    threads = await WelfareThread.findAll({
      attributes: [ "id", "title", "createdAt" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find all threads" });
  }

  return res.status(200).json({ threads });
});

router.post("/thread", async (req, res) => {
  const { user } = req.session;
  const { title } = req.body;

  if(title === undefined || title === null) {
    return res.status(400).json({ error: "No title set" });
  }

  const userIdHash = hash({ username: user.id });

  let thread;

  try {
    thread = await WelfareThread.create({
      userHash: userIdHash,
      title
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Unable to create a new thread" });
  }

  return res.status(200).json({ threadId: thread.id });
});

router.get("/thread/admin/:threadId", async(req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "welfare.anonymous")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { threadId } = req.params;

  if(threadId === undefined || threadId === null) {
    return res.status(400).json({ error: "No title set" });
  }

  const userIdHash = hash({ username: user.id });

  let thread;

  try {
    thread = await WelfareThread.findOne({
      where: {
        id: threadId
      },
      attributes: [ "id", "title", "createdAt", "updatedAt" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get thread" });
  }

  if(thread === null) {
    return res.status(400).json({ error: "No thread found" });
  }

  let messages;

  try {
    messages = await WelfareThreadMessage.findAll({ where: { threadId } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find messages" });
  }

  return res.status(200).json({ thread, messages });
});

router.get("/thread/:threadId", async(req, res) => {
  const { user } = req.session;
  const { threadId } = req.params;

  if(threadId === undefined || threadId === null) {
    return res.status(400).json({ error: "No title set" });
  }

  const userIdHash = hash({ username: user.id });

  let thread;

  try {
    thread = await WelfareThread.findOne({
      where: {
        id: threadId,
        userHash: userIdHash
      },
      attributes: [ "id", "title", "createdAt", "updatedAt" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get thread" });
  }

  if(thread === null) {
    return res.status(400).json({ error: "No thread found" });
  }

  let messages;

  try {
    messages = await WelfareThreadMessage.findAll({ where: { threadId } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find messages" });
  }

  return res.status(200).json({ thread, messages });
});

router.post("/message/admin", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "welfare.anonymous")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }
  
  const { threadId, message } = req.body;

  if(threadId === undefined || threadId === null) {
    return res.status(400).json({ error: "No threadId set" });
  }

  if(message === undefined || message === null || message.length === 0) {
    return res.status(400).json({ error: "No message set" });
  }

  let result;

  try {
    result = await WelfareThreadMessage.create({
      threadId,
      from: "welfare",
      content: message
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find messages" });
  }

  // need to email SWOs

  return res.status(200).json({ message: result });
});

router.post("/message", async (req, res) => {
  const { user } = req.session;
  const { threadId, message } = req.body;

  if(threadId === undefined || threadId === null) {
    return res.status(400).json({ error: "No threadId set" });
  }

  if(message === undefined || message === null || message.length === 0) {
    return res.status(400).json({ error: "No message set" });
  }

  let result;

  try {
    result = await WelfareThreadMessage.create({
      threadId,
      from: "user",
      content: message
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find messages" });
  }

  // need to email SWOs

  return res.status(200).json({ message: result });
});

router.delete("/thread/:threadId", async (req, res) => {
  const { user } = req.session;
  const { threadId } = req.params;

  if(threadId === undefined || threadId === null) {
    return res.status(400).json({ error: "No title set" });
  }

  const userIdHash = hash({ username: user.id });

  let result;

  try {
    result = await WelfareThread.destroy({
      where: {
        id: threadId,
        userHash: userIdHash
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get thread" });
  }

  if(result === 0) {
    return res.status(400).end();
  }

  return res.status(204).end();
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
