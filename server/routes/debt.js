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
  // Create a new debt entry
  const { user } = req.session;

  // Check permissions
  if(!hasPermission(req.session, "debt.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { description, amount } = req.body;
  const tempUsername = req.body.username;

  if(tempUsername === undefined || tempUsername === null || tempUsername.length !== 6) {
    return res.status(400).json({ error: "username error" });
  }

  const username = tempUsername.toLowerCase();

  if(description === undefined || description === null || description.length === 0) {
    return res.status(400).json({ error: "description error" });
  }

  if(amount === undefined || amount === null || amount.length === 0) {
    return res.status(400).json({ error: "amount error" });
  }

  // Check for existing records

  let existingDebtRecord;

  try {
    existingDebtRecord = await Debt.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check for existing debt" });
  }

  if(existingDebtRecord !== null) {
    return res.status(400).json({ error: `${username} already has a debt. You can remove their existing debt and add anything additional on to it.` });
  }

  // Find the user if they have an account

  let debtUser = null;

  try {
    debtUser = await User.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check for the user" });
  }

  if(debtUser !== null) {
    // We have a user so need to add the permission
    let debtPermission;

    // Get the permission so we can have the ID of it
    try {
      debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
    } catch (error) {
      return;
    }

    // Shouldn't happen
    if(debtPermission === null) {
      return res.status(500).json({ error: "Unable to get the debt permission" });
    }

    // Create the permission link
    try {
      await PermissionLink.create({
        permissionId: debtPermission.id,
        grantedToId: debtUser.id,
        grantedById: user.id
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create the debt permission link" });
    }
  }

  let debtRecord;

  // Create the debt record
  try {
    debtRecord = await Debt.create({
      username, debt: amount, description
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the debt record" });
  }

  if(debtRecord === null) {
    return res.status(500).json({ error: "Unable to create the debt record, was null" });
  }

  // Construct the debt record in the same way as the fetch

  // Optional chaining operator would be nicer to use
  // but it complains of syntax errors at the time of writing :(
  // replace with email: debtUser?.email || null or similar
  const debtObj = {
    debtId: debtRecord.id,
    description,
    amount,
    username,
    email: debtUser ? debtUser.email : null,
    firstNames: debtUser ? debtUser.firstNames : null,
    surname: debtUser ? debtUser.surname : null
  };

  return res.status(200).json({ debt: debtObj });
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
