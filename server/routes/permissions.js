// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink } = require("../database.models.js");
const { Op } = require("sequelize");
const { hasPermission } = require("../utils/permissionUtils.js");

// Get the stock available
router.post("/search/", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "permissions.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const searchTerm = req.body.searchTerm;

  if(searchTerm == null) {
    return res.status(400).json({ message: "Missing searchTerm" });
  }

  let matching;

  // Just finds all the items and returns them
  try {
    matching = await User.findAll({
      where: {
        [Op.or]: [
          {
            username: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            firstNames: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            surname: {
              [Op.like]: `%${searchTerm}%`
            }
          }
        ]
      },
      limit: 10
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    return;
  }

  return res.status(200).json({ matching });
});

router.get("/search/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "permissions.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Gets a single item by its ID
  const id = req.params.id;
  const searchedUser = await User.findOne({ where: { id } });

  if(searchedUser === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const permissions = await PermissionLink.findAll({
    where: {
      grantedToId: id
    },
    include: [
      Permission,
      {
        model: User,
        as: "grantedBy",
        attributes: [ "id", "username", "firstNames", "surname" ]
      }
    ]
  });

  return res.status(200).json({ user: searchedUser, permissions });
});

router.get("/list", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "permissions.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const permissions = await Permission.findAll();

  return res.status(200).json({ permissions });
});

router.put("/revoke/:userId/:permissionId", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "permissions.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const userId = req.params.userId;
  const permissionId = req.params.permissionId;

  if(!userId || userId === null || userId === undefined) {
    return res.status(400).json({ error: "Missing userId" });
  }

  if(!permissionId || permissionId === null || permissionId === undefined) {
    return res.status(400).json({ error: "Missing permissionId" });
  }

  let success;

  try {
    success = await PermissionLink.destroy({
      where: {
        grantedToId: userId,
        permissionId
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error trying to revoke permission" });
  }

  if(success) {
    return res.status(204).end();
  }

  return res.status(400).json({ error: "Unable to revoke permission" });
});

router.put("/grant/:userId/:permissionId", async(req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "permissions.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const userId = req.params.userId;
  const permissionId = req.params.permissionId;

  if(!userId || userId === null || userId === undefined) {
    return res.status(400).json({ error: "Missing userId" });
  }

  if(!permissionId || permissionId === null || permissionId === undefined) {
    return res.status(400).json({ error: "Missing permissionId" });
  }

  // Check if it exists first
  let existing;

  try {
    existing = await PermissionLink.findAll({
      where: {
        permissionId,
        grantedToId: userId
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error checking if the permission exists" });
  }

  if(existing.length !== 0) {
    return res.status(400).json({ error: "User already has the specific permission "});
  }

  let success;

  try {
    success = await PermissionLink.create({
      permissionId,
      grantedToId: userId,
      grantedById: user.id
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error trying to grant permission" });
  }

  if(success) {
    return res.status(204).end();
  }

  return res.status(400).json({ error: "Unable to grant permission" });
});

router.get("/single/:userId/:permissionId", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "permissions.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const userId = req.params.userId;
  const permissionId = req.params.permissionId;

  if(!userId || userId === null || userId === undefined) {
    return res.status(400).json({ error: "Missing userId" });
  }

  if(!permissionId || permissionId === null || permissionId === undefined) {
    return res.status(400).json({ error: "Missing permissionId" });
  }

  // Check if it exists
  let existing;

  try {
    existing = await PermissionLink.findAll({
      where: {
        permissionId,
        grantedToId: userId
      },
      include: [
        Permission,
        {
          model: User,
          as: "grantedBy",
          attributes: [ "id", "username", "firstNames", "surname" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error checking if the permission exists" });
  }

  const granted = existing.length != 0;
  const grantedDetails = granted ? existing[0] : null;

  return res.status(200).json({ hasPermission: granted, grantedDetails });
});

router.get("/userswith/:permissionId", async (req, res) => {
  // Admin only
  const { user } = req.session;
  const permissionId = req.params.permissionId;

  if(!permissionId || permissionId === null || permissionId === undefined) {
    return res.status(400).json({ error: "Missing permissionId" });
  }

  if(!hasPermission(req.session, permissionId)) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Check if it exists
  let existing;

  try {
    existing = await PermissionLink.findAll({
      where: {
        permissionId
      },
      include: [
        Permission,
        {
          model: User,
          as: "grantedTo",
          attributes: [ "id", "username", "firstNames", "surname" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error checking if the permission exists" });
  }

  const granted = existing.length != 0;
  const grantedDetails = granted ? existing[0] : null;

  return res.status(200).json({ hasPermission: granted, grantedDetails });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
