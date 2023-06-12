// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, Formal, FormalAttendee, FormalGroup } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const { v4: uuidv4 } = require("uuid");
const mailer = require("../utils/mailer");
const { Op } = require('sequelize')

router.get("/:id/details", async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let formal

  try {
    formal = await Formal.findOne({ where: { id: req.params.id } })
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ formal: formal.dataValues });
})

router.get("/", async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let formals = []
  let ids = []

  try {
    let emailAttendees = await FormalAttendee.findAll({ where: { email: req.session.user.namedEmail } })
    let usernameAttendees = await FormalAttendee.findAll({ where: { email: req.session.user.email } })
    let attendees = [...emailAttendees, ...usernameAttendees]

    for (let attendee of attendees) {
      let formal = await Formal.findOne({ where: { id: attendee.formalId } })
      let currentDate = new Date()
      if (formal.closeDate > currentDate && !ids.includes(formal.id)) {
        ids.push(formal.id)
        formals.push(formal.dataValues)
      }
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ formals });
})

const makeDisplayName = (firstNames, surname) => {
  const upperCaseFirstName = firstNames.split(",")[0];
  const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

  const upperCaseLastName = surname;
  const specialCaseList = ["MC", "MAC"];
  const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

  let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

  // Fix special cases like McDonald appearing as Mcdonald
  if (foundSpecialCase.length !== 0) {
    const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
    lastName = upperCaseLastName.substring(c.length);
    lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
  }

  // Fix hyphens
  if (lastName.includes("-")) {
    let capNext = false;
    let newLastName = [];

    for (const i in lastName) {
      if (capNext) {
        newLastName.push(lastName[i].toUpperCase());
        capNext = false;
        continue;
      }

      newLastName.push(lastName[i]);
      capNext = lastName[i] === "-";
    }

    lastName = newLastName.join("")
  }

  // Fix apostrophes
  if (lastName.includes("'")) {
    let capNext = false;
    let newLastName = [];

    for (const i in lastName) {
      if (capNext) {
        newLastName.push(lastName[i].toUpperCase());
        capNext = false;
        continue;
      }

      newLastName.push(lastName[i]);
      capNext = lastName[i] === "'";
    }

    lastName = newLastName.join("")
  }

  return `${firstName} ${lastName}`;
}

router.get("/:id/group", async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let group

  try {
    let attendee = await FormalAttendee.findOne({ where: { email: req.session.user.namedEmail, formalId: req.params.id } })
    if (!attendee) attendee = await FormalAttendee.findOne({ where: { email: req.session.user.email, formalId: req.params.id } })
    if (!attendee) return res.status(401).json({ error: "Not attending this formal" })
    if (!attendee.formalGroupId) return res.status(200).json({ group: null })
    let fGroup = await FormalGroup.findOne({ where: { id: attendee.formalGroupId } })
    let lead = await User.findOne({ where: { id: fGroup.groupHeadId } })
    let attendees = await FormalAttendee.findAll({
      where: {
        formalGroupId: fGroup.id,
        email: {
          [Op.not]: [
            lead.email, lead.namedEmail, req.session.user.namedEmail, req.session.user.email
          ].filter(email => email !== null)
        }
      }
    })
    group = {
      lead: makeDisplayName(lead.firstNames, lead.surname) + ` (${lead.username})`,
      members: attendees.map(oAttendee => makeDisplayName(oAttendee.firstNames, oAttendee.surname) + ((oAttendee.consented) ? "" : " (not yet consented)")),
      consented: attendee.consented
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ group });
})

router.get('/search/:id/:username', async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { username } = req.params;

  // Validate the username briefly
  if (!username || username === null || username === undefined) {
    return res.status(400).json({ error: "You must enter a username to search" });
  }

  if (username.length !== 6) {
    return res.status(400).json({ error: "The username must be exactly 6 characters" });
  }

  let member = null;
  let ticket = null;

  try {
    let user = await User.findOne({ where: { username } });
    if (user) {
      let attendee = await FormalAttendee.findOne({ where: { formalId: req.params.id, email: user.email } })
      if (!attendee) attendee = await FormalAttendee.findOne({ where: { formalId: req.params.id, email: user.namedEmail } })
      if (attendee && attendee.email !== req.session.user.email && attendee.email !== req.session.user.namedEmail) {
        if (attendee.formalGroupId) ticket = true
        member = { username, name: makeDisplayName(attendee.firstNames, attendee.surname), email: attendee.email }
      }
    }
  } catch (error) {
    return res.status(500).json({ error: "An error occurred completing this request, please try again later (#1)" });
  }

  if (member === null) {
    return res.status(400).json({ error: "The username entered does not match any formal attendee." });
  }

  if (ticket !== null) {
    return res.status(400).json({ error: "The user you are trying to find is already part of a group for this event." });
  }

  return res.status(200).json({ member });
})

