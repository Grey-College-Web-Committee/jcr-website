// Get express
const express = require("express");
const router = express.Router();
const fileUpload = require('express-fileupload');
const path = require("path");
// The database models
const { User, Address, StashOrder, ShopOrder, StashStock, StashColours, StashSizeChart, StashItemColours, StashOrderCustomisation, StashCustomisations, StashStockImages } = require("../database.models.js");
const dateFormat = require("dateformat");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { hasPermission } = require("../utils/permissionUtils.js");
const { Op } = require("sequelize");
const hash = require("object-hash");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const uploadPath = path.join(__dirname, "../uploads/images/stash/");
const csvPath = path.join(__dirname, "../exports/stash/");

const translateSize = (size) => {
  switch(size) {
    case "WS8":
      return "Women's Size 8";
    case "WS10":
      return "Women's Size 10";
    case "WS12":
      return "Women's Size 12";
    case "WS14":
      return "Women's Size 14";
    case "WS16":
      return "Women's Size 16";
    case "WS18":
      return "Women's Size 18";
    default:
      return size;
  }
}

// enable files upload
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
    stock = await StashStock.findAll({
      include: [ StashStockImages ]
    });
  } catch (error) {
    res.status(500).json({ error: "Server error"+error.toString() });
    return;
  }

  return res.status(200).json({ stock });
});

