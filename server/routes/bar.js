// Get express
const express = require("express");
const router = express.Router();
// The database models
const { User, Permission, PermissionLink, BarDrinkType, BarDrinkSize, BarBaseDrink, BarDrink, BarMixer, BarOrder, BarOrderContent, PersistentVariable, BarBooking, BarBookingGuest, BarCordial } = require("../database.models.js");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const mailer = require("../utils/mailer");
const dateFormat = require("dateformat");

router.get("/", async (req, res) => {
  // Don't need to be a JCR member for this

  // Find all of the base drinks
  let baseDrinks;

  try {
    baseDrinks = await BarBaseDrink.findAll({
      attributes: [ "id", "name", "typeId", "available" ],
      include: [ BarDrinkType ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the base drinks" });
  }

  let barOpenRecord;

  try {
    barOpenRecord = await PersistentVariable.findOne({ where: { key: "BAR_OPEN" }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the status of the bar" });
  }

  return res.status(200).json({ baseDrinks, open: barOpenRecord.booleanStorage });
});

router.post("/admin/type", async (req, res) => {
  // Creates a new drink type
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Basic validation
  const { name, allowsMixer, allowsCordial } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(allowsMixer === undefined || allowsMixer === null) {
    return res.status(400).json({ error: "Missing allowsMixer" });
  }

  if(allowsCordial === undefined || allowsCordial === null) {
    return res.status(400).json({ error: "Missing allowsCordial" });
  }

  // Make the new type and send it back
  let type;

  try {
    type = await BarDrinkType.create({ name, allowsMixer, allowsCordial });
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
    console.log(error)
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

router.post("/admin/mixer", async (req, res) => {
  // Creates a new mixer
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Basic validation
  const { name, available, price: priceUnchecked } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(available === undefined || available === null) {
    return res.status(400).json({ error: "Missing available" });
  }

  if(priceUnchecked === undefined || priceUnchecked === null) {
    return res.status(400).json({ error: "Missing price" });
  }

  let price;

  try {
    price = parseFloat(priceUnchecked);
  } catch (error) {
    return res.status(400).json({ error: "Non-numeric price" });
  }

  if(isNaN(price)) {
    return res.status(400).json({ error: "Non-numeric price - NaN" });
  }

  if(price <= 0) {
    return res.status(400).json({ error: "Positive prices only" });
  }

  // Make the new type and send it back
  let mixer;

  try {
    mixer = await BarMixer.create({ name, available, price });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the mixer" });
  }

  return res.status(200).json({ mixer });
});

router.get("/admin/mixers", async (req, res) => {
  // Lists the sizes of drinks
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Just find them all and send it back
  let mixers;

  try {
    mixers = await BarMixer.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the mixers" });
  }

  return res.status(200).json({ mixers });
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
    baseDrinks = await BarBaseDrink.findAll({
      include: [ BarDrinkType, {
        model: BarDrink,
        include: [ BarDrinkSize ]
      } ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the base drinks" });
  }

  return res.status(200).json({ sizes, types, baseDrinks });

});

router.post("/admin/drink", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, description: descriptionUnchecked, sizeCheckboxes, prices, type, available } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  let description = descriptionUnchecked;

  if(descriptionUnchecked === undefined || descriptionUnchecked === null) {
    description = "";
  }

  if(sizeCheckboxes === undefined || sizeCheckboxes === null) {
    return res.status(400).json({ error: "Missing sizeCheckboxes" });
  }

  if(prices === undefined || prices === null) {
    return res.status(400).json({ error: "Missing prices" });
  }

  if(type === undefined || type === null || type.length === 0) {
    return res.status(400).json({ error: "Missing type" });
  }

  if(available === undefined || available === null) {
    return res.status(400).json({ error: "Missing available" });
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
    baseDrink = await BarBaseDrink.create({ name, description, typeId: typeRecord.id, available });
  } catch (error) {
    console.log(error)
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

  let completeRecord;

  try {
    completeRecord = await BarBaseDrink.findOne({
      where: { id: baseDrink.id },
      include: [ BarDrinkType, {
        model: BarDrink,
        include: [ BarDrinkSize ]
      } ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the record in the database" });
  }

  return res.status(200).json({ newDrink: completeRecord });
});

router.get("/drink/:id", async (req, res) => {
  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  let drink;

  try {
    drink = await BarBaseDrink.findOne({
      where: { id },
      include: [
        {
          model: BarDrink,
          attributes: [ "id", "sizeId", "price" ],
          include: [
            {
              model: BarDrinkSize,
              attributes: [ "id", "name" ]
            }
          ]
        },
        {
          model: BarDrinkType,
          attributes: [ "name", "allowsMixer", "allowsCordial" ]
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the drink" });
  }

  if(drink === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  let mixers = [];

  if(drink.BarDrinkType.allowsMixer) {
    try {
      mixers = await BarMixer.findAll();
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the mixers" });
    }
  }

  let cordials = [];

  if(drink.BarDrinkType.allowsCordial) {
    try {
      cordials = await BarCordial.findAll();
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the cordials" });
    }
  }

  return res.status(200).json({ drink, mixers, cordials });
})

router.post("/order", async (req, res) => {
  // Place an order with the bar
  // No need to be a member
  const { user } = req.session;

  const { tableNumber: unparsedTableNumber, items } = req.body;

  if(unparsedTableNumber === undefined || unparsedTableNumber === null) {
    return res.status(400).json({ error: "Missing tableNumber" });
  }

  let tableNumber;

  try {
    tableNumber = parseInt(unparsedTableNumber);
  } catch (error) {
    return res.status(500).json({ error: "tableNumber must be an integer" });
  }

  if(isNaN(tableNumber)) {
    return res.status(500).json({ error: "tableNumber must be an integer; NaN" });
  }

  if(items === undefined || items === null || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Missing items" });
  }

  let barOpenRecord;

  try {
    barOpenRecord = await PersistentVariable.findOne({ where: { key: "BAR_OPEN" }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to check if the bar is open" });
  }

  if(!barOpenRecord.booleanStorage) {
    return res.status(400).json({ closed: true, error: "The bar is currently closed for orders." });
  }

  // Could validate the table number is in a range but really doesn't matter at the end of the day
  // Make the overarching order

  let overallOrder;

  try {
    overallOrder = await BarOrder.create({ userId: user.id, tableNumber });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create a new order" });
  }

  if(overallOrder === null) {
    return res.status(500).json({ error: "No order record" });
  }

  // Now make the order contents

  let orderContents = [];
  let totalPrice = 0;

  for(const item of items) {
    // First verify the drink
    let drink;

    try {
      drink = await BarDrink.findOne({
        where: { id: item.drinkId },
        include: [
          {
            model: BarBaseDrink,
            attributes: [ "name", "available" ]
          },
          {
            model: BarDrinkSize,
            attributes: [ "name" ]
          }
        ]
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the drink from the database" });
    }

    if(drink === null) {
      return res.status(400).json({ error: "Invalid drinkId" });
    }

    if(!drink.BarBaseDrink.available) {
      return res.status(400).json({ error: `${drink.BarBaseDrink.name} is out of stock` });
    }

    let mixer = null;

    // Then verify the mixer

    if(item.mixerId !== null && item.mixerId !== -1 && item.mixerId !== "-1") {
      try {
        mixer = await BarMixer.findOne({
          where: { id: item.mixerId }
        })
      } catch (error) {
        return res.status(500).json({ error: "Unable to get the mixer from the database" });
      }

      if(mixer === null) {
        return res.status(400).json({ error: "Invalid mixerId" });
      }

      if(!mixer.available) {
        return res.status(400).json({ error: `${mixer.name} is out of stock` });
      }
    }

    // Then verify the cordial

    let cordial = null;

    if(item.cordialId !== null && item.cordialId !== -1 && item.cordialId !== "-1") {
      try {
        cordial = await BarCordial.findOne({
          where: { id: item.cordialId }
        })
      } catch (error) {
        return res.status(500).json({ error: "Unable to get the cordial from the database" });
      }

      if(cordial === null) {
        return res.status(400).json({ error: "Invalid cordialId" });
      }

      if(!cordial.available) {
        return res.status(400).json({ error: `${cordial.name} is out of stock` });
      }
    }

    let realQuantity;

    try {
      realQuantity = parseInt(item.quantity);
    } catch (error) {
      return res.status(400).json({ error: "Quantity must be an integer" });
    }

    if(isNaN(realQuantity)) {
      return res.status(400).json({ error: "Quantity must be an integer - NaN" });
    }

    let perItemPrice = 0;

    perItemPrice += Number(drink.price);

    if(mixer !== null) {
      perItemPrice += Number(mixer.price);
    }

    if(cordial !== null) {
      perItemPrice += Number(cordial.price);
    }

    let orderPart;

    try {
      orderPart = await BarOrderContent.create({
        orderId: overallOrder.id,
        drinkId: drink.id,
        mixerId: mixer === null ? null : mixer.id,
        cordialId: cordial === null ? null : cordial.id,
        quantity: realQuantity
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to make the order part" });
    }

    totalPrice += perItemPrice * realQuantity;
    orderContents.push({ id: orderPart.id, drink, mixer, cordial, perItemPrice, realQuantity });
  }

  overallOrder.totalPrice = totalPrice;

  try {
    await overallOrder.save();
  } catch (error) {
    return res.status(500).json({ error: "Error setting the price" });
  }

  // Prepare the data to send over the socket
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();

  const contents = orderContents.map(item => {
    return {
      id: item.id,
      name: item.drink.BarBaseDrink.name,
      size: item.drink.BarDrinkSize.name,
      mixer: item.mixer === null ? null : item.mixer.name,
      cordial: item.cordial === null ? null : item.cordial.name,
      quantity: item.realQuantity,
      completed: false
    };
  });

  // Send it to the live admin page
  req.io.to("barOrderClients").emit("barNewOrder", {
    id: overallOrder.id,
    orderedAt: overallOrder.createdAt,
    orderedBy: `${firstName} ${lastName}`,
    email: user.email,
    paid: false,
    totalPrice,
    tableNumber,
    contents
  });

  // Send the confirmation email to the user
  const customerEmail = createBarCustomerEmail(user, orderContents, totalPrice, tableNumber);
  mailer.sendEmail(user.email, `Bar Order Confirmation`, customerEmail);

  return res.status(200).json({ orderContents, totalPrice });
});

router.delete("/drink/:id", async (req, res) => {
  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  let drinkRecord;

  try {
    drinkRecord = await BarBaseDrink.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the drink from the database" });
  }

  if(drinkRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    await drinkRecord.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the drink" });
  }

  return res.status(204).end();
});

router.post("/mixer/update/", async (req, res) => {
  // Change details about a mixer
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, available, price } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(available === undefined || available === null) {
    return res.status(400).json({ error: "Missing available" });
  }

  if(price === undefined || price === null) {
    return res.status(400).json({ error: "Missing price" });
  }

  let mixerRecord;

  try {
    mixerRecord = await BarMixer.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the mixer from the database" });
  }

  if(mixerRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  mixerRecord.name = name;
  mixerRecord.price = price;
  mixerRecord.available = available;

  try {
    await mixerRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the mixer in the database" });
  }

  return res.status(204).end();
});

router.delete("/mixer/:id", async (req, res) => {
  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  let mixerRecord;

  try {
    mixerRecord = await BarMixer.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the mixer from the database" });
  }

  if(mixerRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    await mixerRecord.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the mixer" });
  }

  return res.status(204).end();
});

router.post("/drink/update", async (req, res) => {
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, description: descriptionUnchecked, prices: pricesUnparsed, typeId, available } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  let description = descriptionUnchecked;

  if(descriptionUnchecked === undefined || descriptionUnchecked === null) {
    description = "";
  }

  if(pricesUnparsed === undefined || pricesUnparsed === null) {
    return res.status(400).json({ error: "Missing prices" });
  }

  const prices = JSON.parse(pricesUnparsed);

  if(typeId === undefined || typeId === null) {
    return res.status(400).json({ error: "Missing typeId" });
  }

  if(available === undefined || available === null) {
    return res.status(400).json({ error: "Missing available" });
  }

  let baseDrink;

  try {
    baseDrink = await BarBaseDrink.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the base drink" });
  }

  if(baseDrink === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  baseDrink.name = name;
  baseDrink.description = description;
  baseDrink.typeId = typeId;
  baseDrink.available = available;

  try {
    await baseDrink.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save the base drink" });
  }

  let drinks = [];

  for(const drinkId in prices) {
    let drinkRecord;

    console.log(drinkId, prices[drinkId]);

    try {
      drinkRecord = await BarDrink.findOne({ where: { sizeId: drinkId, baseDrinkId: id }});
    } catch (error) {
      return res.status(500).json({ error: "Unable to get the size" });
    }

    drinkRecord.price = prices[drinkId];

    try {
      await drinkRecord.save();
    } catch (error) {
      return res.status(500).json({ error: "Unable to save the drink record" });
    }
  }

  return res.status(204).end();
});

router.post("/size/update/", async (req, res) => {
  // Change details about a mixer
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null) {
    return res.status(400).json({ error: "Missing name" });
  }

  let sizeRecord;

  try {
    sizeRecord = await BarDrinkSize.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the size from the database" });
  }

  if(sizeRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  sizeRecord.name = name;

  try {
    await sizeRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the size in the database" });
  }

  return res.status(204).end();
});

router.post("/type/update/", async (req, res) => {
  // Change details about a mixer
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, allowsMixer, allowsCordial } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(allowsMixer === undefined || allowsMixer === null) {
    return res.status(400).json({ error: "Missing allowsMixer" });
  }

  if(allowsCordial === undefined || allowsCordial === null) {
    return res.status(400).json({ error: "Missing allowsCordial" });
  }

  let typeRecord;

  try {
    typeRecord = await BarDrinkType.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the mixer from the database" });
  }

  if(typeRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  typeRecord.name = name;
  typeRecord.allowsMixer = allowsMixer;
  typeRecord.allowsCordial = allowsCordial;

  try {
    await typeRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the type in the database" });
  }

  return res.status(204).end();
});

router.get("/book/available", async (req, res) => {
  const { user } = req.session;
  const daysInAdvance = 3;

  let availableInfo = {};

  // Collect information about available tables
  for(let advDay = 0; advDay <= daysInAdvance; advDay++) {
    // The date to check is advDays in the future
    // We need it to be at 00:00:00 so use some formatting to get there
    let dayDate = new Date();
    dayDate.setDate(dayDate.getDate() + advDay);
    dayDate = dateFormat(dayDate, "yyyy-mm-dd");
    dayDate = Date.parse(dayDate);

    const baseDate = new Date(dayDate);

    const dayNumber = baseDate.getDay(); //dayDate.getDay();
    // 0 = Sunday, 2 = Tuesday, 4 = Thursday

    const blockedDays = [0, 2, 4];

    // Change doesn't apply until 10th May
    if(baseDate >= new Date("2021-05-10")) {
      if(blockedDays.includes(dayNumber)) {
        availableInfo[dateFormat(dayDate, "yyyy-mm-dd")] = {
          availableCount: 0,
          bookingId: null,
          open: false
        };

        continue;
      }
    }

    // Get all the bookings for the day
    let bookings;

    try {
      bookings = await BarBooking.findAll({ where: { date: dayDate } });
    } catch (error) {
      return res.status(500).json({ error: "Unable to check the existing bookings" });
    }

    // Check if they have a booking already
    let myBooking;

    try {
      myBooking = await BarBooking.findOne({ where: { userId: user.id, date: dayDate } });
    } catch (error) {
      return res.status(500).json({ error: "Unable to check your bookings" });
    }

    // 20 tables in total
    availableInfo[dateFormat(dayDate, "yyyy-mm-dd")] = {
      availableCount: 20 - bookings.length,
      bookingId: myBooking === null ? null : myBooking.id,
      open: true
    };
  }

  // Send the info back
  return res.status(200).json({ availableInfo });
});

router.post("/book", async (req, res) => {
  const { user } = req.session;
  const { date: unparsedDate, guestNames: unparsedGuestNames } = req.body;

  // Parse the date they want to book for
  if(unparsedDate === undefined || unparsedDate === null) {
    return res.status(400).json({ error: "Missing date" });
  }

  const date = Date.parse(unparsedDate);

  // Handle the guest names
  if(unparsedGuestNames === undefined || unparsedGuestNames === null || unparsedGuestNames.length === 0) {
    return res.status(400).json({ error: "Missing guestNames" });
  }

  // Filter empty names and limit the size of each name
  const guestNames = unparsedGuestNames.filter(name => name !== undefined && name !== null && name.length !== 0).map(name => name.substring(0, 255));

  if(guestNames.length === 0) {
    return res.status(400).json({ error: "Missing guestNames (post-filter)" });
  }

  // Check there is space available
  let bookings;

  try {
    bookings = await BarBooking.findAll({ where: { date } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check bookings for the night" });
  }

  // No space :(
  if(bookings.length >= 20) {
    return res.status(400).json({ error: "There are no more tables available for this night" });
  }

  // Check if they have a booking
  let booking;

  try {
    booking = await BarBooking.findOne({ where: { userId: user.id, date }});
  } catch (error) {
    return res.status(500).json({ error: "Unable to check if user already has a booking for the night" });
  }

  // User already has a booking for this night
  if(booking !== null) {
    return res.status(400).json({ error: "You already have a table booked" });
  }

  // Make the booking
  let newBooking;

  try {
    newBooking = await BarBooking.create({ userId: user.id, date });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create booking" });
  }

  // Add the guests

  for(const guestName of guestNames) {
    try {
      await BarBookingGuest.create({ bookingId: newBooking.id, name: guestName });
    } catch (error) {
      return res.status(500).json({ error: "Unable to add guest to booking" });
    }
  }

  // Email confirmation
  const customerEmail = createBarBookingEmail(user, dateFormat(date, "dd/mm/yyyy"), guestNames);
  mailer.sendEmail(user.email, `Bar Table Booking`, customerEmail);

  // Return the ID
  return res.status(200).json({ bookingId: newBooking.id });
});

router.post("/book/cancel", async (req, res) => {
  const { user } = req.session;
  const { id } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing ID" });
  }

  let booking;

  try {
    booking = await BarBooking.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to find the booking" });
  }

  if(booking === null) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  if(booking.userId !== user.id) {
    return res.status(403).json({ error: "You cannot delete another user's booking" });
  }

  // Remove the guests
  try {
    await BarBookingGuest.destroy({ where: { bookingId: booking.id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the booking guests" });
  }

  const date = booking.date;

  try {
    await BarBooking.destroy({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the booking" });
  }

  const cancelEmail = createBarCancelEmail(user, dateFormat(date, "dd/mm/yyyy"));
  mailer.sendEmail(user.email, "Bar Booking Cancelled", cancelEmail);

  return res.status(204).end();
});

router.post("/book/admin/view", async(req, res) => {
  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { date: unparsedDate } = req.body;

  if(unparsedDate === undefined || unparsedDate === null) {
    return res.status(400).json({ error: "Missing date" });
  }

  const date = Date.parse(unparsedDate);

  let bookings;

  try {
    bookings = await BarBooking.findAll({
      where: { date },
      include: [ User, BarBookingGuest ]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the bookings" });
  }

  return res.status(200).json({ bookings });
});

router.post("/admin/cordial", async (req, res) => {
  // Creates a new cordial
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Basic validation
  const { name, available, price: priceUnchecked } = req.body;

  if(name === undefined || name === null || name.length === 0) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(available === undefined || available === null) {
    return res.status(400).json({ error: "Missing available" });
  }

  if(priceUnchecked === undefined || priceUnchecked === null) {
    return res.status(400).json({ error: "Missing price" });
  }

  let price;

  try {
    price = parseFloat(priceUnchecked);
  } catch (error) {
    return res.status(400).json({ error: "Non-numeric price" });
  }

  if(isNaN(price)) {
    return res.status(400).json({ error: "Non-numeric price - NaN" });
  }

  if(price <= 0) {
    return res.status(400).json({ error: "Positive prices only" });
  }

  // Make the new type and send it back
  let cordial;

  try {
    cordial = await BarCordial.create({ name, available, price });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create the cordial" });
  }

  return res.status(200).json({ cordial });
});

router.get("/admin/cordials", async (req, res) => {
  // Lists the sizes of drinks
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  // Just find them all and send it back
  let cordials;

  try {
    cordials = await BarCordial.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to list the cordials" });
  }

  return res.status(200).json({ cordials });
});

router.post("/cordial/update/", async (req, res) => {
  // Change details about a cordial
  const { user } = req.session;

  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, available, price } = req.body;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  if(name === undefined || name === null) {
    return res.status(400).json({ error: "Missing name" });
  }

  if(available === undefined || available === null) {
    return res.status(400).json({ error: "Missing available" });
  }

  if(price === undefined || price === null) {
    return res.status(400).json({ error: "Missing price" });
  }

  let cordialRecord;

  try {
    cordialRecord = await BarCordial.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the cordial from the database" });
  }

  if(cordialRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  cordialRecord.name = name;
  cordialRecord.price = price;
  cordialRecord.available = available;

  try {
    await cordialRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to update the cordial in the database" });
  }

  return res.status(204).end();
});

router.delete("/cordial/:id", async (req, res) => {
  // Must have permission
  if(!hasPermission(req.session, "bar.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.params;

  if(id === undefined || id === null) {
    return res.status(400).json({ error: "Missing id" });
  }

  let cordialRecord;

  try {
    cordialRecord = await BarCordial.findOne({
      where: { id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the cordial from the database" });
  }

  if(cordialRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    await cordialRecord.destroy();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete the cordial" });
  }

  return res.status(204).end();
});

const createBarCustomerEmail = (user, orderContents, totalPrice, tableNumber) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your order has been confirmed and sent to the bar. A member of staff will come and take payment from you at table ${tableNumber} soon.</p>`);
  message.push(`<p>Your confirmed order is:</p>`);
  message.push(`<ul>`);

  orderContents.forEach(item => {
    message.push(`<li>${item.realQuantity} x ${item.drink.BarBaseDrink.name} (${item.drink.BarDrinkSize.name}${item.mixer === null ? "" : ", Mixer: " + item.mixer.name}${item.cordial === null ? "" : ", Cordial: " + item.cordial.name})</li>`);
  });

  message.push(`</ul>`);
  message.push(`<p>Total: £${totalPrice.toFixed(2)}`);
  message.push(`<p>Thank you!</p>`);

  return message.join("");
}

const createBarBookingEmail = (user, date, guestNames) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your bar table booking has been confirmed for ${date}.</p>`);

  if(guestNames.length !== 0) {
    message.push(`<p>Your confirmed guests are:</p>`);
    message.push(`<ul>`);

    guestNames.forEach(name => {
      message.push(`<li>${name}</li>`)
    });

    message.push(`</ul>`);
  }

  message.push(`<p>When you are in the bar please use the drink order QR code on your table to take you to a website where you can order your drinks. Drinks will then be brought to your table by a member of our bar staff. Please note that last orders will be called earlier than usual to ensure you have time to drink up before closing.</p>`)
  message.push(`<p>To ensure the best experience for all of us we ask you also to please respect the rules in place and stay at your tables instead of mingling between tables. Quite simply, if the bar is found to not be meeting COVID regulations then we will be forced to shut down which is not in any of our best interests.</p>`);
  message.push(`<p>As per University Regulations we are required to carry out <span className="font-semibold">track and trace</span> and also ask for proof of a <span className="font-semibold">negative LFT test within the last 4 days.</span></p>`);

  message.push(`<p>Thank you!</p>`);

  return message.join("");
}

const createBarCancelEmail = (user, date) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your bar table booking for ${date} has been cancelled.</p>`);

  return message.join("");
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
