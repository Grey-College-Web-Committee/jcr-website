// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, WelfareThread, WelfareThreadMessage } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const hash = require("object-hash");

router.get("/threadIds", async (req, res) => {
  const { user } = req.session;
  const userIdHash = hash({ username: user.id });

  let threads;

  try {
    threads = await WelfareThread.findAll({
      where: {
        userHash: userIdHash
      },
      attributes: [ "id" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the welfare threads" });
  }

  return res.status(200).json({ threads });
});

router.get("/threadIds/admin", async (req, res) => {
  return res.status(200).json({ success: true });
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
    return res.status(500).json({ error: "Unable to create a new thread" });
  }

  return res.status(200).json({ threadId: thread.id });
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
