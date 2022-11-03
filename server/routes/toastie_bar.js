// Get express
const express = require("express");
const router = express.Router();
// The database models
const { 
  User, Permission, PermissionLink, PersistentVariable,
  ToastieBarBread, ToastieBarFilling, ToastieBarMilkshake, ToastieBarSpecial, ToastieBarSpecialFilling, ToastieBarAdditionalStockType, ToastieBarAdditionalStock,
  ToastieBarOrder, ToastieBarComponentToastie, ToastieBarComponentToastieFilling, ToastieBarComponentSpecial, ToastieBarComponentMilkshake, ToastieBarComponentAdditionalItem
} = require("../database.models.js");
const { Op } = require("sequelize");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");
const { makeDisplayName, processToastieOrder } = require("../utils/helper.js");
const { v4: uuidv4 } = require('uuid');
const mailer = require("../utils/mailer");
const dateFormat = require("dateformat");

// Get all stock items that are not deleted including breads, fillings, milkshake, specials and additional items 
router.get("/stock/:admin?", async (req, res) => {
  let { admin } = req.params;
  let adminMode = false;

  if(admin === "admin") {
    if(!req.session.user || !req.cookies.user_sid) {
      return res.status(401).json({ error: "Not logged in" });
    }
  
    if(!hasPermission(req.session, "toasties.manage")) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }

    adminMode = true;
  } 

  // Bread
  let breads;

  try {
    breads = await ToastieBarBread.findAll({
      where: {
        deleted: false
      },
      attributes: ["id", "name", "available", "pricePerUnit", "updatedAt"]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to retrieve breads" });
  }

  // Fillings
  let fillings;

  try {
    fillings = await ToastieBarFilling.findAll({
      where: {
        deleted: false
      },
      attributes: ["id", "name", "available", "pricePerUnit", "updatedAt"]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to retrieve fillings" });
  }

  // Milkshake
  let milkshakes;

  try {
    milkshakes = await ToastieBarMilkshake.findAll({
      where: {
        deleted: false
      },
      attributes: ["id", "name", "available", "pricePerUnit", "updatedAt"]
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to retrieve milkshakes" });
  }

  // Additional Stock Types
  let additionalStockTypes;

  try {
    additionalStockTypes = await ToastieBarAdditionalStockType.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to retrieve additional stock types" });
  }

  // Process the items for each type into their own arrays
  let additionalStock = {};

  // If there exists options
  if(additionalStockTypes.length !== 0) {
    // Put them in the map
    for(const additionalStockType of additionalStockTypes) {
      const { id, name } = additionalStockType;
      let additionalStockRecords;

      // Get the items belonging to the type
      try {
        additionalStockRecords = await ToastieBarAdditionalStock.findAll({
          where: {
            typeId: id,
            deleted: false
          },
          attributes: ["id", "name", "available", "typeId", "pricePerUnit", "updatedAt"],
        })
      } catch (error) {
        return res.status(500).json({ error: `Unable to get additional stock items for type ID ${id}`});
      }

      // Don't bother if there are no records for the type
      if(additionalStockRecords.length === 0) {
        continue;
      }

      additionalStock[name] = additionalStockRecords;
    }
  }

  // Specials
  const now = new Date();
  let rawSpecials;

  const specialWhere = adminMode ? {
    deleted: false
  } : {
    deleted: false,
    startDate: {
      [Op.lte]: now
    },
    endDate: {
      [Op.gte]: now 
    }
  };

  try {
    rawSpecials = await ToastieBarSpecial.findAll({
      where: specialWhere,
      include: [
        {
          model: ToastieBarSpecialFilling,
          include: [{
            model: ToastieBarFilling,
            attributes: ["id", "name", "available"]
          }]
        }
      ],
      attributes: ["id", "name", "description", "priceWithoutBread", "startDate", "endDate", "updatedAt"]
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Unable to retrieve specials" });
  }

  let specials = [];

  // Process the specials into a better format than the raw results
  // Also checks that their fillings are available
  for(const special of rawSpecials) {
    const { id, name, description, startDate, endDate, priceWithoutBread, updatedAt } = special;
    let processedSpecial = { id, name, description, startDate, endDate, priceWithoutBread, updatedAt };
    let fillings = [];
    let available = true;

    // ToastieBarSpecialFilling is the join of the many-to-many relationship
    for(const fillingLink of special.ToastieBarSpecialFillings) {
      const filling = fillingLink.ToastieBarFilling;
      // Require all fillings to be available for the special to be available
      // Decided not to check for deleted as they may use a special to get rid of some stock for a special filling
      available = available && filling.available;// && !filling.deleted;

      // Price of fillings is already accounted for in the special setup
      fillings.push(filling.name);
    }

    processedSpecial.fillings = fillings;
    processedSpecial.available = available;

    specials.push(processedSpecial);
  }

  // Send the results back
  return res.status(200).json({
    breads, fillings, milkshakes, specials, additionalStock
  })
});

// Place an order
router.post("/order", async (req, res) => {
  // See ../examples/toastie_order.json for an example structure
  // Note that customer is only ever checked if the user is not logged in

  // First, check that the Toastie Bar is actually open
  let openRecord;

  try {
    openRecord = await PersistentVariable.findOne({
      where: {
        key: "TOASTIE_BAR_OPEN"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check open status" });
  }
  
  if(!openRecord.booleanStorage) {
    return res.status(400).json({ error: "The Toastie Bar is no longer accepting orders" });
  }

  const { order } = req.body;

  // Verify that an order was sent in (its most basic form)
  if(order === undefined) {
    return res.status(400).json({ error: "No order received" });
  }

  let userId = null;

  let externalCustomerName = null;
  let externalCustomerUsername = null;
  let verificationId = null;

  // Next, check if they are logged in or not
  // Logged in if they have a user session and cookie
  if(req.session.user && req.cookies.user_sid && req.session.user.id) {
    userId = req.session.user.id;
  } else {
    // Check that a customer child exists
    if(order.customer === undefined) {
      return res.status(400).json({ error: "Missing customer details" });
    }

    externalCustomerName = order.customer.name;
    externalCustomerUsername = order.customer.username;

    if(externalCustomerName === undefined || externalCustomerName === null || externalCustomerName.length === 0) {
      return res.status(400).json({ error: "Missing customer name" });
    }

    if(externalCustomerUsername === undefined || externalCustomerUsername === null || externalCustomerUsername.length === 0) {
      return res.status(400).json({ error: "Missing customer username" });
    }

    // Username must be 6 characters long
    externalCustomerUsername = externalCustomerUsername.trim();
    if(externalCustomerUsername.length !== 6) {
      return res.status(400).json({ error: "Invalid username" });
    }

    // Generate a verification ID for their verification URL
    verificationId = uuidv4();
  }

  // Now we have customer information, move on to the order
  // Check they sent order content
  if(order.content === undefined) {
    return res.status(400).json({ error: "Missing order content" });
  }

  const { toasties, milkshakeIds, specials, additionalIds } = order.content;

  // Check these all exist
  if(toasties === undefined) {
    return res.status(400).json({ error: "Missing toastie order content" });
  }
  
  if(milkshakeIds === undefined) {
    return res.status(400).json({ error: "Missing milkshake order content" });
  }
  
  if(specials === undefined) {
    return res.status(400).json({ error: "Missing special order content" });
  }
  
  if(additionalIds === undefined) {
    return res.status(400).json({ error: "Missing additional order content" });
  }
  
  // Make sure they have ordered something
  let nonEmptyOrder = false;

  // We first need to validate the order contents before actually adding it to the database
  // Start with the toasties
  for(const toastie of toasties) {
    // Validate bread record
    let breadRecord;

    try {
      // Not too concerned with attributes here as not sending this to the user
      breadRecord = await ToastieBarBread.findOne({ 
        where: { 
          id: toastie.breadId
        } 
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to fetch the bread record" });
    }

    if(breadRecord === null) {
      return res.status(400).json({ error: "Invalid breadId" });
    }

    if(!breadRecord.available || breadRecord.deleted) {
      return res.status(400).json({ error: `Selected bread '${breadRecord.name}' is unavailable`});
    }

    if(toastie.fillingIds === undefined || toastie.fillingIds.length === 0) {
      return res.status(400).json({ error: "Missing fillings" });
    }

    // Validate fillings
    for(const fillingId of toastie.fillingIds) {
      let fillingRecord;

      try {
        fillingRecord = await ToastieBarFilling.findOne({ 
          where: { 
            id: fillingId
          } 
        });
      } catch (error) {
        return res.status(500).json({ error: "Unable to fetch the filling record" });
      }

      if(fillingRecord === null) {
        return res.status(400).json({ error: "Invalid fillingId" });
      }

      if(!fillingRecord.available || fillingRecord.deleted) {
        return res.status(400).json({ error: `Selected filling '${fillingRecord.name}' is unavailable`});
      }
    }

    // Toastie is valid if we make it to here!
    nonEmptyOrder = true;
  }

  // Now validate the milkshakes
  for(const milkshakeId of milkshakeIds) {
    // Validate milkshake record
    let milkshakeRecord;

    try {
      // Not too concerned with attributes here as not sending this to the user
      milkshakeRecord = await ToastieBarMilkshake.findOne({ 
        where: { 
          id: milkshakeId
        } 
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to fetch the milkshake record" });
    }

    if(milkshakeRecord === null) {
      return res.status(400).json({ error: "Invalid milkshake id" });
    }

    if(!milkshakeRecord.available || milkshakeRecord.deleted) {
      return res.status(400).json({ error: `Selected milkshake '${milkshakeRecord.name}' is unavailable`});
    }

    // Milkshake is valid if we make it here!
    nonEmptyOrder = true;
  }

  // Now validate the specials
  const now = new Date();

  for(const special of specials) {
    // Validate bread record
    let breadRecord;

    try {
      // Not too concerned with attributes here as not sending this to the user
      breadRecord = await ToastieBarBread.findOne({ 
        where: { 
          id: special.breadId
        } 
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to fetch the bread record" });
    }

    if(breadRecord === null) {
      return res.status(400).json({ error: "Invalid breadId" });
    }

    if(!breadRecord.available || breadRecord.deleted) {
      return res.status(400).json({ error: `Selected bread '${breadRecord.name}' is unavailable`});
    }

    // Validate the special, will need to check fillings
    let specialRecord;

    try {
      // Not too concerned with attributes here as not sending this to the user
      specialRecord = await ToastieBarSpecial.findOne({ 
        where: { 
          id: special.specialId,
          startDate: {
            [Op.lte]: now
          },
          endDate: {
            [Op.gte]: now 
          }
        },
        include: [
          {
            model: ToastieBarSpecialFilling,
            include: [ ToastieBarFilling ]
          }
        ],
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to fetch the special record" });
    }

    if(specialRecord === null) {
      return res.status(400).json({ error: "Invalid specialId or the special has expired" });
    }

    for(const fillingLink of specialRecord.ToastieBarSpecialFillings) {
      const filling = fillingLink.ToastieBarFilling;
      // Require all fillings to be available for the special to be available
      // Decided not to check for deleted as they may use a special to get rid of some stock for a special filling
      if(!filling.available) {
        return res.status(400).json({ error: `Selected special '${specialRecord.name}' is unavailable as filling ${filling.name} is unavailable` });
      }
    }

    // Special is valid if we make it here!
    nonEmptyOrder = true;
  }

  // Now validate the additional items
  for(const additionalId of additionalIds) {
    // Validate milkshake record
    let additionalRecord;

    try {
      // Not too concerned with attributes here as not sending this to the user
      additionalRecord = await ToastieBarAdditionalStock.findOne({ 
        where: { 
          id: additionalId
        } 
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to fetch the additional item record" });
    }

    if(additionalRecord === null) {
      return res.status(400).json({ error: "Invalid additional item id" });
    }

    if(!additionalRecord.available || additionalRecord.deleted) {
      return res.status(400).json({ error: `Selected additional item '${additionalRecord.name}' is unavailable`});
    }

    // Additional item is valid if we make it here!
    nonEmptyOrder = true;
  }

  // Must order a minimum of one item!
  if(!nonEmptyOrder) {
    return res.status(400).json({ error: "Must order at least one item" });
  }

  // Order is valid, can now add it to the database
  // Firstly, create the parent record

  let orderRecord;

  try {
    orderRecord = await ToastieBarOrder.create({
      userId, externalCustomerName, externalCustomerUsername,
      verified: userId !== null, verificationId // Logged in students do not need to verify their identity
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create order parent" });
  }

  // Now build the order up
  // First, toasties
  for(const toastie of toasties) {
    let toastieRecord; 

    try {
      toastieRecord = await ToastieBarComponentToastie.create({
        orderId: orderRecord.id,
        breadId: toastie.breadId
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create toastie order entry" });
    }

    for(const fillingId of toastie.fillingIds) {
      try {
        await ToastieBarComponentToastieFilling.create({
          individualToastieId: toastieRecord.id,
          fillingId
        });
      } catch (error) {
        return res.status(500).json({ error: "Unable to create toastie filling entry" });
      }
    }
  }

  // Next, milkshakes
  for(const milkshakeId of milkshakeIds) {
    try {
      await ToastieBarComponentMilkshake.create({
        orderId: orderRecord.id,
        milkshakeId
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create milkshake entry" });
    }
  }

  // Next, specials
  for(const special of specials) {
    try {
      await ToastieBarComponentSpecial.create({
        orderId: orderRecord.id,
        specialId: special.specialId,
        breadId: special.breadId
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to create special entry" });
    }
  }

  // Finally, additional items
  for(const additionalId of additionalIds) {
    try {
      await ToastieBarComponentAdditionalItem.create({
        orderId: orderRecord.id,
        stockId: additionalId
      })
    } catch (error) {
      return res.status(500).json({ error: "Unable to create additional item entry" });
    }
  }

  // Order is now completed

  // Send the verification email for non-logged in users
  // TODO: Otherwise send the order confirmation
  if(userId === null) {
    // Durham emails only!
    const email = `${externalCustomerUsername}@durham.ac.uk`;
    const verificationEmailMessage = createVerificationEmail(externalCustomerName, verificationId);
    let emailResult = await mailer.sendEmail(email, `Verify Toastie Bar Order`, verificationEmailMessage);

    if(emailResult === false) {
      return res.status(400).json({ error: "Unable to send verification email. Please check your username is valid."})
    }
  } else {
    let readyOrder;

    // Mammoth join to get all of the data about each order that is needed
    // Easier to do this than piece together the previous bits
    // This can be fed directly into the order format processor for standarisation with socket output
    try {
      readyOrder = await ToastieBarOrder.findOne({
        where: {
          id: orderRecord.id,
          verified: true,
        },
        include: [
          {
          model: User,
          attributes: ["surname", "firstNames"]
          },
          {
          model: ToastieBarComponentMilkshake,
          attributes: ["id"],
          include: [
            {
            model: ToastieBarMilkshake,
            attributes: ["name", "pricePerUnit"]
            }
          ]
          },
          {
          model: ToastieBarComponentAdditionalItem,
          attributes: ["id"],
          include: [
            {
            model: ToastieBarAdditionalStock,
            attributes: ["name", "pricePerUnit"],
            include: [
              {
              model: ToastieBarAdditionalStockType,
              attributes: ["name"]
              }
            ] 
            }
          ]
          },
          {
          model: ToastieBarComponentSpecial,
          attributes: ["id"],
          include: [
            {
            model: ToastieBarSpecial,
            attributes: ["name", "priceWithoutBread"],
            include: [
              {
              model: ToastieBarSpecialFilling,
              attributes: ["id"],
              include: [
                {
                model: ToastieBarFilling,
                attributes: ["name"]
                }
              ]
              }
            ]
            },
            {
            model: ToastieBarBread,
            attributes: ["name", "pricePerUnit"]
            }
          ]
          },
          {
          model: ToastieBarComponentToastie,
          attributes: ["id"],
          include: [
            {
            model: ToastieBarComponentToastieFilling,
            attributes: ["id"],
            include: [
              {
              model: ToastieBarFilling,
              attributes: ["name", "pricePerUnit"]
              }
            ]
            },
            {
            model: ToastieBarBread,
            attributes: ["name", "pricePerUnit"]
            }
          ]
          }
        ],
        attributes: ["id", "externalCustomerName", "externalCustomerUsername", "updatedAt", "completedTime"]
      });
    } catch (error) {
      return false;
    }

    const processedOrder = processToastieOrder(readyOrder);
    const waitTime = await calculateEstimatedWaitTime();
    const orderSummaryEmail = createOrderSummaryEmail(makeDisplayName(req.session.user.firstNames, req.session.user.surname), processedOrder, waitTime);
    console.log("sending...")
    mailer.sendEmail(req.session.user.email, "Toastie Bar Order Confirmation", orderSummaryEmail);
    console.log("sent!")

    // io is passed via middleware in server.js
    req.io.to("toastieBarAdminClients").emit("toastieBarNewOrder", { processedOrder });
  }

  return res.status(200).json({ requiresVerification: userId === null });
});

router.post("/verify", async (req, res) => {
  const { verificationCode } = req.body;

  if(verificationCode === undefined) {
    return res.status(400).json({ error: "No verification code submitted" });
  }

  // First, check that the Toastie Bar is actually open
  let openRecord;

  try {
    openRecord = await PersistentVariable.findOne({
      where: {
        key: "TOASTIE_BAR_OPEN"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to check open status" });
  }

  if(!openRecord.booleanStorage) {
    return res.status(200).json({ success: false, reason: "closed" });
  }

  let orderRecord;
  let fifteenMinuteWindow = new Date();
  fifteenMinuteWindow.setMinutes(fifteenMinuteWindow.getMinutes() - 15);

  try {
    orderRecord = await ToastieBarOrder.findOne({
      where: {
        verificationId: verificationCode
      }
    })
  } catch (error) {
    return res.status(500).json({ error: "A server occurred attempting to check record" });
  }

  if(orderRecord === null) {
    return res.status(200).json({ success: false, reason: "invalid_code" });
  }

  if(orderRecord.verified) {
    return res.status(200).json({ success: false, reason: "already_verified" });
  }

  if(orderRecord.completedTime !== null) {
    return res.status(200).json({ success: false, reason: "already_completed" });
  }

  let startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  if(orderRecord.createdAt < fifteenMinuteWindow) {
    return res.status(200).json({ success: false, reason: "timeout" });
  }

  orderRecord.verified = true;

  try {
    await orderRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save record" });
  }

  let readyOrder;

  // Mammoth join to get all of the data about each order that is needed
  // Easier to do this than piece together the previous bits
  // This can be fed directly into the order format processor for standarisation with socket output
  try {
    readyOrder = await ToastieBarOrder.findOne({
      where: {
        id: orderRecord.id,
        verified: true,
      },
      include: [
        {
        model: User,
        attributes: ["surname", "firstNames"]
        },
        {
        model: ToastieBarComponentMilkshake,
        attributes: ["id"],
        include: [
          {
          model: ToastieBarMilkshake,
          attributes: ["name", "pricePerUnit"]
          }
        ]
        },
        {
        model: ToastieBarComponentAdditionalItem,
        attributes: ["id"],
        include: [
          {
          model: ToastieBarAdditionalStock,
          attributes: ["name", "pricePerUnit"],
          include: [
            {
            model: ToastieBarAdditionalStockType,
            attributes: ["name"]
            }
          ] 
          }
        ]
        },
        {
        model: ToastieBarComponentSpecial,
        attributes: ["id"],
        include: [
          {
          model: ToastieBarSpecial,
          attributes: ["name", "priceWithoutBread"],
          include: [
            {
            model: ToastieBarSpecialFilling,
            attributes: ["id"],
            include: [
              {
              model: ToastieBarFilling,
              attributes: ["name"]
              }
            ]
            }
          ]
          },
          {
          model: ToastieBarBread,
          attributes: ["name", "pricePerUnit"]
          }
        ]
        },
        {
        model: ToastieBarComponentToastie,
        attributes: ["id"],
        include: [
          {
          model: ToastieBarComponentToastieFilling,
          attributes: ["id"],
          include: [
            {
            model: ToastieBarFilling,
            attributes: ["name", "pricePerUnit"]
            }
          ]
          },
          {
          model: ToastieBarBread,
          attributes: ["name", "pricePerUnit"]
          }
        ]
        }
      ],
      attributes: ["id", "externalCustomerName", "externalCustomerUsername", "updatedAt", "completedTime"]
    });
  } catch (error) {
    return false;
  }

  const processedOrder = processToastieOrder(readyOrder);

  // io is passed via middleware in server.js
  req.io.to("toastieBarAdminClients").emit("toastieBarNewOrder", { processedOrder });

  const customerEmail = `${orderRecord.externalCustomerUsername}@durham.ac.uk`;
  const customerName = orderRecord.externalCustomerName;
  const waitTime = await calculateEstimatedWaitTime();
  const orderSummaryEmail = createOrderSummaryEmail(customerName, processedOrder, waitTime);
  mailer.sendEmail(customerEmail, "Toastie Bar Order Confirmation", orderSummaryEmail);

  return res.status(200).json({ success: true });
});

router.post("/bread/update", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, pricePerUnit, available } = req.body;

  let breadRecord;

  try {
    breadRecord = await ToastieBarBread.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(breadRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  breadRecord.name = name;
  breadRecord.pricePerUnit = pricePerUnit;
  breadRecord.available = available;

  try {
    await breadRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save record" });
  }

  return res.status(204).end();
});

router.post("/bread/delete", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.body;

  let breadRecord;

  try {
    breadRecord = await ToastieBarBread.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(breadRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  breadRecord.deleted = true;

  try {
    await breadRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete record" });
  }

  return res.status(204).end();
});

router.post("/bread/create", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, pricePerUnit, available } = req.body;

  let breadRecord;

  try {
    breadRecord = await ToastieBarBread.create({ name, pricePerUnit, available });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  return res.status(200).json({ record: breadRecord });
});

router.post("/filling/update", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, pricePerUnit, available } = req.body;

  let fillingRecord;

  try {
    fillingRecord = await ToastieBarFilling.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(fillingRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  fillingRecord.name = name;
  fillingRecord.pricePerUnit = pricePerUnit;
  fillingRecord.available = available;

  try {
    await fillingRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save record" });
  }

  return res.status(204).end();
});

router.post("/filling/delete", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.body;

  let fillingRecord;

  try {
    fillingRecord = await ToastieBarFilling.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(fillingRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  fillingRecord.deleted = true;

  try {
    await fillingRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete record" });
  }

  return res.status(204).end();
});

router.post("/filling/create", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, pricePerUnit, available } = req.body;

  let fillingRecord;

  try {
    fillingRecord = await ToastieBarFilling.create({ name, pricePerUnit, available });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  return res.status(200).json({ record: fillingRecord });
});

router.post("/milkshake/update", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, pricePerUnit, available } = req.body;

  let milkshakeRecord;

  try {
    milkshakeRecord = await ToastieBarMilkshake.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(milkshakeRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  milkshakeRecord.name = name;
  milkshakeRecord.pricePerUnit = pricePerUnit;
  milkshakeRecord.available = available;

  try {
    await milkshakeRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save record" });
  }

  return res.status(204).end();
});

router.post("/milkshake/delete", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.body;

  let milkshakeRecord;

  try {
    milkshakeRecord = await ToastieBarMilkshake.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(milkshakeRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  milkshakeRecord.deleted = true;

  try {
    await milkshakeRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete record" });
  }

  return res.status(204).end();
});

router.post("/milkshake/create", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, pricePerUnit, available } = req.body;

  let milkshakeRecord;

  try {
    milkshakeRecord = await ToastieBarMilkshake.create({ name, pricePerUnit, available });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  return res.status(200).json({ record: milkshakeRecord });
});

router.get("/additional/types", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  let types;

  try {
    types = await ToastieBarAdditionalStockType.findAll();
  } catch (error) {
    return res.status(500).json({ error: "Unable to get the stock types" });
  }

  return res.status(200).json({ types });
});

router.post("/additional/update", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, typeId, pricePerUnit, available } = req.body;

  let additionalRecord;

  try {
    additionalRecord = await ToastieBarAdditionalStock.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(additionalRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  additionalRecord.name = name;
  additionalRecord.typeId = typeId;
  additionalRecord.pricePerUnit = pricePerUnit;
  additionalRecord.available = available;

  try {
    await additionalRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save record" });
  }

  return res.status(204).end();
});

router.post("/additional/delete", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.body;

  let additionalRecord;

  try {
    additionalRecord = await ToastieBarAdditionalStock.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(additionalRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  additionalRecord.deleted = true;

  try {
    await additionalRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete record" });
  }

  return res.status(204).end();
});

router.post("/additional/create", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, typeId, pricePerUnit, available } = req.body;

  let typeRecord;

  try {
    typeRecord = await ToastieBarAdditionalStockType.findOne({ where: { id: typeId } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch type record" });
  }

  if(typeRecord === null) {
    return res.status(400).json({ error: "Invalid typeId" });
  }

  let additionalRecord;

  try {
    additionalRecord = await ToastieBarAdditionalStock.create({ name, typeId, pricePerUnit, available });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create record" });
  }

  return res.status(200).json({ record: additionalRecord, type: typeRecord });
});

router.post("/additional/type/create", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name } = req.body;

  let additionalTypeRecord;

  try {
    additionalTypeRecord = await ToastieBarAdditionalStockType.create({ name });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create record" });
  }

  return res.status(200).json({ record: additionalTypeRecord });
});

router.post("/special/update", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id, name, description, startDate, endDate, priceWithoutBread } = req.body;

  let specialRecord;

  try {
    specialRecord = await ToastieBarSpecial.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(specialRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  specialRecord.name = name;
  specialRecord.description = description
  specialRecord.startDate = startDate
  specialRecord.endDate = endDate
  specialRecord.priceWithoutBread = priceWithoutBread

  try {
    await specialRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to save record" });
  }

  return res.status(204).end();
});

router.post("/special/delete", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { id } = req.body;

  let specialRecord;

  try {
    specialRecord = await ToastieBarSpecial.findOne({ where: { id } });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch record" });
  }

  if(specialRecord === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  specialRecord.deleted = true;

  try {
    await specialRecord.save();
  } catch (error) {
    return res.status(500).json({ error: "Unable to delete record" });
  }

  return res.status(204).end();
});

router.post("/special/create", async (req, res) => {
  if(!req.session.user || !req.cookies.user_sid) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if(!hasPermission(req.session, "toasties.manage")) {
    return res.status(403).json({ error: "You do not have permission to perform this action" });
  }

  const { name, description, startDate, endDate, priceWithoutBread, addedFillingIDs } = req.body;

  let specialRecord;

  try {
    specialRecord = await ToastieBarSpecial.create({ name, description, startDate, endDate, priceWithoutBread });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create record" });
  }

  let fillingNames = [];
  let available = true;

  for(const fillingId of addedFillingIDs) {
    // Check the filling exists
    let fillingRecord;

    try {
      fillingRecord = await ToastieBarFilling.findOne({ where: { id: fillingId } });
    } catch (error) {
      return res.status(500).json({ error: "Unable to check filling" });
    }

    if(fillingRecord === null) {
      return res.status(400).json({ error: "Invalid filling" });
    }

    try {
      await ToastieBarSpecialFilling.create({
        specialId: specialRecord.id,
        fillingId: fillingRecord.id
      });
    } catch (error) {
      return res.status(500).json({ error: "Unable to connect filling to special" });
    }

    fillingNames.push(fillingRecord.name)
    available = available && fillingRecord.available;
  }

  return res.status(200).json({ record: specialRecord, fillings: fillingNames, available });
});

// Generates the email to send about verifying an order
const createVerificationEmail = (name, verificationId) => {
  let contents = [];
  
  contents.push(`<h1>Toastie Bar Order Verification</h1>`);
  contents.push(`<p>Hello ${name},</p>`);
  contents.push(`<p>You have placed an order at the Grey JCR's Toastie Bar. As you were not logged in to the website we require you to verify your order before it is made.</p>`);
  contents.push(`<a href="${process.env.WEB_ADDRESS}toasties/verify/${verificationId}" target="_blank" rel="noopener noreferrer"><p>To do this, click here or paste the link below into your web browser.</p></a>`)
  contents.push(`<p>${process.env.WEB_ADDRESS}toasties/verify/${verificationId}</p>`);
  contents.push(`<p><strong>This link expires in 15 minutes. Your order will not be started until you verify it.</strong></p>`);
  contents.push(`<p>If you did not order this toastie you can safely ignore this email.</p>`);
  contents.push(`<p>Thank you</p>`);

  return contents.join("");
}

const createOrderSummaryEmail = (name, processedOrder, waitTime) => {
  let contents = [];
  
  contents.push(`<h1>Toastie Bar Order Confirmation</h1>`);
  contents.push(`<p>Hello ${name},</p>`);
  contents.push(`<p>Your order is being processed by the Toastie Bar. The estimated wait time is ${waitTime} minutes. You will receive an email when your order is ready for collection.</p>`);
  contents.push(`<p>A summary of your order is below:</p>`);
  contents.push(`<br />`);
  contents.push(`<p>Order received at: ${dateFormat(processedOrder.orderedAt, "dd/mm/yyyy HH:MM")}`)
  contents.push(`<p>Total: £${processedOrder.totalPrice}</p>`);

  if(processedOrder.toasties.length !== 0) {
    contents.push(`<p>Toasties</p>`);
    let count = 1;

    for(const toastie of processedOrder.toasties) {
      contents.push(`<p>${toastie.quantity} x ${toastie.special ? `${toastie.special} (Special)` : `Toastie ${count}`}<p>`)
      contents.push(`<ul>`);
      contents.push(`<li>${toastie.bread}</li>`);

      for(const filling of toastie.fillings) {
        contents.push(`<li>${filling}</li>`)
      }

      contents.push(`</ul>`);
      count++;
    }
  }

  if(processedOrder.milkshakes.length !== 0) {
    contents.push(`<p>Milkshakes</p>`);
    contents.push(`<ul>`);

    for(const milkshake of processedOrder.milkshakes) {
      contents.push(`<li>${milkshake.quantity} x ${milkshake.name}</li>`);
    }

    contents.push(`</ul>`);
  }

  if(processedOrder.additionalItems.length !== 0) {
    contents.push(`<p>Additional Items</p>`);
    contents.push(`<ul>`);

    for(const additionalItem of processedOrder.additionalItems) {
      contents.push(`<li>${additionalItem.quantity} x ${additionalItem.name}</li>`);
    }

    contents.push(`</ul>`);
  }

  contents.push(`<br />`);
  contents.push(`<p>Failure to collect and pay for your order may prevent you from using the online ordering system in the future.</p>`);
  contents.push(`<p>Thank you</p>`);

  return contents.join("");
}

// 5 or 2.5 * len(outstanding orders)
const calculateEstimatedWaitTime = async () => {
  let startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  // Beware this doesn't handle daylight savings hours!
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  let outstandingOrders;

  try {
    outstandingOrders = await ToastieBarOrder.count({
      where: {
        verified: true,
        completedTime: null,
        createdAt: {
          [Op.and]: {
            [Op.gt]: startOfDay,
            [Op.lt]: endOfDay
          }
        }
      }
    })
  } catch (error) {
    return -1;
  }

  return Math.max(5, Math.floor(2.5 * outstandingOrders));
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
