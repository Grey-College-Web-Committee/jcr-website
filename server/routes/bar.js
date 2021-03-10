// Get express
const express = require("express");
const router = express.Router();
const multer = require("multer");
// The database models
const { User, Permission, PermissionLink, BarDrinkType, BarDrinkSize, BarBaseDrink, BarDrink, BarMixer } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const upload = multer({ dest: "uploads/images/bar/" });

router.get("/", async (req, res) => {
  return res.status(200).end();
});

router.post("/admin/type", async (req, res) => {
  // Creates a new drink type
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Basic validation
  const { name, allowsMixer } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(allowsMixer === undefined || allowsMixer === null) {
    return res.status(400).json({ error: "Missing allowsMixer" });
  }

  // Make the new type and send it back
  let type;

  try {
    type = await BarDrinkType.create({ name, allowsMixer });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the type" });
  }

  return res.status(200).json({ type });
});

router.get("/admin/types", async (req, res) => {
  // Lists the types of drinks
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Just find them all and send it back
  let types;

  try {
    types = await BarDrinkType.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the types" });
  }

  return res.status(200).json({ types });
});

router.post("/admin/size", async (req, res) => {
  // Creates a new drink size
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Basic validation
  const { name } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  // Make the new type and send it back
  let size;

  try {
    size = await BarDrinkSize.create({ name });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the size" });
  }

  return res.status(200).json({ size });
});

router.get("/admin/sizes", async (req, res) => {
  // Lists the sizes of drinks
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Just find them all and send it back
  let sizes;

  try {
    sizes = await BarDrinkSize.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the sizes" });
  }

  return res.status(200).json({ sizes });
});

router.get("/admin/summary", async (req, res) => {
  // Lists the sizes, types and drinks
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Just find them all and send it back
  let sizes;

  try {
    sizes = await BarDrinkSize.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the sizes" });
  }

  // Just find them all and send it back
  let types;

  try {
    types = await BarDrinkType.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the types" });
  }

  let baseDrinks;

  try {
    baseDrinks = await BarBaseDrink.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the base drinks" });
  }

  let drinks;

  try {
    drinks = await BarDrink.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the drinks" });
  }

  return res.status(200).json({ sizes, types, baseDrinks, drinks });

});

router.post("/admin/drink", upload.single("image"), async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, description, sizeCheckboxes: sizeCheckboxesUnparsed, prices: pricesUnparsed, type } = req.body;
  const image = req.file;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(description === undefined || description === null || description.length === 0) {
    return res.status(400).json({ error: "Missing description" });
  }

  if(sizeCheckboxesUnparsed === undefined || sizeCheckboxesUnparsed === null) {
    return res.status(400).json({ error: "Missing sizeCheckboxes" });
  }

  const sizeCheckboxes = JSON.parse(sizeCheckboxesUnparsed);

  if(pricesUnparsed === undefined || pricesUnparsed === null) {
    return res.status(400).json({ error: "Missing prices" });
  }

  const prices = JSON.parse(pricesUnparsed);

  if(type === undefined || type === null || type.length === 0) {
    return res.status(400).json({ error: "Missing type" });
  }

  if(image === undefined || image === null) {
    return res.status(400).json({ error: "Missing image" });
  }

  let typeRecord;

  try {
    typeRecord = await BarDrinkType.findOne({ where: { id: type } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find type" });
  }

  if(typeRecord === null) {
    return res.status(400).json({ error: "Invalid type" });
  }

  let baseDrink;

  try {
    baseDrink = await BarBaseDrink.create({ name, description, image: image.filename, typeId: typeRecord.id });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the base drink" });
  }

  let drinks = [];

  for(const size in sizeCheckboxes) {
    if(sizeCheckboxes[size]) {
      let sizeRecord;

      try {
        sizeRecord = await BarDrinkSize.findOne({ where: { id: size } });
      } catch (error) {
        return res.status(500).json({ error: "Unable to get the size" });
      }

      if(sizeRecord === null) {
        return res.status(400).json({ error: "Invalid size" });
      }

      let drink;

      try {
        drink = await BarDrink.create({ baseDrinkId: baseDrink.id, sizeId: sizeRecord.id, price: prices[size] });
      } catch (error) {
        return res.status(500).json({ error: "Unable to create drink size" });
      }

      drinks.push(drink);
    }
  }

  return res.status(200).json({ baseDrink, drinks });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
