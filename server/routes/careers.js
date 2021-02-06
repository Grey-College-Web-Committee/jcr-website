// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, CareersPost } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.get("/blog/single/:id", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "careers.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const idStr = req.params.id;

  if(idStr === undefined || idStr === null) {
    return res.status(400).json({ error: "id is missing" });
  }

  const id = parseInt(idStr);

  if(!Number.isInteger(id)) {
    return res.status(400).json({ error: "id must be an integer" });
  }

  let post;

  try {
    post = await CareersPost.findOne({
      where: { id },
      include: User
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the post" });
  }

  if(post === null) {
    return res.status(400).json({ error: "No post found for the id given" });
  }

  return res.status(200).json({ post });
});

router.post("/blog/single", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "careers.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

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

  try {
    await CareersPost.update({
      title, emailSubject, content
    }, {
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the post" });
  }

  return res.status(204).end();
});

// Called at the base path of your route with HTTP method GET
router.get("/blog/:page", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const pageStr = req.params.page;

  if(pageStr === undefined || pageStr === null) {
    return res.status(400).json({ error: "page is missing" });
  }

  const page = parseInt(pageStr);

  if(!Number.isInteger(page) || page <= 0) {
    return res.status(400).json({ error: "page must be a positive integer" });
  }

  const itemsPerPage = 5;

  let posts;

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

  return res.status(200).json({ posts });
});

router.post("/blog", async (req, res) => {
  const { user } = req.session;

  if(!hasPermission(req.session, "careers.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

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

  return res.status(204).end();
});

// Called at the /admin of your route with HTTP method GET
// Requires your specified permission to access
router.get("/admin", async (req, res) => {
  const { user } = req.session;

  // Compares their permissions with your internal permission string
  if(!hasPermission(req.session, "YourPermissionHere")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Returns a 200 status code with a short JSON response
  return res.status(200).json({ userHadPermission: true });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
