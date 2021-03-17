// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, JCRRole, JCRRoleUserLink, JCRCommittee, JCRCommitteeRoleLink } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

router.post("/committee", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, description } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined || description === null || description.length === 0) {
    return res.status(400).json({ error: "Missing description" });
  }

  let committee;

  try {
    committee = await JCRCommittee.create({ name, description });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the committee" });
  }

  if(committee === null) {
    return res.status(500).json({ error: "Unable to create the committee, null" });
  }

  return res.status(200).json({ committee });
});

router.get("/committees", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let committees;

  try {
    committees = await JCRCommittee.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the committees" });
  }

  return res.status(200).json({ committees });
});

router.post("/committee/update", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, description } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined || description === null || description.length === 0) {
    return res.status(400).json({ error: "Missing description" });
  }

  let committee;

  try {
    committee = await JCRCommittee.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the committee" });
  }

  if(committee === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  committee.name = name;
  committee.description = description;

  try {
    await committee.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the committee changes" });
  }

  return res.status(204).end();
})

router.delete("/committee/:id", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  try {
    await JCRCommittee.destroy({ where: { id }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the committee" });
  }

  return res.status(204).end();
});

router.post("/role", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  let role;

  try {
    role = await JCRRole.create({ name });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the role" });
  }

  if(role === null) {
    return res.status(500).json({ error: "Unable to create the role, null" });
  }

  let joinedRecord;

  try {
    joinedRecord = await JCRRole.findOne({
      where: { id: role.id },
      include: [
        {
          model: JCRRoleUserLink,
          include: [
            {
              model: User,
              attributes: ["id", "username", "firstNames", "surname"]
            }
          ]
        },
        {
          model: JCRCommitteeRoleLink,
          include: [
            {
              model: JCRCommittee,
              attributes: [ "id", "name" ]
            }
          ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the newly created role" });
  }

  return res.status(200).json({ role: joinedRecord });
});

router.get("/roles/manage", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let roles;

  try {
    roles = await JCRRole.findAll({
      include: [
        {
          model: JCRRoleUserLink,
          include: [
            {
              model: User,
              attributes: ["id", "username", "firstNames", "surname"]
            }
          ]
        },
        {
          model: JCRCommitteeRoleLink,
          include: [
            {
              model: JCRCommittee,
              attributes: [ "id", "name" ]
            }
          ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the roles" });
  }

  let committees;

  try {
    committees = await JCRCommittee.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the committees" });
  }

  return res.status(200).json({ roles, committees });
});

router.post("/role/update", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  let role;

  try {
    role = await JCRRole.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the role" });
  }

  if(role === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  role.name = name;

  try {
    await role.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the role changes" });
  }

  return res.status(204).end();
})

router.delete("/role/:id", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  try {
    await JCRRole.destroy({ where: { id }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the role" });
  }

  return res.status(204).end();
});

router.delete("/role/:roleId/user/:userId", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { roleId, userId } = req.params;

  if(roleId === undefined || roleId === null) {
    return res.status(400).json({ error: "Missing roleId" });
  }

  if(userId === undefined || userId === null) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    await JCRRoleUserLink.destroy({
      where: { roleId, userId }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the user link" });
  }

  return res.status(204).end();
});

router.post("/role/user", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, username } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(username === undefined || username === null || username.length === 0) {
    return res.status(400).json({ error: "Missing username" });
  }

  let userRecord;

  try {
    userRecord = await User.findOne({
      where: { username },
      attributes: ["id", "username", "firstNames", "surname"]
    });
  } catch (error) {
    return res.status(500).json({ error: "There was an error searching the database for the user" });
  }

  if(userRecord === null) {
    return res.status(400).json({ error: `There is no user with the username ${username}. They must have logged in to the website at least once to appear here.` });
  }

  let roleRecord;

  try {
    roleRecord = await JCRRole.findOne({ where: { id }});
  } catch (error) {
    return res.status(500).json({ error: "There was an error searching the database for the role" });
  }

  if(roleRecord === null) {
    return res.status(400).json({ error: "The role id is invalid" });
  }

  let linkRecord;

  try {
    linkRecord = await JCRRoleUserLink.findOne({ where: { roleId: roleRecord.id, userId: userRecord.id }});
  } catch (error) {
    return res.status(500).json({ error: "There was an error checking the link in the database" });
  }

  if(linkRecord !== null) {
    return res.status(400).json({ error: `${username} is already assigned to this role` });
  }

  try {
    await JCRRoleUserLink.create({ roleId: roleRecord.id, userId: userRecord.id });
  } catch (error) {
    return res.status(500).json({ error: "There was an error creating the link in the database" });
  }

  return res.status(200).json({ user: userRecord });
});

router.delete("/role/committeeLink/:committeeLinkId", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { committeeLinkId } = req.params;

  if(committeeLinkId === undefined || committeeLinkId === null) {
    return res.status(400).json({ error: "Missing committeeLinkId" });
  }

  let committeeLink;

  try {
    committeeLink = await JCRCommitteeRoleLink.findOne({ where: { id: committeeLinkId }});
  } catch (error) {
    return res.status(500).json({ error: "Error finding the committee link in the database" });
  }

  if(committeeLink === null) {
    return res.status(400).json({ error: "Invalid committeeLinkId" });
  }

  try {
    await committeeLink.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Error deleting the committee link from the database" });
  }

  return res.status(204).end();
});

router.post("/role/committeeLink", async (req, res) => {
  if(!hasPermission(req.session, "jcr.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { committeeId, roleId, position } = req.body;

  if(committeeId === undefined || committeeId === null) {
    return res.status(400).json({ error: "Missing committeeId" });
  }

  if(roleId === undefined || roleId === null) {
    return res.status(400).json({ error: "Missing roleId" });
  }

  if(position === undefined || position === null) {
    return res.status(400).json({ error: "Missing position" });
  }

  let committeeLinkRecord;

  try {
    committeeLinkRecord = await JCRCommitteeRoleLink.findOne({ where: { committeeId, roleId } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check the committee link" });
  }

  if(committeeLinkRecord !== null) {
    return res.status(400).json({ error: "This role and committee are already linked! If you need to change the position then remove them from the committee and reassign!" });
  }

  let insertedRecord;

  try {
    insertedRecord = await JCRCommitteeRoleLink.create({ roleId, committeeId, position });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the link" });
  }

  let joinedRecord;

  try {
    joinedRecord = await JCRCommitteeRoleLink.findOne({
      where: { id: insertedRecord.id },
      include: [
        {
          model: JCRCommittee
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable select the newly inserted record" });
  }

  return res.status(200).json({ assignedCommittee: joinedRecord });
});

router.get("/committees/basic", async (req, res) => {
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let committees;

  try {
    committees = await JCRCommittee.findAll({
      attributes: [ "id", "name" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to select the committees list" });
  }

  return res.status(200).json({ committees });
});

router.get("/committee/:id", async (req, res) => {
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  let committee;

  try {
    committee = await JCRCommittee.findOne({
      where: { id },
      attributes: [ "id", "name", "description" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the committee" });
  }

  if(committee === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  let committeeMembers;

  try {
    committeeMembers = await JCRCommitteeRoleLink.findAll({
      where: { committeeId: id },
      attributes: [ "id", "roleId", "committeeId", "position" ],
      include: [
        {
          model: JCRRole,
          include: [
            {
              model: JCRRoleUserLink,
              attributes: [ "id", "roleId", "userId" ],
              include: [
                {
                  model: User,
                  attributes: [ "firstNames", "surname", "profilePicture" ]
                }
              ]
            }
          ]
        }
      ]
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the committee members" });
  }

  return res.status(200).json({ committee, committeeMembers });
})

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
