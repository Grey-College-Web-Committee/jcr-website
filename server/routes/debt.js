// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Debt, sequelize } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.get("/", async (req, res) => {
  // Loads a user's debt
  const { user } = req.session;

  let debt;

  // Try and find the debt
  try {
    debt = await Debt.findOne({ where: { username: user.username.toLowerCase() }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to load the debt record" });
  }

  // If we didn't get a record then they don't have debt
  if(debt === null) {
    return res.status(200).json({
      hasDebt: false
    });
  }

  // Return the debt
  return res.status(200).json({
    hasDebt: true,
    debt
  });
});

router.get("/all", async (req, res) => {
  // Get all of the debt
  const { user } = req.session;

  // Check permissions
  if(!hasPermission(req.session, "debt.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let debts;

  // As Debt was ported over later and people with debt won't necessarily have signed up to the website
  // we don't have an association between users and the debt, instead we do it off usernames
  // however, usernames are a text field... so we can't even have an association
  // Hence we have to use a raw query for this and a left outer join
  // should work fine, just not as elegant as sequelize
  try {
    debts = await sequelize.query(`SELECT debt.id as debtId, debt.description as description, debt.debt as amount, debt.username as username, user.email as email, user.firstNames as firstNames, user.surname as surname FROM Debts AS debt LEFT OUTER JOIN Users AS user ON user.username = debt.username`, { type: sequelize.QueryTypes.SELECT })
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the debt from the database" });
  }

  return res.status(200).json({ debts });

})

router.post("/", async (req, res) => {

});

router.delete("/:id", async (req, res) => {
  // Deletes a single debt record
  const { user } = req.session;

  // Check permissions
  if(!hasPermission(req.session, "debt.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const id = req.params.id;

  // Validate the id briefly
  if(!id || id === null || id === undefined) {
    return res.status(400).json({ error: "Missing id" });
  }

  let debtRecord;

  // Find the entry
  try {
    debtRecord = await Debt.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the debt record" });
  }

  if(debtRecord === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const { username } = debtRecord;

  let debtUser;

  // Get the user record if it exists that is associated with this
  try {
    debtUser = await User.findOne({ where: { username }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the debt user" });
  }

  if(debtUser !== null) {
    // If there is a user then fix their debt status
    let debtPermission;

    // Get the permission so we can have the ID of it
    try {
      debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
    } catch (error) {
      return;
    }

    if(debtPermission === null) {
      return res.status(500).json({ error: "Unable to get the debt permission" });
    }

    // Remove the permission link
    try {
      await PermissionLink.destroy({
        where: {
          permissionId: debtPermission.id,
          grantedToId: debtUser.id
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the debt permission link" });
    }
  }

  // Finally delete the debt record
  try {
    await debtRecord.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the debt record" });
  }

  return res.status(204).end();
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
