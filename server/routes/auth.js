/**
* This file handles everything related to the authentication of users
**/

// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, Permission, PermissionLink, Debt, PendingUserApplication } = require("../database.models.js");
const axios = require("axios");
// An object consisting of emails and expiry dates
const prepaidMemberships = require("../prepaid_memberships.json");
const prepaidEmails = Object.keys(prepaidMemberships);
const mailer = require("../utils/mailer");
const { hasPermission } = require("../utils/permissionUtils.js");
const argon2 = require("argon2");

// Called when a POST request is to be served at /api/authentication/login
router.post("/login", async (req, res) => {
  // Get the username and password, verify they are both there
  let username = req.body.username;
  const password = req.body.password;

  if(username === undefined || username === null || typeof username !== "string") {
    return res.status(400).json({ message: "Missing username" });
  }

  username = username.toLowerCase();

  let user;

  try {
    // Only create a new entry if one doesn't exist
    user = await User.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ message: "Server error: Unable to find user. Database error." });
  }

  if(user === null) {
    return res.status(401).json({ message: "You must register for an account first", requiresRegister: true });
  }

  if(password === undefined || password === null || typeof password !== "string") {
    return res.status(400).json({ message: "Missing password" });
  }

  // To validate a Durham account with CIS we need to query a specific page
  // https://www.dur.ac.uk/its/password/validator
  // Providing headers 'Authorization' = 'Basic {{base64 encoded string 'username:password'}}'


  if(user.password !== null) {
    const correctPassword = await argon2.verify(user.password, password);

    if(!correctPassword) {
      return res.status(401).json({ message: "Incorrect username or password" });
    }
  } else {
    if(username !== "nonmem" && username !== "test11" && username !== "test22" && username !== "test33") {// && username !== "test11" && username !== "test22" && username !== "test33") {
      const details = Buffer.from(`${username}:${password}`);
      const b64data = details.toString("base64");
      const authHeader = `Basic ${b64data}`;

      try {
        // Query the validator and wait for its response.
        // If we get a non 2XX code it will error and proceed to the catch.
        await axios.get("https://www.dur.ac.uk/its/password/validator", {
          headers: {
            Authorization: authHeader
          }
        });
      } catch (error) {
        // Details were incorrect or maybe a server error
        const status = error.response.status;

        if(status === 401) {
          return res.status(401).json({ message: "Incorrect username or password" });
        }

        return res.status(status).json({ message: "Validation error" });
      }
    } else {
      if(password !== process.env.NON_MEMBER_PASSWORD) {
        return res.status(401).json({ message: "Incorrect username or password" });
      }
    }
  }

  // We will error if we do not receive a 200 status so we can assume we are validated from here
  // We have no need to store the password (or its hash) so can simply ignore it

  // Set the last login time and save
  const upgradeDate = new Date("2021-09-05 16:00:00Z");
  const now = new Date();

  // Promote their year group
  if(new Date(user.lastLogin) < upgradeDate) {
    const { year } = user;

    if(year !== 4 && year !== "4") {
      user.year = Number(year) + 1;
    }
  }

  user.lastLogin = now;

  const { membershipExpiresAt } = user;

  // Their JCR membership has expired
  if(membershipExpiresAt !== null) {
    const membershipExpiresAtDate = new Date(membershipExpiresAt);

    if(membershipExpiresAtDate < new Date()) {
      user.membershipExpiresAt = null;

      // Now remove the permission
      let permissionRecord;

      try {
        permissionRecord = await Permission.findOne({
          where: {
            internal: "jcr.member"
          }
        });
      } catch (error) {
        console.log({error});
        return res.status(500).json({ message: "Server error: Unable to find permission record" });
      }

      if(permissionRecord === null) {
        console.log("NULL PR");
        return res.status(500).json({ message: "Server error: Missing permission record" });
      }

      try {
        await PermissionLink.destroy({
          where: {
            grantedToId: user.id,
            permissionId: permissionRecord.id
          }
        });
      } catch (error) {
        console.log({error});
        return res.status(500).json({ message: "Server error: Unable to delete membership." });
      }
    }
  }

  try {
    await user.save();
  } catch (error) {
    return res.status(500).json({ message: "Server error: Unable to update last login. Database error." });
  }

  const lookupEmail = user.dataValues.email.trim().toLowerCase();

  // if(prepaidEmails.includes(lookupEmail) && user.membershipExpiresAt === null) {
  //   // They have a membership from before. Now grant it.
  //
  //   const prepaidExpiryDate = new Date(prepaidMemberships[lookupEmail]);
  //
  //   user.membershipExpiresAt = prepaidExpiryDate;
  //
  //   try {
  //     await user.save();
  //   } catch (error) {
  //     return res.status(500).json({ error: "Unable to grant membership" });
  //   }
  //
  //   let permissionRecord;
  //
  //   try {
  //     permissionRecord = await Permission.findOne({
  //       where: {
  //         internal: "jcr.member"
  //       }
  //     });
  //   } catch (error) {
  //     return res.status(500).json({ error: "Unable to find membership permission" });
  //   }
  //
  //   if(permissionRecord === null) {
  //     return res.status(500).json({ error: "Unable to locate permission" });
  //   }
  //
  //   try {
  //     await PermissionLink.create({
  //       grantedToId: user.id,
  //       permissionId: permissionRecord.id,
  //       grantedById: 1
  //     });
  //   } catch (error) {
  //     return res.status(500).json({ error: "Unable to link membership" });
  //   }
  // }

  let debtRecord;

  try {
    debtRecord = await Debt.findOne({ where: { username: user.username }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the debt status" });
  }

  if(debtRecord !== null) {
    let debtPermission;

    try {
      debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the debt permission" });
    }

    if(debtPermission === null) {
      return res.status(500).json({ error: "Unable to get the debt permission, was null" });
    }

    try {
      await PermissionLink.findOrCreate({
        where: {
          permissionId: debtPermission.id,
          grantedToId: user.id
        },
        defaults: {
          permissionId: debtPermission.id,
          grantedToId: user.id,
          grantedById: 1
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to set the debt permission" });
    }
  }

  // Credentials must have been accepted or axios would have errored
  // Now assign data for their session
  req.session.user = user.dataValues;

  // Now we get their permissions, this will be session only rather than returned

  let permissions;

  permissions = await PermissionLink.findAll({
    where: {
      grantedToId: user.dataValues.id
    },
    include: [ Permission ]
  });

  let internalPermissionStrings = [];

  if(permissions.length !== 0) {
    permissions.forEach(permission => {
      internalPermissionStrings.push(permission.Permission.internal.toLowerCase());
    });
  }

  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  const displayName = `${firstName} ${lastName}`

  req.session.permissions = internalPermissionStrings;

  const date = new Date();
  date.setTime(date.getTime() + (3 * 60 * 60 * 1000));

  res.status(200).json({ user: { username: user.username, permissions: internalPermissionStrings, expires: date, email: user.email, hlm: user.hlm, firstNames: user.firstNames, surname: user.surname, displayName }, message: "Successfully authenticated" });
});

// Called when a user logs out
router.post("/logout", async (req, res) => {
  // Deletes their session on the server side and removes the cookie
  if(req.session.user && req.cookies.user_sid) {
    req.session.destroy(() => {});
    return res.clearCookie("user_sid").status(200).json({ message: "Logged out" });
  }

  return res.status(200).json({ message: "User was not logged in" });
});

// Called to get basic information about the logged in user
router.get("/verify", async (req, res) => {
  // Retrieves their permissions and basic information
  if(req.session.user && req.cookies.user_sid && req.session.permissions) {
    const { user, permissions } = req.session;
    return res.status(200).json({ user: { userId: user.id, username: user.username, permissions: permissions } });
  }

  // User isn't logged in in this case
  return res.status(401).end();
})

// Validates CIS credentials with the University's data
router.post("/validate", async (req, res) => {
  let username = req.body.username;
  const password = req.body.password;

  if(username === undefined || username === null || typeof username !== "string") {
    return res.status(400).json({ message: "Missing username" });
  }

  username = username.toLowerCase();

  if(password === undefined || password === null || typeof password !== "string") {
    return res.status(400).json({ message: "Missing password" });
  }

  // To validate a Durham account with CIS we need to query a specific page
  // https://www.dur.ac.uk/its/password/validator
  // Providing headers 'Authorization' = 'Basic {{base64 encoded string 'username:password'}}'

  if(username !== "nonmem") {// && username !== "test11" && username !== "test22" && username !== "test33") {
    const details = Buffer.from(`${username}:${password}`);
    const b64data = details.toString("base64");
    const authHeader = `Basic ${b64data}`;

    try {
      // Query the validator and wait for its response.
      // If we get a non 2XX code it will error and proceed to the catch.
      await axios.get("https://www.dur.ac.uk/its/password/validator", {
        headers: {
          Authorization: authHeader
        }
      });
    } catch (error) {
      // Details were incorrect or maybe a server error
      const status = error.response.status;

      if(status === 401) {
        return res.status(401).json({ stage: "invalid_details", message: "Incorrect username or password" });
      }

      return res.status(status).json({ stage: "invalid_details", message: "Validation error" });
    }
  } else {
    if(password !== process.env.NON_MEMBER_PASSWORD) {
      return res.status(401).json({ stage: "invalid_details", message: "Incorrect username or password" });
    }
  }

  // Now we know the details are correct, check that they don't already have a user account
  let userRecord;

  try {
    userRecord = await User.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ stage: "server_error", message: "Server error" });
  }

  if(userRecord !== null) {
    return res.status(400).json({ stage: "already_have_account", message: "User already has an active account", date: userRecord.createdAt });
  }

  // Then check they don't have a pending application
  let pendingApplication;

  try {
    pendingApplication = await PendingUserApplication.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ stage: "server_error", message: "Server error" });
  }

  if(pendingApplication !== null) {
    return res.status(400).json({ stage: "awaiting_approval", message: "User has already submitted application", date: pendingApplication.createdAt });
  }

  return res.status(200).json({ stage: "provide_details", message: "User verified" });
})

