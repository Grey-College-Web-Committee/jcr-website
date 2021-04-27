// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, Permission, PermissionLink, Debt } = require("../database.models.js");
const axios = require("axios");
// An object consisting of emails and expiry dates
const prepaidMemberships = require("../prepaid_memberships.json");
const prepaidEmails = Object.keys(prepaidMemberships);

// Called when a POST request is to be served at /api/authentication/login
router.post("/login", async (req, res) => {
  // Get the username and password, verify they are both there
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

  if(username !== "nonmem") {
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

  // We will error if we do not receive a 200 status so we can assume we are validated from here
  // We have no need to store the password (or its hash) so can simply ignore it
  let user;

  try {
    // Only create a new entry if one doesn't exist
    user = await User.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ message: "Server error: Unable to find user. Database error." });
  }

  const lastLogin = new Date();

  if(user == null) {
    let details;

    try {
      details = await axios.get(`https://community.dur.ac.uk/grey.jcr/itsuserdetailsjson.php?username=${username}`);
    } catch (error) {
      return res.status(500).json({ message: "Unable to fetch details about this user from the university" });
    }

    const { current_staff, current_student } = details.data;
    
    if(current_staff === "1" && current_student === "0") {
      const { email, surname, firstnames, department } = details.data;

      if(!department.toLowerCase().startsWith("grey college")) {
        return res.status(403).json({ message: "Only staff at Grey College can access this website" });
      }

      try {
        // Create a new user record
        user = await User.create({ username, email, surname, firstNames: firstnames, year: 4, email, lastLogin, membershipExpiresAt: null });
      } catch (error) {
        return res.status(500).json({ message: "Server error: Unable to create a new staff user. Database error." });
      }
    } else {
      const { email, surname, firstnames, studyyear, college } = details.data;

      if(college.toLowerCase() !== "grey college") {
        return res.status(403).json({ message: "You must be a member of Grey College to access this website" });
      }

      try {
        // Create a new user record
        user = await User.create({ username, email, surname, firstNames: firstnames, year: studyyear, email, lastLogin, membershipExpiresAt: null });
      } catch (error) {
        return res.status(500).json({ message: "Server error: Unable to create a new user. Database error." });
      }
    }
  } else {
    // Set the last login time and save
    user.lastLogin = lastLogin;

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
  }

  const lookupEmail = user.dataValues.email.trim().toLowerCase();

  if(prepaidEmails.includes(lookupEmail) && user.membershipExpiresAt === null) {
    // They have a membership from before. Now grant it.

    const prepaidExpiryDate = new Date(prepaidMemberships[lookupEmail]);

    user.membershipExpiresAt = prepaidExpiryDate;

    try {
      await user.save();
    } catch (error) {
      return res.status(500).json({ error: "Unable to grant membership" });
    }

    let permissionRecord;

    try {
      permissionRecord = await Permission.findOne({
        where: {
          internal: "jcr.member"
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to find membership permission" });
    }

    if(permissionRecord === null) {
      return res.status(500).json({ error: "Unable to locate permission" });
    }

    try {
      await PermissionLink.create({
        grantedToId: user.id,
        permissionId: permissionRecord.id,
        grantedById: 1
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to link membership" });
    }
  }

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

router.post("/logout", async (req, res) => {
  if(req.session.user && req.cookies.user_sid) {
    req.session.destroy(() => {});
    return res.clearCookie("user_sid").status(200).json({ message: "Logged out" });
  }

  return res.status(200).json({ message: "User was not logged in" });
});

router.get("/verify", async (req, res) => {
  if(req.session.user && req.cookies.user_sid && req.session.permissions) {
    const { user, permissions } = req.session;
    return res.status(200).json({ user: { userId: user.id, username: user.username, permissions: permissions } });
  }

  return res.status(401).end();
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
