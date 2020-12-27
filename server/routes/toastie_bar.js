// Get express
const express = require("express");
const router = express.Router();
const fileUpload = require('express-fileupload');
const path = require('path');
// The database models
const { ToastieOrder, ToastieStock, ToastieOrderContent } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { hasPermission } = require("../utils/permissionUtils.js");

const termLocked = true;

const uploadPath = path.join(__dirname, "../uploads/images/toastie_bar/");
router.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 //2MB max file(s) size
},
}));

// Get the stock available
router.get("/stock", async (req, res) => {
  // User only
  let stock;

  // Just finds all the items and returns them
  try {
    stock = await ToastieStock.findAll();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    return;
  }

  return res.status(200).json({ stock });
});

router.get("/stock/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "toastie.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Gets a single item by its ID
  const id = req.params.id;
  const stockItem = await ToastieStock.findOne({ where: { id } });

  if(stockItem === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  return res.status(200).json({ stockItem });
});

// Add a new item for the stock
router.post("/stock", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "toastie.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const { name, type, price, available } = req.body;

  if(name == null) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(type == null) {
    return res.status(400).json({ error: "Missing type" });
  }

  if(price == null) {
    return res.status(400).json({ error: "Missing price" });
  }

  if(available == null) {
    return res.status(400).json({ error: "Missing available" });
  }

  // Create the new item
  try {
    await ToastieStock.create({ name, type, price, available });
  } catch (error) {
    return res.status(500).json({ error: "Server error creating new item" });
  }
  // Return success code and id of item created
  const newItem = await ToastieStock.findOne({ where: { name, available, type, price } });
  return res.status(200).json({ newId: newItem.id }).end();
});

// Image upload
router.post("/upload/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "toastie.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const newId = req.params.id;

  if(newId == null) {
    return res.status(400).json({ error: "Missing productId" });
  }

  const stockItem = await ToastieStock.findOne({ where: { id: newId }});

  if(stockItem === null) {
    return res.status(400).json({ error: "Unknown id submitted" });
  }

  try {
    if(!req.files) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    else {
      //Use the name of the input field (i.e. "image") to retrieve the uploaded file
      let image = req.files.file;
      let extension = path.extname(image.name);

      //Use the mv() method to place the file in upload directory (i.e. "uploads")
      const pathName = path.join(uploadPath, newId+extension);
      image.mv(pathName);
      // WILL OVERWRITE ANOTHER IMAGE OF SAME TYPE FOR SAME IMAGE

      try {
        let updatedRecord = {};
        updatedRecord.imageName = newId+extension;
        await stockItem.update(updatedRecord);
      } catch (error) {
        return res.status(500).json({ error: "Server error: Unable to update the item with the newly uploaded image" });
      }

      //send response
      return res.status(200).json({ message: 'File has uploaded successfully',  name: newId+extension, mimetype: image.mimetype, size: image.size }).end();
    }
  }
  catch (err) {
    return res.status(500).json({error: err});
  }
});

// Update an item in the stock
router.put("/stock/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "toastie.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Find the item they want to update

  const stockId = req.params.id;
  const stockItem = await ToastieStock.findOne({ where: { id: stockId }});

  if(stockItem === null) {
    return res.status(400).json({ error: "Unknown id submitted" });
  }

  // Construct the changes to the record

  let updatedRecord = {};

  if(req.body.name !== undefined && req.body.name !== null) {
    updatedRecord.name = req.body.name;
  }

  if(req.body.type !== undefined && req.body.type !== null) {
    updatedRecord.type = req.body.type;
  }

  if(req.body.price !== undefined && req.body.price !== null) {
    updatedRecord.price = req.body.price;
  }

  if(req.body.available !== undefined && req.body.available !== null) {
    updatedRecord.available = req.body.available;
  }

  if(req.body.imageName !== undefined){
    updatedRecord.imageName = req.body.imageName;
  }

  // Let sequelize update the record;

  try {
    await stockItem.update(updatedRecord);
  } catch (error) {
    return res.status(500).json({ error: "Server error: Unable to update the item" });
  }

  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
