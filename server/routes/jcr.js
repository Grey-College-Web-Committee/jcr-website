// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, JCRRole, JCRRoleUserLink, JCRCommittee, JCRCommitteeRoleLink, JCRFile, JCRFolder } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const fs = require("fs").promises;
const multer = require("multer");
const upload = multer({ dest: "uploads/jcr/" });

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

  const { id, name, description, videoUrl } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined) {
    return res.status(400).json({ error: "Missing description" });
  }

  if(videoUrl === undefined) {
    return res.status(400).json({ error: "Missing videoUrl" });
  }

  if(videoUrl !== null && videoUrl !== "" && !videoUrl.toLowerCase().startsWith("https://")) {
    return res.status(400).json({ error: "Video URL must start with https://" });
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
  role.description = description;
  role.videoUrl = videoUrl;

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

router.get("/structure", async (req, res) => {
  if(!hasPermission(req.session, "jcr.member")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let rootDir;

  // Get all the folders in the root directory
  try {
    rootDir = await JCRFolder.findAll({
      where: {
        parent: null
      },
      include: [{
        model: JCRFolder,
        attributes: [ "id" ]
      }],
      attributes: [ "id", "name", "description" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the root folders" });
  }

  let subFolders = [];

  // Now we need to recurse down the tree and construct the file system
  for(const folder of rootDir) {
    const treeResult = await recurseTree(folder);

    if(!treeResult) {
      return res.status(500).json({ error: "Unable to recurse the file tree" });
    }

    subFolders.push(treeResult);
  }

  let files;

  // Get the files in the base directory
  try {
    files = await JCRFile.findAll({
      where: { parent: null },
      attributes: [ "id", "name", "description", "realFileName" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the root files" });
  }

  const structure = {
    details: null,
    files,
    leaf: subFolders.length === 0,
    subFolders
  }

  // Send it to the client
  return res.status(200).json({ structure });
});

// Recurse the file system tree
const recurseTree = async (currentFolder) => {
  let files;

  // Get the files in the directory
  try {
    files = await JCRFile.findAll({
      where: {
        parent: currentFolder.id
      },
      attributes: [ "id", "name", "description", "realFileName" ]
    });
  } catch (error) {
    return false;
  }

  let subDirs;

  try {
    subDirs = await JCRFolder.findAll({
      where: {
        parent: currentFolder.id
      },
      attributes: [ "id", "name", "description" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the root folders" });
  }

  // If it has sub-folders then recurse them
  if(subDirs && subDirs.length !== 0) {
    let recurseResult = [];

    for(const basicInnerFolder of subDirs) {
      let innerFolder;

      // Recurse and put it in the array
      const innerResult = await recurseTree(basicInnerFolder);

      if(!innerResult) {
        return false;
      }

      recurseResult.push(innerResult);
    }

    return {
      details: currentFolder,
      files,
      leaf: false,
      subFolders: recurseResult
    }
  }

  // This is a leaf node
  return {
    details: currentFolder,
    files,
    leaf: true,
    subFolders: []
  }
}

router.post("/folder", async (req, res) => {
  if(!hasPermission(req.session, "jcr.files")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, description, parent } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined) {
    return res.status(400).json({ error: "Missing description" });
  }

  if(parent === undefined) {
    return res.status(400).json({ error: "Missing parent" });
  }

  const trueDescription = description === null || description.length === 0 ? null : description;
  const trueParent = parent === null || parent.length === 0 ? null : parent;

  let folder;

  try {
    folder = await JCRFolder.create({ name, description: trueDescription, parent: trueParent });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the new folder" });
  }

  return res.status(200).json({ folder });
});

router.post("/file", upload.single("file"), async (req, res) => {
  if(!hasPermission(req.session, "jcr.files")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, description, parent } = req.body;
  const file = req.file;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined) {
    return res.status(400).json({ error: "Missing description" });
  }

  if(parent === undefined) {
    return res.status(400).json({ error: "Missing parent" });
  }

  if(file === undefined || file === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  const trueDescription = description === null || description.length === 0 ? null : description;
  const trueParent = parent === null || parent.length === 0 ? null : parent;

  if(!["application/msword", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.mimetype)) {
    console.log(file.mimetype)
    return res.status(400).json({ error: "This only accepts pdfs or Word Documents" });
  }

  let fileRecord;

  try {
    fileRecord = await JCRFile.create({ name, description: trueDescription, parent: trueParent, realFileName: file.filename });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the file record" });
  }

  return res.status(200).json({ file: fileRecord });
});

router.post("/file/update", async (req, res) => {
  if(!hasPermission(req.session, "jcr.files")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, description, parent } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined) {
    return res.status(400).json({ error: "Missing description" });
  }

  if(parent === undefined) {
    return res.status(400).json({ error: "Missing parent" });
  }

  let fileRecord;

  try {
    fileRecord = await JCRFile.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the file record" });
  }

  if(fileRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  fileRecord.name = name;
  fileRecord.description = description;
  fileRecord.parent = parent;

  try {
    await fileRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the file record" });
  }

  return res.status(204).end();
});

router.delete("/file/:id", async (req, res) => {
  // Must have permission
  if(!hasPermission(req.session, "jcr.files")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  let fileRecord;

  try {
    fileRecord = await JCRFile.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the file from the database" });
  }

  if(fileRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    await fs.unlink(`uploads/jcr/${fileRecord.realFileName}`, (err) => {});
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the file from the file system" });
  }

  try {
    await fileRecord.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the file record" });
  }

  return res.status(204).end();
})

router.post("/folder/update", async (req, res) => {
  if(!hasPermission(req.session, "jcr.files")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, description, parent } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined) {
    return res.status(400).json({ error: "Missing description" });
  }

  if(parent === undefined) {
    return res.status(400).json({ error: "Missing parent" });
  }

  let folderRecord;

  try {
    folderRecord = await JCRFolder.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the folder record" });
  }

  if(folderRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  folderRecord.name = name;
  folderRecord.description = description;
  folderRecord.parent = parent;

  try {
    await folderRecord.save();
  } catch (error) {
    console.log({error})
    return res.status(500).json({ error: "Unable to save the folder record" });
  }

  return res.status(204).end();
});

router.delete("/folder/:id", async (req, res) => {
  // Must have permission
  if(!hasPermission(req.session, "jcr.files")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  let folderRecord;

  try {
    folderRecord = await JCRFolder.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the folder from the database" });
  }

  if(folderRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  // Recurse and get the files
  const success = await deleteRecursively(folderRecord);

  if(!success) {
    return res.status(500).json({ error: "Unable to cascade the deletion" });
  }

  try {
    await folderRecord.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the file record" });
  }

  return res.status(204).end();
});

const deleteRecursively = async (currentFolder) => {
  // Purge a tree
  let files;

  // Get the files in the directory
  try {
    files = await JCRFile.findAll({
      where: {
        parent: currentFolder.id
      },
      attributes: [ "id", "realFileName" ]
    });
  } catch (error) {
    return false;
  }

  // Delete the files (both db and file system)
  for(const file of files) {
    try {
      await fs.unlink(`uploads/jcr/${file.realFileName}`, (err) => {});
    } catch (error) {
      return false;
    }

    try {
      await file.destroy();
    } catch (error) {
      return false;
    }
  }

  let subDirs;

  // Get the sub-folders
  try {
    subDirs = await JCRFolder.findAll({
      where: {
        parent: currentFolder.id
      },
      attributes: [ "id" ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the root folders" });
  }

  // If it has sub-folders then recurse them
  if(subDirs && subDirs.length !== 0) {
    let recurseResult = [];

    for(const basicInnerFolder of subDirs) {
      let innerFolder;

      // Recurse and put it in the array
      const innerResult = await deleteRecursively(basicInnerFolder);

      if(!innerResult) {
        return false;
      }
    }
  }

  // Finally delete the folder record
  try {
    await currentFolder.destroy();
  } catch (error) {
    return false;
  }

  return true;
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