router.get("/item/:id", async (req, res) => {
  const id = req.params.id;

  if(!id || id === null || id === undefined) {
    return res.status(400).json({ error: "Missing id" });
  }

  let item;

  try {
    item = await StashStock.findOne({
      where: {
        id
      },
      include: [
        StashCustomisations,
        StashSizeChart,
        StashStockImages,
        {
          model: StashItemColours,
          include: [ StashColours ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error });
  }

  if(item === null) {
    return res.status(400).json({ error: `Unknown id ${id}` })
  }

  return res.status(200).json({ item });
});

// Get the size charts available
router.get("/sizes", async (req, res) => {
  // User only
  let sizes;

  // Just finds all the items and returns them
  try {
    sizes = await StashSizeChart.findAll();
  } catch (error) {
    res.status(500).json({ error: "Server error"+error.toString() });
    return;
  }

  return res.status(200).json({ sizes });
});

// Get the size charts available
router.get("/itemColour/:productId", async (req, res) => {
  // User only
  let itemColours;
  const productId = req.params.productId;

  if(productId == null) {
    return res.status(400).json({ error: "Missing productId" });
  }
  // Just finds all the items and returns them
  try {
    itemColours = await StashItemColours.findAll({ where: {productId:productId} });
  } catch (error) {
    res.status(500).json({ error: "Server error"+error.toString() });
    return;
  };
  return res.status(200).json({ itemColours });
});

// Get the colours available
router.get("/stockColours", async (req, res) => {
  // User only
  let colours;

  // Just finds all the items and returns them
  try {
    colours = await StashColours.findAll();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    return;
  }

  return res.status(200).json({ colours });
});

router.post("/export", async(req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const startDateAsStr = req.body.startDate;
  const endDateAsStr = req.body.endDate;

  if(startDateAsStr === null || startDateAsStr === undefined) {
    return res.status(400).json({ message: "Missing startDate" });
  }

  if(endDateAsStr === null || endDateAsStr === undefined) {
    return res.status(400).json({ message: "Missing endDate" });
  }

  const startDate = new Date(startDateAsStr);
  const endDate = new Date(endDateAsStr);

  // Now get all orders between these two dates
  const orders = await StashOrder.findAll({
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    },
    include: [
      StashStock,
      StashColours,
      StashOrderCustomisation,
      {
        model: ShopOrder,
        include: [ User, Address ],
        where: {
          paid: true
        },
        required: true
      }
    ]
  });

  // Just because the item is in the stash orders table doesn't mean it has been paid for
  // we need to make sure that only orders that have been paid for show up here

  const paidForOrders = orders.filter(order => order.ShopOrder.paid === true);

  // Avoid using orders by accident
  delete orders;

  /*
  * Duplicates must satisify:
  * - Same productId,
  * - Same size,
  * - No customisation,
  * - Same colourId,
  * - Same shieldOrCrest,
  * - Same underShieldText
  */

  const itemsWithCustomisation = [];
  const nonCustomisedHashes = {};

  // Sort into custom and non-custom

  paidForOrders.forEach(order => {
    const customisation = order.StashOrderCustomisations;

    if(customisation !== undefined && customisation !== null && customisation.length !== 0) {
      itemsWithCustomisation.push(order);
      return;
    }

    const { productId, size, colourId, shieldOrCrest, underShieldText, quantity, StashColour, StashStock, ShopOrder } = order;

    let addressId = -1;

    if(ShopOrder.Address !== null) {
      addressId = ShopOrder.Address.id;
    }

    const hashableComparison = { productId, size, colourId, shieldOrCrest, underShieldText, addressId };
    const hashedObj = hash(hashableComparison);

    if(Object.keys(nonCustomisedHashes).includes(hashedObj)) {
      nonCustomisedHashes[hashedObj].quantity += quantity;
    } else {
      nonCustomisedHashes[hashedObj] = {
        quantity,
        StashStock,
        colourId,
        StashColour,
        productId,
        size,
        shieldOrCrest,
        underShieldText,
        ShopOrder
      };
    }
  });

  /*
  * We now have an object with the quantities of duplicates items and their
  * corresponding items.
  * We also have an array of customised stash that we can use too.
  * Write them to the csvRecords array and then to the file
  */

  const time = new Date().getTime();
  const fileLocation = `${time}-${dateFormat(startDate, "yyyy-mm-dd")}-to-${dateFormat(endDate, "yyyy-mm-dd")}`;

  const csvWriterJCR = createCsvWriter({
    path: `${csvPath}JCRStashOrders-${fileLocation}.csv`,
    header: [
      { id: "name", title: "Name" },
      { id: "code", title: "Code" },
      { id: "quantity", title: "Quantity" },
      { id: "size", title: "Size" },
      { id: "colour", title: "Colour" },
      { id: "shieldOrCrest", title: "Shield/Crest" },
      { id: "underShieldText", title: "Under Shield/Crest Text" },
      { id: "backPrint", title: "Back Print" },
      { id: "backEmbroidery", title: "Back Embroidery" },
      { id: "legPrint", title: "Leg Print" },
      { id: "rightPrint", title: "Right Breast Print" },
      { id: "paid", title: "Paid" },
      { id: "deliveryOrCollection", title: "Delivery/Collection" },
      { id: "recipient", title: "Delivery Recipient"},
      { id: "line1", title: "Address Line 1"},
      { id: "line2", title: "Address Line 2"},
      { id: "city", title: "City"},
      { id: "postcode", title: "Postcode"},
    ]
  });

  const csvWriterMCR = createCsvWriter({
    path: `${csvPath}MCRStashOrders-${fileLocation}.csv`,
    header: [
      { id: "name", title: "Name" },
      { id: "code", title: "Code" },
      { id: "quantity", title: "Quantity" },
      { id: "size", title: "Size" },
      { id: "colour", title: "Colour" },
      { id: "shieldOrCrest", title: "Shield/Crest" },
      { id: "underShieldText", title: "Under Shield/Crest Text" },
      { id: "backPrint", title: "Back Print" },
      { id: "backEmbroidery", title: "Back Embroidery" },
      { id: "legPrint", title: "Leg Print" },
      { id: "rightPrint", title: "Right Breast Print" },
      { id: "paid", title: "Paid" },
      { id: "deliveryOrCollection", title: "Delivery/Collection" },
      { id: "recipient", title: "Delivery Recipient"},
      { id: "line1", title: "Address Line 1"},
      { id: "line2", title: "Address Line 2"},
      { id: "city", title: "City"},
      { id: "postcode", title: "Postcode"},
    ]
  });

  const csvWriterChecklist = createCsvWriter({
    path: `${csvPath}Checklist-${fileLocation}.csv`,
    header: [
      { id: "username", title: "Username" },
      { id: "surname", title: "Surname" },
      { id: "name", title: "Item Name" },
      { id: "code", title: "Code" },
      { id: "quantity", title: "Quantity" },
      { id: "size", title: "Size" },
      { id: "colour", title: "Colour" },
      { id: "shieldOrCrest", title: "Shield/Crest" },
      { id: "underShieldText", title: "Under Shield/Crest Text" },
      { id: "backPrint", title: "Back Print" },
      { id: "backEmbroidery", title: "Back Embroidery" },
      { id: "legPrint", title: "Leg Print" },
      { id: "rightPrint", title: "Right Breast Print" },
      { id: "paid", title: "Paid" },
      { id: "deliveryOrCollection", title: "Delivery/Collection" },
      { id: "collected", title: "Collected" }
    ]
  });

  let csvRecordsJCR = [];
  let csvRecordsMCR = [];
  let csvRecordsChecklist = [];

  // We also need to separate out the MCR and JCR stash
  // This will be done by looking at the underShieldText

  // Start with the non-customised

  Object.keys(nonCustomisedHashes).forEach(key => {
    const item = nonCustomisedHashes[key];
    let record = {};
    // If it equals "Grey College MCR" it is MCR stash otherwise it's JCR stash
    let isJCR = item.underShieldText !== "Grey College MCR";

    record.name = item.StashStock.name;
    record.code = item.StashStock.manufacturerCode;
    record.quantity = item.quantity;
    record.size = translateSize(item.size);

    if(item.colourId === null) {
      record.colour = "";
    } else {
      record.colour = item.StashColour.name;
    }

    // 0 = Shield, 1 = Crest
    record.shieldOrCrest = (item.shieldOrCrest === 1 || item.shieldOrCrest === "1") ? "Crest" : "Shield";
    record.underShieldText = item.underShieldText;
    record.backPrint = "";
    record.backEmbroidery = "";
    record.legPrint = "";
    record.rightPrint = "";
    record.paid = item.ShopOrder.paid;
    record.deliveryOrCollection = item.ShopOrder.deliveryOption;

    if(item.ShopOrder.Address !== null) {
      record.recipient = item.ShopOrder.Address.recipient;
      record.line1 = item.ShopOrder.Address.line1;
      record.line2 = item.ShopOrder.Address.line2;
      record.city = item.ShopOrder.Address.city;
      record.postcode = item.ShopOrder.Address.postcode;
    } else {
      record.recipient = "";
      record.line1 = "";
      record.line2 = "";
      record.city = "";
      record.postcode = "";
    }

    if(isJCR) {
      csvRecordsJCR.push(record);
    } else {
      csvRecordsMCR.push(record);
    }
  });

  // All the non-customised has been processed
  // Now lets do the customised

  // These have the same indexes as the headings stored elsewhere
  const customisationValidChoiceHeadings = [
    "backPrint",
    "legPrint",
    "backEmbroidery",
    "backEmbroidery",
    "rightPrint"
  ];

  itemsWithCustomisation.forEach(item => {
    let record = {};
    let isJCR = item.underShieldText !== "Grey College MCR";

    record.name = item.StashStock.name;
    record.code = item.StashStock.manufacturerCode;
    record.quantity = item.quantity;
    record.size = translateSize(item.size);

    if(item.colourId === null) {
      record.colour = "";
    } else {
      record.colour = item.StashColour.name;
    }

    record.shieldOrCrest = item.shieldOrCrest === 1 ? "Crest" : "Shield";
    record.underShieldText = item.underShieldText;

    // Set them all blank and then fill the ones that matter

    record.backPrint = "";
    record.backEmbroidery = "";
    record.legPrint = "";
    record.rightPrint = "";
    record.paid = item.ShopOrder.paid;
    record.deliveryOrCollection = item.ShopOrder.deliveryOption;

    if(item.ShopOrder.Address !== null) {
      record.recipient = item.ShopOrder.Address.recipient;
      record.line1 = item.ShopOrder.Address.line1;
      record.line2 = item.ShopOrder.Address.line2;
      record.city = item.ShopOrder.Address.city;
      record.postcode = item.ShopOrder.Address.postcode;
    } else {
      record.recipient = "";
      record.line1 = "";
      record.line2 = "";
      record.city = "";
      record.postcode = "";
    }

    item.StashOrderCustomisations.forEach(customisation => {
      record[customisationValidChoiceHeadings[customisation.type]] = customisation.text;
    });

    if(isJCR) {
      csvRecordsJCR.push(record);
    } else {
      csvRecordsMCR.push(record);
    }
  });

  // Now we have these done all that is left is to make a CSV
  // for the JCR to use to give stash out
  // MCR and JCR can be merged on here to make it easier

  let ordersByUser = {};

  // Sort into users
  paidForOrders.forEach(order => {
    const username = order.ShopOrder.User.username;

    if(Object.keys(ordersByUser).includes(username)) {
      ordersByUser[username].items.push(order);
    } else {
      ordersByUser[username] = {
        items: [order],
        surname: order.ShopOrder.User.surname
      };
    }
  });

  // Keys are sorted by surname
  Object.keys(ordersByUser).sort((a, b) => {
    const aName = ordersByUser[a].surname.toLowerCase();
    const bName = ordersByUser[b].surname.toLowerCase();

    return aName > bName ? 1 : (aName < bName ? -1 : 0);
  }).forEach(username => {
    const items = ordersByUser[username].items;
    items.forEach(item => {
      let record = {};

      record.username = username;
      record.surname = item.ShopOrder.User.surname;

      record.name = item.StashStock.name;
      record.code = item.StashStock.manufacturerCode;
      record.quantity = item.quantity;
      record.size = translateSize(item.size);

      if(item.colourId === null) {
        record.colour = "";
      } else {
        record.colour = item.StashColour.name;
      }

      record.shieldOrCrest = item.shieldOrCrest === 1 ? "Crest" : "Shield";
      record.underShieldText = item.underShieldText;

      // Set them all blank and then fill the ones that matter

      record.backPrint = "";
      record.backEmbroidery = "";
      record.legPrint = "";
      record.rightPrint = "";

      item.StashOrderCustomisations.forEach(customisation => {
        record[customisationValidChoiceHeadings[customisation.type]] = customisation.text;
      });

      record.paid = item.ShopOrder.paid;
      record.deliveryOrCollection = item.ShopOrder.deliveryOption;
      record.collected = item.ShopOrder.deliveryOption === "delivery" ? "N/A" : "";

      csvRecordsChecklist.push(record);
    });
  });

  /*
  * At this point we have:
  * - All records that have been paid for
  * - Sorted into JCR / MCR
  * - Customised and Non-Customised
  * - Duplicates merged
  * We also have the checklist for JCR handout
  * Now just write them to the files.
  */

  try {
    await csvWriterJCR.writeRecords(csvRecordsJCR);
  } catch (error) {
    return res.status(500).end({ error });
  }

  try {
    await csvWriterMCR.writeRecords(csvRecordsMCR);
  } catch (error) {
    return res.status(500).json({ error });
  }

  try {
    await csvWriterChecklist.writeRecords(csvRecordsChecklist);
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res.status(200).json({ fileLocation });
});

router.get("/download/jcr/:file", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const file = req.params.file;

  if(file === undefined || file === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  const split = file.split("-");
  const millisecondsStr = split[0];

  if(new Date().getTime() > Number(millisecondsStr) + 1000 * 60 * 60) {
    return res.status(410).end();
  }

  const pathName = path.join(csvPath, `JCRStashOrders-${file}.csv`)

  return res.download(pathName, `JCRStashOrders-${file}.csv`, () => {
    res.status(404).end();
  });
});

router.get("/download/mcr/:file", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const file = req.params.file;

  if(file === undefined || file === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  const split = file.split("-");
  const millisecondsStr = split[0];

  if(new Date().getTime() > Number(millisecondsStr) + 1000 * 60 * 60) {
    return res.status(410).end();
  }

  const pathName = path.join(csvPath, `MCRStashOrders-${file}.csv`)

  return res.download(pathName, `MCRStashOrders-${file}.csv`, () => {
    res.status(404).end();
  });
});

router.get("/download/checklist/:file", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.export")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const file = req.params.file;

  if(file === undefined || file === null) {
    return res.status(400).json({ error: "Missing file" });
  }

  const split = file.split("-");
  const millisecondsStr = split[0];

  if(new Date().getTime() > Number(millisecondsStr) + 1000 * 60 * 60) {
    return res.status(410).end();
  }

  const pathName = path.join(csvPath, `Checklist-${file}.csv`)

  return res.download(pathName, `Checklist-${file}.csv`, () => {
    res.status(404).end();
  });
});

router.get("/stock/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Gets a single item by its ID
  const id = req.params.id;
  const stockItem = await StashStock.findOne({ where: { id } });

  if(stockItem === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  return res.status(200).json({ stockItem });
});

router.get("/image/:name/:itemId", async (req, res) => {

  // Gets the single image stored for each stash item
  const imageName = req.params.name;
  const id = req.params.itemId;
  const image = await StashStockImages.findOne({ where: { name:imageName, productId:id } });

  if(image === null) {
    return res.status(400).json({ error: "Image not found" });
  }

  const pathName = path.join(uploadPath, `${id}/${image.name}`);;

  return res.sendFile(pathName, function (err) {
    if (err) { res.status(err.status).end(); }
  });
});

router.get("/allImageNames/:itemId", async (req, res) => {

  // Gets all images stored for each stash item
  const id = req.params.itemId;

  if(id === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const images = await StashStockImages.findAll({ where: { productId:id } });
  if (images.length===0){
    return res.status(200).json({ message: "No images were found for specified ID", images: [] })
  }
  return res.status(200).json({ message: "Ok", images:images });
});

router.get("/allCustomisations/:itemId", async (req, res) => {

  // Gets all customisations stored for each stash item
  const id = req.params.itemId;

  if(id === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const customisations = await StashCustomisations.findAll({ where: { productId:id } });
  if (customisations.length===0){
    return res.status(200).json({ message: "No images were found for specified ID", customisations: [] })
  }
  return res.status(200).json({ message: "Ok", customisations:customisations });
});

router.get("/stockColours/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Gets a single item by its ID
  const id = req.params.id;
  const colourItem = await StashColours.findOne({ where: { id } });

  if(colourItem === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  return res.status(200).json({ colourItem });
});

router.get("/customisations/:id/:choice", async (req, res) => {

  // Gets a single customisation by its related productId and its description
  const id = req.params.id;
  const choice = req.params.choice;
  const customisation = await StashCustomisations.findOne({ where: { productId: id, customisationChoice: choice } });

  if(customisation === null) {
    return res.status(400).json({ error: "Could not find customisation option" });
  }

  return res.status(200).json({ customisation });
});

router.get("/idOfStockItem/:name/:type/:price", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Gets a single item by its ID
  const { name, type, price } = req.params;

  if (name == null || type==null || price==null){
    return res.status(400).json({ error: "Missing params" });
  }
  const newlyCreatedItem = await StashStock.findOne({ where: { name:name, type:type, price:price }});

  if(newlyCreatedItem === null) {
    return res.status(400).json({ error: "No Valid ID" });
  }
  const idOfItem = newlyCreatedItem.id.toString();
  return res.status(200).json({ idOfItem: idOfItem });
});

// Add a new customisation option for a stash item
router.post("/customisation/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const {customisationChoice, addedPriceForCustomisation } = req.body;
  const productId = req.params.id;

  if(productId == null) {
    return res.status(400).json({ error: "Missing productId" });
  }

  if(customisationChoice == null) {
    return res.status(400).json({ error: "Missing choice of customisation option" });
  }

  if(addedPriceForCustomisation == null) {
    return res.status(400).json({ error: "Missing added price" });
  }

  // const customisationValidChoices = [
  //   "Back Print: Grey College or Durham University",
  //   "Leg Print: Grey College or Durham University",
  //   "Back Embroidery: Grey College or Durham University",
  //   "Back Embroidery Personalised",
  //   "Right Breast/Small Item Personalisation"
  // ];

  // Create the new colour
  try {
    await StashCustomisations.create({ name: "new", productId, customisationChoice, addedPriceForCustomisation });
  } catch (error) {
    return res.status(500).json({ error: "Server error creating new colour"+error.toString() });
  }

  return res.status(204).end();
});

// Add a new colour name for stash
router.post("/stockColour", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const { name, colour, twoTone, secondaryColour } = req.body;

  if(name == null) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(colour == null) {
    return res.status(400).json({ error: "Missing colour" });
  }

  if(twoTone == null) {
    return res.status(400).json({ error: "Missing twoTone" });
  }

  // Create the new colour
  try {
    await StashColours.create({ name, colour, twoTone, secondaryColour });
  } catch (error) {
    return res.status(500).json({ error: "Server error creating new colour"+error.toString() });
  }

  return res.status(204).end();
});

// Add a new item for the stock
router.post("/stock", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const { name, manufacturerCode, description, available, type, customisationsAvailable, price,
    XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18 } = req.body;

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

  if ((XS==null)||(S==null)||(M==null)||(L==null)||(XL==null)||(XXL==null)||(WS8==null)||(WS10==null)||(WS12==null)||(WS14==null)||(WS16==null)||(WS18==null)){
    return res.status(400).json({ error: "Missing or incorrect sizes" });
  }

  let sizeChart = await StashSizeChart.findOne({ where: { XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18 } });
  if(sizeChart === null) {
    // Create new size chart
    try {
      await StashSizeChart.create({ XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18 });
    } catch (error) {
      return res.status(500).json({
        error: "Server error creating new item: STASHSIZECHART899",
        allData: {
          name, manufacturerCode, description, available, type, customisationsAvailable, price, XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18
        },
        sizeChart
      });
    }
    sizeChart = await StashSizeChart.findOne({ where: { XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18 } });
  }
  const sizeChartId = sizeChart.id.toString();
  //return res.status(500).json({ cId: chartId, chart: sizeChart });

  // Create the new item
  try {
    await StashStock.create({ manufacturerCode, name, description, available, type, customisationsAvailable, price, sizeChartId });
  } catch (error) {
    return res.status(500).json({
      error: "Server error creating new item: STASHSTOCK916",
      allData: {
        name, manufacturerCode, description, available, type, customisationsAvailable, price, XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18
      },
      additional: {
        sizeChartId,
        sizeChart
      }
    });
  }
  const newItem = await StashStock.findOne({ where: { manufacturerCode, name, description, available, type, customisationsAvailable, price, sizeChartId } });
  return res.status(200).json({ productId: newItem.id }).end();
});

