/**
* This file handles everything related to the authentication of users
**/

// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, Permission, PermissionLink, Debt, PendingUserApplication, PendingPassword } = require("../database.models.js");
const axios = require("axios");
// An object consisting of emails and expiry dates
const prepaidMemberships = require("../prepaid_memberships.json");
const prepaidEmails = Object.keys(prepaidMemberships);
const mailer = require("../utils/mailer");
const { hasPermission } = require("../utils/permissionUtils.js");
const argon2 = require("argon2");
const { v4: uuidv4 } = require("uuid");
const { idp, sp } = require("../utils/saml");

router.get('/sso', (req, res) => {
  if (idp) {
    let { context } = sp.createLoginRequest(idp, 'redirect');
    const { ref, hint } = req.query
    if (hint) {
      context += "&login_hint=" + hint
    }
    if (ref) {
      context += "&RelayState=" + ref
    }
    return res.redirect(context);
  } else {
    return res.redirect("/accounts/login")
  }
})

router.post('/acs', async (req, res) => {
  try {
    const ref = req.body['RelayState']
    const parseResult = await sp.parseLoginResponse(idp, 'post', req);
    if (parseResult && parseResult.extract && parseResult.extract.attributes && parseResult.extract.attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"]) {
      const username = parseResult.extract.attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"].replace("@durham.ac.uk", "").toLowerCase();

      let user;

      try {
        // Only create a new entry if one doesn't exist
        user = await User.findOne({ where: { username } });
      } catch (error) {
        return res.status(500).json({ message: "Server error: Unable to find user. Database error." });
      }

      if (user === null) {
        if (parseResult.extract.attributes.department == "Grey College") {
          // User is confirmed Grey, proceed to provision account

          try {
            // Create a new user record
            let firstNames = parseResult.extract.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']
            let surname = parseResult.extract.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']

            user = await User.create({
              username: username,
              email: `${username}@durham.ac.uk`,
              surname,
              firstNames,
              year: 1,
              lastLogin: new Date(),
              membershipExpiresAt: null,
              confirmedDetails: true
            });
          } catch (error) {
            return res.status(500).json({ message: "Server error: Unable to create a new user. Database error." });
          }

          mailer.sendEmail(user.email, `Grey JCR Website Account`, "You have successfully created an account with the JCR. If you are not a first year, please contact grey.website@durham.ac.uk to get your year updated.");

          // Now we check for their debt record
          let debtRecord;

          try {
            debtRecord = await Debt.findOne({ where: { username: user.username } });
          } catch (error) {
            return res.status(500).json({ error: "Unable to check the debt status" });
          }

          if (debtRecord !== null) {
            let debtPermission;

            try {
              debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
            } catch (error) {
              return res.status(500).json({ error: "Unable to get the debt permission" });
            }

            if (debtPermission === null) {
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
        } else {
          // Need to manually approve user

          // Then check they don't have a pending application
          let pendingApplication;

          try {
            pendingApplication = await PendingUserApplication.findOne({ where: { username } });
          } catch (error) {
            return res.status(500).json({ stage: "server_error", message: "Server error" });
          }

          if (pendingApplication !== null) {
            // Already waiting for approval
            return res.redirect('/accounts/register');
          }

          // Now create the pending application

          try {
            let firstName = parseResult.extract.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']
            let surname = parseResult.extract.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']

            pendingApplication = await PendingUserApplication.create({
              username, firstName, surname, year: 1
            });
          } catch (error) {
            return res.status(500).json({ stage: "server_error", message: "Server error creating application" });
          }

          mailer.sendEmail("grey.website@durham.ac.uk", `New Account Application`, "A new application for a user account has been received on the Grey JCR website.", "editor@greyjcr.co.uk");

          return res.redirect('/accounts/register');
        }
      }

      const now = new Date();
      user.lastLogin = now;

      const { membershipExpiresAt } = user;

      // Their JCR membership has expired
      if (membershipExpiresAt !== null) {
        const membershipExpiresAtDate = new Date(membershipExpiresAt);

        if (membershipExpiresAtDate < new Date()) {
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
            console.log({ error });
            return res.status(500).json({ message: "Server error: Unable to find permission record" });
          }

          if (permissionRecord === null) {
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
            console.log({ error });
            return res.status(500).json({ message: "Server error: Unable to delete membership." });
          }
        }
      }

      try {
        let namedEmail = parseResult.extract.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
        user.namedEmail = namedEmail
        await user.save();
      } catch (error) {
        return res.status(500).json({ message: "Server error: Unable to update last login. Database error." });
      }

      let debtRecord;

      try {
        debtRecord = await Debt.findOne({ where: { username: user.username } });
      } catch (error) {
        return res.status(500).json({ error: "Unable to check the debt status" });
      }

      if (debtRecord !== null) {
        let debtPermission;

        try {
          debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
        } catch (error) {
          return res.status(500).json({ error: "Unable to get the debt permission" });
        }

        if (debtPermission === null) {
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
        include: [Permission]
      });

      let internalPermissionStrings = [];

      if (permissions.length !== 0) {
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

      req.session.logindetails = { username: user.username, permissions: internalPermissionStrings, expires: date, email: user.email, hlm: user.hlm, firstNames: user.firstNames, surname: user.surname, displayName, confirmedDetails: user.confirmedDetails };

      let redirect = '/accounts/login?success=true'
      if (ref) {
        redirect += "&ref=" + ref
      }
      return res.redirect(redirect);
    } else {
      return res.status(401).json({ error: "SSO response did not contain username" });
    }
  } catch {
    return res.status(500).json({ error: "SSO failed" });
  }
});

/*router.post("/verifypassword", async (req, res) => {
  const { token } = req.body;

  if(!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  let application;

  try {
    application = await PendingPassword.findOne({ where: { verificationToken: token } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to search by token" });
  }

  try {
    userRecord = await User.findOne({ where: { username: application.username } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch the user record" });
  }

  if(!application) {
    return res.status(400).json({ error: "Invalid token" });
  }

  if(application.verified) {
    return res.status(204).end();
  }

  application.verified = true;
  userRecord.password = application.password;

  try {
    await userRecord.save();
    await application.save();
    await application.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save" });
  }

  return res.status(204).end();
});

router.post("/setpassword", async (req, res) => {
  const { username: rawUsername, password: rawPassword } = req.body;

  if(!rawUsername || rawUsername.trim().length !== 6) {
    return res.status(400).json({ error: "Missing username" });
  }

  if(!rawPassword || rawPassword.trim().length < 8) {
    return res.status(400).json({ error: "Missing password" });
  }

  const username = rawUsername.trim();
  const password = rawPassword.trim();

  // Check if they had an account, their account is not linked, and they don't have a pending application
  let existingUser;

  try {
    existingUser = await User.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ error: "Error checking user status" });
  }

  if(!existingUser) {
    return res.status(400).json({ error: `An account for ${username} has never existed` });
  }

  if(existingUser.password !== null) {
    return res.status(400).json({ error: "You already have a password set" });
  }

  let pendingApplicaton;

  try {
    pendingApplicaton = await PendingPassword.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check for pending applications" });
  }

  if(pendingApplicaton) {
    return res.status(400).json({ error: `A pending verification already exists for ${username} (check your email)` });
  }

  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const verificationToken = uuidv4();

  try {
    await PendingPassword.create({ username, password: hash, verificationToken });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create new application" });
  }

  let firstName = existingUser.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = existingUser.surname.charAt(0).toUpperCase() + existingUser.surname.substr(1).toLowerCase();

  const verifyUrl = `${process.env.WEB_ADDRESS}accounts/verifypassword/${verificationToken}`;

  // Send the verification email
  mailer.sendEmail(existingUser.email, `Verify JCR Account`, [
    `<p>Hello ${firstName},</p>`,
    `<p>Please <a href="${verifyUrl}" rel="noopener noreferrer">click here</a> to verify your Grey JCR account and activate your new password.</p>`,
    `<p>Alternatively copy and paste the following URL into the address bar of your web browser: ${verifyUrl}</p>`,
    `<p>If you did not attempt to set a password for this account please contact grey.website@durham.ac.uk immediately</p>`,
    `<p>Thank you</p>`
  ].join(""));

  return res.status(204).end();
});*/

// Called when a POST request is to be served at /api/auth/login
router.post("/login", async (req, res) => {
  // Get the username and password, verify they are both there
  let username = req.body.username;
  const password = req.body.password;

  if (username === undefined || username === null || typeof username !== "string") {
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

  if (user === null) {
    return res.status(401).json({ message: "You must register for an account first", requiresRegister: true });
  }

  if (password === undefined || password === null || typeof password !== "string") {
    return res.status(400).json({ message: "Missing password" });
  }

  if (user.password !== null) {
    const correctPassword = await argon2.verify(user.password, password);

    if (!correctPassword) {
      return res.status(401).json({ message: "Incorrect username or password" });
    }
  } else {
    if (username !== "nonmem" && username !== "test11" && username !== "test22" && username !== "test33") {
      return res.status(401).json({ message: "User is not an alumnus" });
    } else {
      if (password !== process.env.NON_MEMBER_PASSWORD) {
        return res.status(401).json({ message: "Incorrect username or password" });
      }
    }
  }

  // We will error if we do not receive a 200 status so we can assume we are validated from here
  // We have no need to store the password (or its hash) so can simply ignore it

  // This is replaced with the user manually confirming the details
  // Set the last login time and save
  // const upgradeDate = new Date("2022-09-05 16:00:00Z");
  const now = new Date();

  // // Promote their year group
  // if(new Date(user.lastLogin) < upgradeDate) {
  //   const { year } = user;

  //   if(year !== 4 && year !== "4") {
  //     user.year = Number(year) + 1;
  //   }
  // }

  user.lastLogin = now;

  const { membershipExpiresAt } = user;

  // Their JCR membership has expired
  if (membershipExpiresAt !== null) {
    const membershipExpiresAtDate = new Date(membershipExpiresAt);

    if (membershipExpiresAtDate < new Date()) {
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
        console.log({ error });
        return res.status(500).json({ message: "Server error: Unable to find permission record" });
      }

      if (permissionRecord === null) {
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
        console.log({ error });
        return res.status(500).json({ message: "Server error: Unable to delete membership." });
      }
    }
  }

  try {
    await user.save();
  } catch (error) {
    return res.status(500).json({ message: "Server error: Unable to update last login. Database error." });
  }

  let debtRecord;

  try {
    debtRecord = await Debt.findOne({ where: { username: user.username } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the debt status" });
  }

  if (debtRecord !== null) {
    let debtPermission;

    try {
      debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the debt permission" });
    }

    if (debtPermission === null) {
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
    include: [Permission]
  });

  let internalPermissionStrings = [];

  if (permissions.length !== 0) {
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

  return res.status(200).json({ user: { username: user.username, permissions: internalPermissionStrings, expires: date, email: user.email, hlm: user.hlm, firstNames: user.firstNames, surname: user.surname, displayName, confirmedDetails: user.confirmedDetails }, message: "Successfully authenticated" });
});

// Called when a user logs out
router.post("/logout", async (req, res) => {
  // Deletes their session on the server side and removes the cookie
  if (req.session.user && req.cookies.user_sid) {
    req.session.destroy(() => { });
    return res.clearCookie("user_sid").status(200).json({ message: "Logged out" });
  }

  return res.status(200).json({ message: "User was not logged in" });
});

// Called to get basic information about the logged in user
router.get("/verify", async (req, res) => {
  // Retrieves their permissions and basic information
  if (req.session.user && req.cookies.user_sid && req.session.permissions) {
    const { user, permissions } = req.session;
    return res.status(200).json({ user: { userId: user.id, username: user.username, permissions: permissions } });
  }

  // User isn't logged in in this case
  return res.status(401).end();
})

// Called to get detailed information about the logged in user post SSO
router.get("/fullverify", async (req, res) => {
  if (req.session.logindetails) {
    const user = req.session.logindetails;
    req.session.logindetails = undefined;
    return res.status(200).json({ user });
  }

  // User isn't logged in in this case
  return res.status(401).end();
})

// Validates CIS credentials with the University's data
/*router.post("/validate", async (req, res) => {
  let username = req.body.username;
  const password = req.body.password;

  if (username === undefined || username === null || typeof username !== "string") {
    return res.status(400).json({ message: "Missing username" });
  }

  username = username.toLowerCase();

  if (password === undefined || password === null || typeof password !== "string") {
    return res.status(400).json({ message: "Missing password" });
  }

  // To validate a Durham account with CIS we need to query a specific page
  // https://www.dur.ac.uk/directory/password/validator
  // Providing headers 'Authorization' = 'Basic {{base64 encoded string 'username:password'}}'

  if (username !== "nonmem") {// && username !== "test11" && username !== "test22" && username !== "test33") {
    console.log("normal flow")
    const details = Buffer.from(`${username}:${password}`);
    const b64data = details.toString("base64");
    const authHeader = `Basic ${b64data}`;

    try {
      // Query the validator and wait for its response.
      // If we get a non 2XX code it will error and proceed to the catch.
      await axios.get("https://www.dur.ac.uk/directory/password/validator", {
        headers: {
          Authorization: authHeader
        }
      });
    } catch (error) {
      // Details were incorrect or maybe a server error
      const status = error.response.status;

      if (status === 401) {
        return res.status(401).json({ stage: "invalid_details", message: "Incorrect username or password" });
      }

      if (status !== 404) {
        return res.status(status).json({ stage: "invalid_details", message: "Validation error" });
      }
    }
  } else {
    if (password !== process.env.NON_MEMBER_PASSWORD) {
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

  if (userRecord !== null) {
    return res.status(400).json({ stage: "already_have_account", message: "User already has an active account", date: userRecord.createdAt });
  }

  // Then check they don't have a pending application
  let pendingApplication;

  try {
    pendingApplication = await PendingUserApplication.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ stage: "server_error", message: "Server error" });
  }

  if (pendingApplication !== null) {
    return res.status(400).json({ stage: "awaiting_approval", message: "User has already submitted application", date: pendingApplication.createdAt });
  }

  return res.status(200).json({ stage: "provide_details", message: "User verified" });
})


// Submits an application to register for the website
router.post("/register", async (req, res) => {
  let username = req.body.username;
  const password = req.body.password;

  if (username === undefined || username === null || typeof username !== "string") {
    return res.status(400).json({ message: "Missing username" });
  }

  username = username.toLowerCase();

  if (password === undefined || password === null || typeof password !== "string") {
    return res.status(400).json({ message: "Missing password" });
  }

  // To validate a Durham account with CIS we need to query a specific page
  // https://www.dur.ac.uk/directory/password/validator
  // Providing headers 'Authorization' = 'Basic {{base64 encoded string 'username:password'}}'

  if (username !== "nonmem") {// && username !== "test11" && username !== "test22" && username !== "test33") {
    const details = Buffer.from(`${username}:${password}`);
    const b64data = details.toString("base64");
    const authHeader = `Basic ${b64data}`;

    try {
      // Query the validator and wait for its response.
      // If we get a non 2XX code it will error and proceed to the catch.
      await axios.get("https://www.dur.ac.uk/directory/password/validator", {
        headers: {
          Authorization: authHeader
        }
      });
    } catch (error) {
      // Details were incorrect or maybe a server error
      const status = error.response.status;

      if (status === 401) {
        return res.status(401).json({ stage: "invalid_details", message: "Incorrect username or password" });
      }

      if (status !== 404) {
        return res.status(status).json({ stage: "invalid_details", message: "Validation error" });
      }
    }
  } else {
    if (password !== process.env.NON_MEMBER_PASSWORD) {
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

  if (userRecord !== null) {
    return res.status(400).json({ stage: "already_have_account", message: "User already has an active account", date: userRecord.createdAt });
  }

  // Then check they don't have a pending application
  let pendingApplication;

  try {
    pendingApplication = await PendingUserApplication.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ stage: "server_error", message: "Server error" });
  }

  if (pendingApplication !== null) {
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
});*/

// Gets the pending applications
router.get("/pending", async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if (!hasPermission(req.session, "users.manage")) {
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
    "<p>All new accounts are set as first year by default. If you are not a first year, please contact grey.website@durham.ac.uk to get your account updated.</p>",
    "<p>If you have already purchased a JCR membership this will be added to your account in the coming weeks.</p>",
    "<p>Thank you.</p>"
  ].join("");
}

router.post("/action", async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if (!hasPermission(req.session, "users.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, approved } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  let application;

  try {
    application = await PendingUserApplication.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the application" });
  }

  if (application === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  // Denied applications send an email and remove the application
  if (!approved) {
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
      membershipExpiresAt: null,
      confirmedDetails: true
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error: Unable to create a new user. Database error." });
  }

  // Now we check for their debt record
  let debtRecord;

  try {
    debtRecord = await Debt.findOne({ where: { username: user.username } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the debt status" });
  }

  if (debtRecord !== null) {
    let debtPermission;

    try {
      debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the debt permission" });
    }

    if (debtPermission === null) {
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
