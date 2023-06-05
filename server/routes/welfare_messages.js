// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, WelfareThread, WelfareThreadMessage } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const hash = require("object-hash");
const mailer = require("../utils/mailer");
const { Op } = require("sequelize")

router.get("/threads", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const userIdHash = hash({ username: user.id });

  let threads;

  try {
    threads = await WelfareThread.findAll({
      where: {
        userHash: userIdHash
      },
      attributes: [ "id", "title", "createdAt", "lastUpdate" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the welfare threads" });
  }

  return res.status(200).json({ threads });
});

router.post("/thread", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { title, notify } = req.body;

  if(title === undefined || title === null) {
    return res.status(400).json({ error: "No title set" });
  }

  if(notify === undefined || notify === null) {
    return res.status(400).json({ error: "No notify set" });
  }

  const userIdHash = hash({ username: user.id });

  let userEmail = null;

  if(notify) {
    userEmail = user.email;
  }

  let thread;

  try {
    thread = await WelfareThread.create({
      userHash: userIdHash,
      title,
      lastUpdate: new Date(),
      userEmail
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create a new thread" });
  }

  return res.status(200).json({ threadId: thread.id });
});

router.get("/thread/:threadId", async(req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.member")) {
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
        id: threadId,
        userHash: userIdHash
      },
      attributes: [ "id", "title", "createdAt", "lastUpdate" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get thread" });
  }

  if(thread === null) {
    return res.status(400).json({ error: "No thread found" });
  }

  let messages;

  try {
    messages = await WelfareThreadMessage.findAll({
      where: { threadId },
      attributes: {
        exclude: ["viewedAt"]
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find messages" });
  }

  const now = new Date();

  try {
    await WelfareThreadMessage.update({
      viewedAt: now
    }, {
      where: {
        threadId,
        viewedAt: null
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to update message data" });
  }

  return res.status(200).json({ thread, messages });
});

router.post("/message", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { threadId, message } = req.body;

  if(threadId === undefined || threadId === null) {
    return res.status(400).json({ error: "No threadId set" });
  }

  if(message === undefined || message === null || message.length === 0) {
    return res.status(400).json({ error: "No message set" });
  }

  let permission;

  try {
    permission = await Permission.findOne({
      where: {
        internal: "welfare.anonymous"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get welfare permission" });
  }

  if(permission === null) {
    return res.status(500).json({ error: "Permission not present" });
  }

  let swos;

  // need to email SWOs
  try {
    swos = await PermissionLink.findAll({
      where: {
        permissionId: permission.id
      },
      include: [{
        model: User,
        as: "grantedTo"
      }]
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Unable to get the SWOs" });
  }

  let thread;
  const userIdHash = hash({ username: user.id });

  try {
    thread = await WelfareThread.findOne({
      where: {
        id: threadId,
        userHash: userIdHash
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the thread" });
  }

  if(thread === null) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  let result;

  try {
    result = await WelfareThreadMessage.create({
      threadId,
      from: "user",
      content: message,
      viewedAt: null
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find messages" });
  }

  thread.lastUpdate = new Date();

  try {
    await thread.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the thread" });
  }

  let emailNotification = [];
  emailNotification.push("<p>A new message has been received on the anonymous messaging service.</p>");
  emailNotification.push(`<p>You can <a href="https://greyjcr.co.uk/welfare/message/admin/thread/${threadId}" target="_blank" rel="noopener noreferrer">view the thread by clicking here.</a></p>`);

  if(swos.length !== 0) {
    for(let person of swos) {
      const emailResult = await mailer.sendEmail(person.grantedTo.email, "New Anonymous Message", emailNotification.join(""));

      if(!emailResult) {
        mailer.sendEmail("grey.website@durham.ac.uk", "SWOS Email Send Failure", [`Failed to send to ${person.grantedTo.email}`], "editor@greyjcr.co.uk");
        console.log("Email send failure");
      }
    }
  }

  return res.status(200).json({ message: result });
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
      attributes: [ "id", "title", "createdAt", "lastUpdate"]
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

router.get("/threads/admin", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "welfare.anonymous")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let threads;

  try {
    threads = await WelfareThread.findAll({
      attributes: [ "id", "title", "createdAt", "lastUpdate" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find all threads" });
  }

  return res.status(200).json({ threads });
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

  let thread;

  try {
    thread = await WelfareThread.findOne({
      where: {
        id: threadId
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the thread" });
  }

  if(thread === null) {
    return res.status(400).json({ error: "No thread was found" });
  }

  let result;

  try {
    result = await WelfareThreadMessage.create({
      threadId,
      from: "welfare",
      content: message,
      viewedAt: null
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find messages" });
  }

  thread.lastUpdate = new Date();

  try {
    await thread.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the thread" });
  }

  if(thread.userEmail !== null) {
    let emailNotification = [];
    emailNotification.push("<p>A new reply has been received on the anonymous messaging service.</p>");
    emailNotification.push(`<p>You can <a href="https://greyjcr.co.uk/welfare/message/thread/${threadId}" target="_blank" rel="noopener noreferrer">view the thread by clicking here.</a></p>`);

    mailer.sendEmail(thread.userEmail, "Website Reply Received", emailNotification.join(""));
  }

  return res.status(200).json({ message: result });
});

router.post("/threads/delete/date", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "welfare.anonymous")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  console.log("In")
  const { deleteDate } = req.body;

  let candidateThreads;

  try {
    candidateThreads = await WelfareThread.findAll({
      where: {
        lastUpdate: {
          [Op.lte]: deleteDate
        }
      }
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to retrieve candidate threads" });
  }

  let deletedCount = 0;

  for(const thread of candidateThreads) {
    try {
      await WelfareThreadMessage.destroy({
        where: {
          threadId: thread.id
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to delete thread messages" });
    }

    try {
      await WelfareThread.destroy({
        where: {
          id: thread.id
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to delete thread" });
    }

    deletedCount++;
  }

  return res.status(200).json({ deletedCount });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