// Add a new colour option for a particular item
router.post("/itemColour", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const { productId, colourId } = req.body;

  if(productId == null) {
    return res.status(400).json({ error: "Missing productId" });
  }

  if(colourId == null) {
    return res.status(400).json({ error: "Missing colourId" });
  }

  const itemExists = await StashItemColours.findOne({ where: { productId:productId, colourId:colourId } });

  if(!(itemExists === null)) {
    return res.status(204).json({ message: "The specified relation already exists." }).end();
  }
  // Create the new item
  try {
    await StashItemColours.create({ productId, colourId });
  } catch (error) {
    return res.status(500).json({ error: "Server error creating new colour option for item" });
  }
  return res.status(204).end();
});

// Image upload
router.post("/upload/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const productId = req.params.id;

  if(!productId) {
    return res.status(400).json({ error: "Missing productId" });
  }

  try {
    if(!req.files) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    else {
      //Use the name of the input field (i.e. "image") to retrieve the uploaded file
      let image = req.files.file;

      const imageId = await StashStockImages.findOne({ where: { productId:productId, name:image.name } });
      if (imageId !== null){
        return res.status(400).json({ message: "A file already exists under this name" });
      }

      //Use the mv() method to place the file in upload directory (i.e. "uploads")
      const pathName = path.join(uploadPath, `${productId}/${image.name}`);;
      await image.mv(pathName);

      // Create the new image-item link
      try {
        await StashStockImages.create({ productId:productId, name:image.name });
      } catch (error) {
        return res.status(500).json({ error: "Image uploaded, but server error creating new image-item link" });
      }

      //send response
      return res.status(200).json({ message: 'File has uploaded successfully',  name: image.name, mimetype: image.mimetype, size: image.size }).end();
    }
  }
  catch (err) {
    return res.status(500).json({error: err});
  }
});