// Submits an application to register for the website
router.post("/register", async (req, res) => {
  let username = req.body.username;
  const password = req.body.password;

  if(username === undefined || username === null || typeof username !== "string") {
    return res.status(400).json({ message: "Missing username" });
  }

  username = username.toLowerCase();

  if(password === undefined || password === null || typeof password !== "string") {
    return res.status(400).json({ message: "Missing password" });
  }

  // To validate a Durham account with CIS we need to query a specific page
  // https://www.dur.ac.uk/its/password/validator
  // Providing headers 'Authorization' = 'Basic {{base64 encoded string 'username:password'}}'

  if(username !== "nonmem") {// && username !== "test11" && username !== "test22" && username !== "test33") {
    const details = Buffer.from(`${username}:${password}`);
    const b64data = details.toString("base64");
    const authHeader = `Basic ${b64data}`;

    try {
      // Query the validator and wait for its response.
      // If we get a non 2XX code it will error and proceed to the catch.
      await axios.get("https://www.dur.ac.uk/its/password/validator", {
        headers: {
          Authorization: authHeader
        }
      });
    } catch (error) {
      // Details were incorrect or maybe a server error
      const status = error.response.status;

      if(status === 401) {
        return res.status(401).json({ stage: "invalid_details", message: "Incorrect username or password" });
      }

      return res.status(status).json({ stage: "invalid_details", message: "Validation error" });
    }
  } else {
    if(password !== process.env.NON_MEMBER_PASSWORD) {
      return res.status(401).json({ stage: "invalid_details", message: "Incorrect username or password" });
    }
  }

  // Now we know the details are correct, check that they don't already have a user account
  let userRecord;

  try {
    userRecord = await User.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ stage: "server_error", message: "Server error" });
  }

  if(userRecord !== null) {
    return res.status(400).json({ stage: "already_have_account", message: "User already has an active account", date: userRecord.createdAt });
  }

  // Then check they don't have a pending application
  let pendingApplication;

  try {
    pendingApplication = await PendingUserApplication.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ stage: "server_error", message: "Server error" });
  }

  if(pendingApplication !== null) {
    return res.status(400).json({ stage: "awaiting_approval", message: "User has already submitted application", date: pendingApplication.createdAt });
  }

  // Now create the pending application

  const { firstName, surname, year } = req.body;

  try {
    pendingApplication = await PendingUserApplication.create({
      username, firstName, surname, year
    });
  } catch (error) {
    return res.status(500).json({ stage: "server_error", message: "Server error creating application" });
  }

  // Was getting spammed by new applications
  // mailer.sendEmail("grey.website@durham.ac.uk", `New Account Application`, "A new application for a user account has been received on the Grey JCR website.");

  return res.status(200).json({ stage: "awaiting_verification", message: "Application logged" });
});

