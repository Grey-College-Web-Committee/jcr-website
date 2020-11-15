// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User } = require("../database.models.js");
const axios = require("axios");

// Called when a POST request is to be served at /api/authentication/login
router.post("/login", async (req, res) => {
  // Get the username and password, verify they are both there
  const username = req.body.username;
  const password = req.body.password;

  if(username == null) {
    return res.status(400).json({ message: "Missing username" });
  }

  if(password == null) {
    return res.status(400).json({ message: "Missing password" });
  }

  // To validate a Durham account with CIS we need to query a specific page
  // https://www.dur.ac.uk/its/password/validator
  // Providing headers 'Authorization' = 'Basic {{base64 encoded string 'username:password'}}'

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

  // We will error if we do not receive a 200 status so we can assume we are validated from here
  // We have no need to store the password (or its hash) so can simply ignore it
  let user;

  try {
    // Only create a new entry if one doesn't exist
    user = await User.findOne({ where: { username } });
  } catch (error) {
    return res.status(500).json({ message: "Server error: Unable to find user. Database error." });
  }

  if(user == null) {
    let details;

    try {
      details = await axios.get(`https://community.dur.ac.uk/grey.jcr/itsuserdetailsjson.php?username=${username}`);
    } catch (error) {
      return res.status(500).json({ message: "Unable to fetch details about this user from the university" });
    }

    const { email, surname, firstnames, studyyear, college } = details.data;

    if(college.toLowerCase() !== "grey college") {
      return res.status(403).json({ message: "You must be a member of Grey College to access this website" });
    }

    try {
      // Create a new user record
      user = await User.create({ username, email, surname, firstNames: firstnames, year: studyyear, email });
    } catch (error) {
      return res.status(500).json({ message: "Server error: Unable to create a new user. Database error." });
    }
  }

  // Credentials must have been accepted or axios would have errored
  // Now assign data for their session
  req.session.user = user.dataValues;

  const date = new Date();
  date.setTime(date.getTime() + (2 * 60 * 60 * 1000));

  res.status(200).json({ user: { username: user.username, admin: user.admin, expires: date, email: user.email }, message: "Successfully authenticated" });
});

router.post("/logout", async (req, res) => {
  if(req.session.user && req.cookies.user_sid) {
    return res.clearCookie("user_sid").status(200).json({ message: "Logged out" });
  }

  return res.status(200).json({ message: "User was not logged in" });
});

router.get("/verify", async (req, res) => {
  if(req.session.user && req.cookies.user_sid) {
    return res.status(200).json({ user: { username: user.username, admin: user.admin } });
  }

  return res.status(401).end();
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