// Update a customisation option for an item in the stock
router.put("/customisation/:productId/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Find the item they want to update

  const productId = req.params.productId;
  const customisationId = req.params.id;
  const stockItem = await StashCustomisations.findOne({ where: { productId: productId, id:customisationId }});

  if(stockItem === null) {
    return res.status(400).json({ error: "No matching customisation found" });
  }

  // Construct the changes to the record

  let updatedRecord = { id: customisationId, productId: productId };

  if(req.body.customisationChoice !== undefined && req.body.customisationChoice !== null) {
    updatedRecord.customisationChoice = req.body.customisationChoice;
  }

  if(req.body.addedPriceForCustomisation !== undefined && req.body.addedPriceForCustomisation !== null) {
    updatedRecord.addedPriceForCustomisation = req.body.addedPriceForCustomisation;
  }

  // Let sequelize update the record;

  try {
    await StashCustomisations.update(updatedRecord, {where: {id: req.params.id}});
  } catch (error) {
    return res.status(500).json({ error: "Server error: Unable to update the item" });
  }

  return res.status(204).end();
});

// Update an available colour
router.put("/stockColours/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Find the item they want to update

  const colourId = req.params.id;
  const colourItem = await StashColours.findOne({ where: { id: colourId }});

  if(colourItem === null) {
    return res.status(400).json({ error: "Unknown id submitted" });
  }

  // Construct the changes to the record

  let updatedRecord = {}

  if(req.body.name !== undefined && req.body.name !== null) {
    updatedRecord.name = req.body.name;
  }

  if(req.body.colour !== undefined && req.body.colour !== null) {
    updatedRecord.colour = req.body.colour;
  }

  if(req.body.twoTone !== undefined && req.body.twoTone !== null) {
    updatedRecord.twoTone = req.body.twoTone;
  }

  if(req.body.secondaryColour !== undefined && req.body.secondaryColour !== null) {
    updatedRecord.secondaryColour = req.body.secondaryColour;
  }

  // Let sequelize update the record;

  try {
    await colourItem.update(updatedRecord);
  } catch (error) {
    return res.status(500).json({ error: "Server error: Unable to update the colour" });
  }

  return res.status(204).end();
});