router.post("/:id/group", async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let group

  try {
    let formal = await Formal.findOne({ where: { id: req.params.id } })
    let now = new Date()
    if (now > formal.closeDate) return res.status(400).json({ error: "Formal booking closed." })
    let attendee = await FormalAttendee.findOne({ where: { email: req.session.user.namedEmail, formalId: req.params.id } })
    if (!attendee) attendee = await FormalAttendee.findOne({ where: { email: req.session.user.email, formalId: req.params.id } })
    if (!attendee) return res.status(401).json({ error: "Not attending this formal" })
    if (attendee.formalGroupId) return res.status(400).json({ error: "Already in a group." })
    let attendees = []
    if (req.body.attendees.length < 2) return res.status(400).json({ error: "Insufficient attendees added." })
    if (req.body.attendees.length === 15) return res.status(400).json({ error: "Too many attendees added." })
    for (let email of req.body.attendees) {
      let attendee = await FormalAttendee.findOne({ where: { email, formalId: req.params.id } })
      if (attendee.formalGroupId) return res.status(400).json({ error: "Some attendees are already in a group." })
      attendees.push(attendee)
    }
    group = await FormalGroup.create({ formalId: req.params.id, groupHeadId: req.session.user.id, allowOthers: req.body.allowOthers })
    attendee.formalGroupId = group.id
    attendee.consented = true
    await attendee.save()
    for (let oAttendee of attendees) {
      oAttendee.formalGroupId = group.id
      let token = uuidv4()
      oAttendee.verificationToken = token
      oAttendee.consented = false
      await oAttendee.save()
      const verifyUrl = `${process.env.WEB_ADDRESS}formals/verify/${token}`;
      mailer.sendEmail(oAttendee.email, `Confirm Formal Table Group`, [
        `<p>Hello ${makeDisplayName(oAttendee.firstNames, oAttendee.surname)},</p>`,
        `You have been invited to join a table group led by ${makeDisplayName(req.session.user.firstNames, req.session.user.surname)} at ${formal.name}.`,
        `<p>Please make sure you are certain before clicking the following link as your group choice will immediately be made final.</p>`,
        `<p>Please <a href="${verifyUrl}" rel="noopener noreferrer">click here to verify your table group</a>.</p>`,
        `<p>Alternatively copy and paste the following URL into the address bar of your web browser: ${verifyUrl}</p>`,
        `<p>Thank you</p>`
      ].join(""));
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ id: group.id });
})

router.post("/:id/group/:groupId/join", async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let group

  try {
    let formal = await Formal.findOne({ where: { id: req.params.id } })
    let now = new Date()
    if (now > formal.closeDate) return res.status(400).json({ error: "Formal booking closed." })
    let attendee = await FormalAttendee.findOne({ where: { email: req.session.user.namedEmail, formalId: req.params.id } })
    if (!attendee) attendee = await FormalAttendee.findOne({ where: { email: req.session.user.email, formalId: req.params.id } })
    if (!attendee) return res.status(401).json({ error: "Not attending this formal" })
    if (attendee.formalGroupId) return res.status(400).json({ error: "Already in a group." })
    group = await FormalGroup.findOne({ where: { id: req.params.groupId } })
    let attendees = await FormalAttendee.findAll({ where: { formalGroupId: group.id } })
    if (attendees.length === 16) return res.status(400).json({ error: "Group full." })
    attendee.formalGroupId = group.id
    attendee.consented = true
    await attendee.save()
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ id: group.id });
})

router.get("/:id/groups", async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let groups = []

  try {
    let attendee = await FormalAttendee.findOne({ where: { email: req.session.user.namedEmail, formalId: req.params.id } })
    if (!attendee) attendee = await FormalAttendee.findOne({ where: { email: req.session.user.email, formalId: req.params.id } })
    if (!attendee) return res.status(401).json({ error: "Not attending this formal" })
    if (attendee.formalGroupId) return res.status(200).json({ groups })
    let formalGroups = await FormalGroup.findAll({ where: { formalId: req.params.id } })
    for (let group of formalGroups) {
      let attendees = await FormalAttendee.findAll({ where: { formalGroupId: group.id } })
      let lead = await User.findOne({ where: { id: group.groupHeadId } })
      if (attendees.length !== 16 && group.allowOthers) groups.push({ id: group.id, lead: makeDisplayName(lead.firstNames, lead.surname) + ` (${lead.username})` })
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ groups });
})

