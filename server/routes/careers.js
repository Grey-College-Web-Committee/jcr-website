// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, CareersPost } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.delete("/blog/single/:id", async (req, res) => {
  // Removes the post
  const { user } = req.session;

  // Must have permission to manage the posts
  if(!hasPermission(req.session, "careers.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Brief validation
  const idStr = req.params.id;

  if(idStr === undefined || idStr === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  const id = parseInt(idStr);

  if(!Number.isInteger(id)) {
    return res.status(400).json({ error: "id must be an integer" });
  }

  // Delete it from the database
  try {
    await CareersPost.destroy({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the post" });
  }

  // No content but it was successful
  return res.status(204).end();
});

router.get("/blog/single/:id", async (req, res) => {
  // Gets a single post
  const { user } = req.session;

  // Only used by the edit page so protect it although it could be relaxed to jcr.member
  if(!hasPermission(req.session, "careers.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Brief validation
  const idStr = req.params.id;

  if(idStr === undefined || idStr === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  const id = parseInt(idStr);

  if(!Number.isInteger(id)) {
    return res.status(400).json({ error: "id must be an integer" });
  }

  let post;

  // Look for the post
  try {
    post = await CareersPost.findOne({
      where: { id },
      include: User
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the post" });
  }

  // Didn't exist, ID must be wrong
  if(post === null) {
    return res.status(400).json({ error: "No post found for the id given" });
  }

  return res.status(200).json({ post });
});

router.post("/blog/single", async (req, res) => {
  // Submit changes to a post
  const { user } = req.session;

  // Must have permission to do this
  if(!hasPermission(req.session, "careers.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the uploaded data
  const { id, title, emailSubject, content } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(title === undefined || title === null || title.length === 0) {
    return res.status(400).json({ error: "Missing title" });
  }

  if(emailSubject === undefined || emailSubject === null || emailSubject.length === 0) {
    return res.status(400).json({ error: "Missing emailSubject" });
  }

  if(content === undefined || content === null || content.length === 0) {
    return res.status(400).json({ error: "Missing content" });
  }

  // Update the post
  try {
    await CareersPost.update({
      title, emailSubject, content
    }, {
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the post" });
  }

  // No content but was successful
  return res.status(204).end();
});

router.get("/blog/:page", async (req, res) => {
  // Loads all of the posts
  const { user } = req.session;

  // Must be a member
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Basic validation
  const pageStr = req.params.page;

  if(pageStr === undefined || pageStr === null) {
    return res.status(400).json({ error: "page is missing" });
  }

  const page = parseInt(pageStr);

  if(!Number.isInteger(page) || page <= 0) {
    return res.status(400).json({ error: "page must be a positive integer" });
  }

  // We want to have pages rather than dump the whole load at once
  const itemsPerPage = 5;

  let posts;

  // Gets the posts for specific page and counts how many are included
  try {
    posts = await CareersPost.findAndCountAll({
      offset: itemsPerPage * (page - 1),
      limit: itemsPerPage,
      include: User,
      order: [
        ["id", "DESC"]
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch posts" });
  }

  // Returns them to the client
  return res.status(200).json({ posts });
});

router.post("/blog", async (req, res) => {
  // Create a new post
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "careers.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validated the details
  const { title, emailSubject, content } = req.body;

  if(title === undefined || title === null || title.length === 0) {
    return res.status(400).json({ error: "Missing title" });
  }

  if(emailSubject === undefined || emailSubject === null || emailSubject.length === 0) {
    return res.status(400).json({ error: "Missing emailSubject" });
  }

  if(content === undefined || content === null || content.length === 0) {
    return res.status(400).json({ error: "Missing content" });
  }

  // Create the post
  try {
    await CareersPost.create({
      userId: user.id,
      title,
      emailSubject,
      content
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the post" });
  }

  // No content but successful
  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