// Update an item in the stock
router.put("/stock/:id", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Find the item they want to update

  const stockId = req.params.id;
  const stockItem = await StashStock.findOne({ where: { id: stockId }});

  if(stockItem === null) {
    return res.status(400).json({ error: "Unknown id submitted" });
  }

  // Construct the changes to the record

  let updatedRecord = {}

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

  if(req.body.customisationsAvailable !== undefined && req.body.customisationsAvailable !== null) {
    updatedRecord.customisationsAvailable = req.body.customisationsAvailable;
  }

  if(req.body.description !== undefined && req.body.description !== null) {
    updatedRecord.description = req.body.description;
  }

  if(req.body.manufacturerCode !== undefined && req.body.manufacturerCode !== null) {
    updatedRecord.manufacturerCode = req.body.manufacturerCode;
  }
  const { XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18 } = req.body;
  if (!(XS==null)&&!(S==null)&&!(M==null)&&!(L==null)&&!(XL==null)&&!(XXL==null)&&!(WS8==null)&&!(WS10==null)&&!(WS12==null)&&!(WS14==null)&&!(WS16==null)&&!(WS18==null)){ // If we've been provided values for size
    let sizeChart = await StashSizeChart.findOne({ where: { XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18 } }); // Try to find a matching size record
    if(sizeChart === null) { // If there isn't a match...
      // Create new size chart
      try {
        await StashSizeChart.create({ XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18 });
      } catch (error) {
        return res.status(500).json({ error: "Server error creating new item" });
      }
      sizeChart = await StashSizeChart.findOne({ where: { XS, S, M, L, XL, XXL, WS8, WS10, WS12, WS14, WS16, WS18 } }); // Get Id of new chart
    }
    updatedRecord.sizeChartId = sizeChart.id.toString();
  }

  // Let sequelize update the record;

  try {
    await stockItem.update(updatedRecord);
  } catch (error) {
    return res.status(500).json({ error: "Server error: Unable to update the item" });
  }

  return res.status(204).end();
});