router.post('/verify/:code', async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if (!req.params.code) return res.status(400).json({ error: "No verification code supplied." });

  let attendee

  try {
    attendee = await FormalAttendee.findOne({ where: { verificationToken: req.params.code } })
    attendee.consented = true
    attendee.verificationToken = null
    await attendee.save()
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ id: attendee.formalId });
})

router.post('/:id/verify', async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    let attendee = await FormalAttendee.findOne({ where: { email: req.session.user.namedEmail, formalId: req.params.id } })
    if (!attendee) attendee = await FormalAttendee.findOne({ where: { email: req.session.user.email, formalId: req.params.id } })
    if (!attendee) return res.status(401).json({ error: "Not attending this formal" })
    attendee.consented = true
    attendee.verificationToken = null
    await attendee.save()
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ success: true });
})

router.get('/all', async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let formals = []

  try {
    let dFormals = await Formal.findAll()
    for (let formal of dFormals) {
      formals.push(formal.dataValues)
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ formals })
})

router.get('/:id/csv', async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let groups = []
  let formal

  try {
    formal = await Formal.findOne({ where: { id: req.params.id } })
    let formalGroups = await FormalGroup.findAll({ where: { formalId: req.params.id } })
    for (let group of formalGroups) {
      let lead = await User.findOne({ where: { id: group.groupHeadId } })
      let attendees = await FormalAttendee.findAll({
        where: { formalGroupId: group.id, email: { [Op.not]: [lead.email, lead.namedEmail].filter(email => email !== null) }, formalId: req.params.id }
      })
      groups.push({
        lead: makeDisplayName(lead.firstNames, lead.surname),
        leadUser: lead.username,
        members: attendees.map(oAttendee => {
          return {
            name: makeDisplayName(oAttendee.firstNames, oAttendee.surname),
            consented: oAttendee.consented
          }
        })
      })
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  let csv = 'Attendee name, Consented to group, Username (for lead booker)\n'

  groups.forEach((group, i) => {
    csv += `\n${group.lead},Consented,${group.leadUser}\n`
    for (let member of group.members) {
      csv += `${member.name},${member.consented ? 'Consented' : 'Not Consented'}\n`
    }
  })

  res.set("Content-Type", "text/csv");
  res.set("Content-Disposition", `attachment; filename="${formal.name} - ${new Date()}.csv"`);
  return res.status(200).send(csv)
})

router.get('/:id/groups/all', async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let groups = []

  try {
    let formalGroups = FormalGroup.findAll({ where: { formalId: req.params.id } })
    for (let group of formalGroups) {
      let lead = await User.findOne({ where: { id: group.groupHeadId } })
      let attendees = await FormalAttendee.findAll({
        where: { formalGroupId: group.id, email: { [Op.not]: [lead.email, lead.namedEmail].filter(email => email !== null) } }
      })
      groups.push({
        lead: makeDisplayName(lead.firstNames, lead.surname),
        members: attendees.map(oAttendee => {
          return {
            name: makeDisplayName(oAttendee.firstNames, oAttendee.surname),
            consented: oAttendee.consented,
            email: oAttendee.email,
            id: oAttendee.id
          }
        })
      })
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ groups })
})

router.delete('/:id', async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  try {
    await Formal.destroy({ where: { id: req.params.id } })
    await FormalGroup.destroy({ where: { formalId: req.params.id } })
    await FormalAttendee.destroy({ where: { formalId: req.params.id } })
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({})
})

router.post("/", async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let formal

  try {
    formal = await Formal.create({ name: req.body.name, closeDate: new Date(req.body.closeDate) })
    for (let attendee of req.body.attendees) {
      await FormalAttendee.create({ formalId: formal.id, email: attendee.email, firstNames: attendee.firstNames, surname: attendee.surname })
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ id: formal.id })
})

router.post("/:id/edit", async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let formal

  try {
    formal = await Formal.findOne({ where: { id: req.params.id } })
    formal.name = req.body.name
    formal.closeDate = new Date(req.body.closeDate)
    await formal.save()
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ id: formal.id })
})

router.delete("/group/:id", async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  try {
    let group = await FormalGroup.findOne({ where: { id: req.params.id } })
    if (!group) return res.status(400).json({ error: "Group doesn't exist." });
    let attendees = await FormalAttendee.findAll({ where: { formalGroupId: group.id } })
    let formal = await Formal.findOne({ where: { id: group.formalId } })
    for (let attendee of attendees) {
      attendee.formalGroupId = null
      attendee.verificationToken = null
      attendee.consented = false
      mailer.sendEmail(attendee.email, 'Formal Group Deleted by Admin', `Your group for the formal "${formal.name}" has been deleted by an admin. Please use the JCR website to find a new group.`)
      await attendee.save()
    }
    await group.destroy()
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({})
})

