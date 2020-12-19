// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, GymMembership, ShopOrder } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.get("/active", async (req, res) => {
  const { user } = req.session;

  // Check if they have an existing membership
  let existingMemberships;

  try {
    existingMemberships = await GymMembership.findAll({
      include: [
        {
          model: User,
          where: {
            id: user.id
          },
          required: true
        },
        {
          model: ShopOrder,
          where: {
            paid: true
          },
          required: true
        }
      ]
    });
  } catch (error) {
    console.log({error});
    return {
      errorOccurred: true,
      status: 500,
      error: "Unable to check existing memberships"
    };
  }

  if(existingMemberships.length !== 0) {
    const currentDate = new Date();
    const unexpiredMemberships = existingMemberships.filter(membership => membership.expiresAt > currentDate);

    if(unexpiredMemberships.length !== 0) {
      return res.status(200).json({
        membership: unexpiredMemberships[0]
      });
    }
  }

  return res.status(200).json({ membership: null });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