// Delete an image.
router.delete("/image/:imageName/:productId", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const imageName = req.params.imageName;
  const productId = req.params.productId;

  if(imageName == null) {
    return res.status(400).json({ error: "Missing image name", receivedRequest:req });
  }
  if(productId == null) {
    return res.status(400).json({ error: "Missing productId", receivedRequest:req });
  }

  const imageRecord = await StashStockImages.findOne({ where: { name:imageName, productId:productId } });

  if(imageRecord === null) {
    return res.status(500).json({ error: "Entry not in table", message: imageName+" "+productId });
  }
  try {
    await StashStockImages.destroy({ where: { id:imageRecord.id } });
  } catch (error) {
    return res.status(500).json({ error: "Server error deleting image-item link", messg:error.toString() });
  }

  return res.status(204).end();
});

// Delete a customisation option.
router.delete("/customisation/:choice/:productId", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const customisationChoice = req.params.choice;
  const productId = req.params.productId;

  if(customisationChoice == null) {
    return res.status(400).json({ error: "Missing customisation choice", receivedRequest:req });
  }
  if(productId == null) {
    return res.status(400).json({ error: "Missing productId", receivedRequest:req });
  }

  const customisationRecord = await StashCustomisations.findOne({ where: { customisationChoice:customisationChoice, productId:productId } });

  if(customisationRecord === null) {
    return res.status(500).json({ error: "Entry not in table" });
  }
  try {
    await StashCustomisations.destroy({ where: { id:customisationRecord.id } });
  } catch (error) {
    return res.status(500).json({ error: "Server error deleting customisation", messg:error.toString() });
  }

  return res.status(204).end();
});