router.delete("/group/attendee/:id", async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  try {
    let attendee = await FormalAttendee.findAll({ where: { id: req.params.id } })
    if (!attendee) return res.status(400).json({ error: "Attendee doesn't exist." });
    let group = await FormalGroup.findOne({ where: { id: attendee.formalGroupId } })
    if (!group) return res.status(400).json({ error: "Group doesn't exist." });
    let formal = await Formal.findOne({ where: { id: group.formalId } })
    let lead = await User.findOne({ where: { id: group.groupHeadId } })
    if (lead.email == attendee.email || lead.namedEmail == attendee.email) return res.status(400).json({ error: "Can't delete lead." });
    attendee.formalGroupId = null
    attendee.verificationToken = null
    attendee.consented = false
    mailer.sendEmail(attendee.email, 'Removed from Formal Group by Admin', `You have been removed from your group for the formal "${formal.name}" by an admin. Please use the JCR website to find a new group.`)
    await attendee.save()
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({})
})

router.get('/:id/attendees', async (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let attendees = []

  try {
    let formalAttendees = await FormalAttendee.findAll({ where: { formalId: req.params.id } })
    for (let attendee of formalAttendees) {
      if (!attendee.formalGroupId) attendees.push({ id: attendee.id, name: makeDisplayName(attendee.firstNames, attendee.surname) })
    }
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ attendees });
})

router.post("/admin/:id/group", async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let group

  try {
    let formal = await Formal.findOne({ where: { id: req.params.id } })
    let attendee = await FormalAttendee.findOne({ where: { email: req.body.leadEmail, formalId: req.params.id } })
    if (!attendee) return res.status(401).json({ error: "Not attending this formal" })
    if (attendee.formalGroupId) return res.status(400).json({ error: "Already in a group." })
    let attendees = []
    if (req.body.attendees.length < 2) return res.status(400).json({ error: "Insufficient attendees added." })
    if (req.body.attendees.length === 15) return res.status(400).json({ error: "Too many attendees added." })
    for (let email of req.body.attendees) {
      let attendee = await FormalAttendee.findOne({ where: { email, formalId: req.params.id } })
      if (attendee.formalGroupId) return res.status(400).json({ error: "Some attendees are already in a group." })
      attendees.push(attendee)
    }
    let lead = await User.findOne({ where: { email: req.body.leadEmail } })
    if (!lead) lead = await User.findOne({ where: { namedEmail: req.body.leadEmail } })
    group = await FormalGroup.create({ formalId: req.params.id, groupHeadId: lead.id, allowOthers: req.body.allowOthers })
    attendee.formalGroupId = group.id
    attendee.consented = true
    await attendee.save()
    for (let oAttendee of attendees) {
      oAttendee.formalGroupId = group.id
      oAttendee.consented = true
      await oAttendee.save()
      mailer.sendEmail(req.body.leadEmail, 'Formal Group Assigned by Admin', `An admin has assigned you to a group led by ${makeDisplayName(lead.firstNames, req.session.user.surname)} at ${formal.name}.`)
    }
    mailer.sendEmail(req.body.leadEmail, 'Formal Group Assigned by Admin', `An admin has assigned you to lead a group at ${formal.name}.`)
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ id: group.id });
})

router.post("/admin/:id/group/:groupId/join", async (req, res) => {
  if (!hasPermission(req.session, "formals.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let group

  try {
    let formal = await Formal.findOne({ where: { id: req.params.id } })
    let attendee = await FormalAttendee.findOne({ where: { email: req.body.email, formalId: req.params.id } })
    if (!attendee) return res.status(401).json({ error: "Not attending this formal" })
    if (attendee.formalGroupId) return res.status(400).json({ error: "Already in a group." })
    group = await FormalGroup.findOne({ where: { id: req.params.groupId } })
    let attendees = await FormalAttendee.findAll({ where: { formalGroupId: group.id } })
    if (attendees.length === 16) return res.status(400).json({ error: "Group full." })
    let lead = await User.findOne({ where: { id: group.groupHeadId } })
    attendee.formalGroupId = group.id
    attendee.consented = true
    await attendee.save()
    mailer.sendEmail(req.body.leadEmail, 'Formal Group Assigned by Admin', `An admin has assigned you to a group led by ${makeDisplayName(lead.firstNames, req.session.user.surname)} at ${formal.name}.`)
  } catch {
    return res.status(500).json({ error: "Database error." });
  }

  return res.status(200).json({ id: group.id });
})

module.exports = router