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
      }
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

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