// Delete a colour option for a particular item.
router.delete("/itemColour/:productId:colourId", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const { productId, colourId } = req.params;

  if(productId == null) {
    return res.status(400).json({ error: "Missing productId", receivedRequest:req });
  }

  if(colourId == null) {
    return res.status(400).json({ error: "Missing colourId" });
  }

  const colourItem = await StashItemColours.findOne({ where: { productId:productId, colourId:colourId } });

  if(colourItem === null) {
    return res.status(200).json({ error: "Entry not in table" });
  }
  const id = colourItem.id;
  try {
    await StashItemColours.destroy({ where: { id:id } });
  } catch (error) {
    return res.status(500).json({ error: "Server error creating new colour option for item", messg:error.toString() });
  }

  return res.status(204).end();
});

// Delete an item.
router.delete("/stock/:productId", async (req, res) => {
  // Admin only
  const { user } = req.session;

  if(!hasPermission(req.session, "stash.stock.edit")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Validate the details briefly
  const productId = req.params.productId;

  if(productId == null) {
    return res.status(400).json({ error: "Missing productId", receivedRequest:req });
  }

  const item = await StashStock.findOne({ where: { id:productId } });

  if(item === null) {
    return res.status(200).json({ error: "Entry not in table" });
  }
  const id = item.id;
  try {
    await StashStock.destroy({ where: { id:id } });
  } catch (error) {
    return res.status(500).json({ error: "Server error deleting item", messg:error.toString() });
  }

  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