// Gets the pending applications
router.get("/pending", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "users.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let pendingApplications;

  try {
    pendingApplications = await PendingUserApplication.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the pending applications" });
  }

  return res.status(200).json({ applications: pendingApplications });
});

const prepareDeniedEmail = (username) => {
  return [
    `<p>Hello ${username},</p>`,
    "<p>Your application for membership to the Grey JCR website has been denied.</p>",
    "<p>For more information, please contact grey.website@durham.ac.uk.</p>",
    "<p>Please do not respond to this email as this email is not monitored and emails to this address are automatically deleted.</p>",
    "<p>Thank you.</p>"
  ].join("");
}

const prepareApprovedEmail = (username) => {
  return [
    `<p>Hello ${username},</p>`,
    "<p>Your application for membership to the Grey JCR website has been approved.</p>",
    "<p>You can now login to the website.</p>",
    "<p>If you have already purchased a JCR membership this will be added to your account in the coming weeks.</p>",
    "<p>Thank you.</p>"
  ].join("");
}

router.post("/action", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "users.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, approved } = req.body;

  if(!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  let application;

  try {
    application = await PendingUserApplication.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the application" });
  }

  if(application === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  // Denied applications send an email and remove the application
  if(!approved) {
    const username = application.username;

    try {
      await application.destroy();
    } catch (error) {
      return res.status(500).json({ error: "Unable to delete application" });
    }

    mailer.sendEmail(`${username}@durham.ac.uk`, "Registration Denied", prepareDeniedEmail(username));
    return res.status(204).end();
  }

  let user;

  // For approved applications create the user record
  try {
    // Create a new user record
    user = await User.create({
      username: application.username,
      email: `${application.username}@durham.ac.uk`,
      surname: application.surname,
      firstNames: application.firstName,
      year: application.year,
      lastLogin: new Date(),
      membershipExpiresAt: null
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error: Unable to create a new user. Database error." });
  }

  // Now we check for their debt record
  let debtRecord;

  try {
    debtRecord = await Debt.findOne({ where: { username: user.username }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the debt status" });
  }

  if(debtRecord !== null) {
    let debtPermission;

    try {
      debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the debt permission" });
    }

    if(debtPermission === null) {
      return res.status(500).json({ error: "Unable to get the debt permission, was null" });
    }

    try {
      await PermissionLink.findOrCreate({
        where: {
          permissionId: debtPermission.id,
          grantedToId: user.id
        },
        defaults: {
          permissionId: debtPermission.id,
          grantedToId: user.id,
          grantedById: 1
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to set the debt permission" });
    }
  }

  // Remove the application
  try {
    await application.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete application" });
  }

  // All done so send them an email
  mailer.sendEmail(user.email, "Registration Approved", prepareApprovedEmail(user.username));
  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
