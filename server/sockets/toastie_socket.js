const { 
  User, Permission, PermissionLink, PersistentVariable,
  ToastieBarBread, ToastieBarFilling, ToastieBarMilkshake, ToastieBarSpecial, ToastieBarSpecialFilling, ToastieBarAdditionalStockType, ToastieBarAdditionalStock,
  ToastieBarOrder, ToastieBarComponentToastie, ToastieBarComponentToastieFilling, ToastieBarComponentSpecial, ToastieBarComponentMilkshake, ToastieBarComponentAdditionalItem
} = require("../database.models.js");
const { hasPermission } = require("../utils/permissionUtils.js");
const { Op } = require("sequelize");
const { makeDisplayName } = require("../utils/helper.js");
const hash = require("object-hash");
const mailer = require("../utils/mailer");

const setupEvents = (socket, io) => {
  // Subscribe to future events and get the initial data
  socket.on("subscribeToToastieBar", async () => {
    if(!hasPermission(socket.handshake.session, "toasties.manage")) {
      socket.disconnect();
      return;
    }

    // When they subscribe we will register them to the room
    // we broadcast all the messages over this room
    socket.join("toastieBarAdminClients");

    // When they join we find all outstanding verified orders and the if the toastie bar is open
    let openRecord;

    try {
      openRecord = await PersistentVariable.findOne({
        where: {
          key: "TOASTIE_BAR_OPEN"  
        }
      });
    } catch (error) {
      return { error: true };
    }

    // Get the outstanding parent orders
    let orderRecords;
    let startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    // Beware this doesn't handle daylight savings hours!
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Mammoth join to get all of the data about each order that is needed
    try {
      orderRecords = await ToastieBarOrder.findAll({
        where: {
          completedTime: null,
          verified: true,
          createdAt: {
            [Op.and]: {
              [Op.gt]: startOfDay,
              [Op.lt]: endOfDay
            }
          }
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
      console.log(error)
    }

    // Now process the data into the required format
    const orders = orderRecords.reduce((acc, record) => (acc[record.id] = processOrder(record), acc), {});

    // These are then sent directly to the client which processes them
    socket.emit("toastieBarInitialData", { open: openRecord.booleanStorage, orderRecords: orders });
  });

  // Update an order by setting it as complete
  socket.on("markToastieBarOrderCompleted", async (data) => {
    const { orderId } = data;

    // Update the order and set its completed time
    let orderRecord;

    try {
      orderRecord = await ToastieBarOrder.findOne({ 
        where: {
          id: orderId
        },
        include: [{
          model: User,
          attributes: ["firstNames", "surname", "email"]
        }]
      })
    } catch (error) {
      return { error: true };
    }

    const completedTime = new Date();
    orderRecord.completedTime = completedTime;

    try {
      await orderRecord.save();
    } catch (error) {
      return { error: true };
    }

    // Email the person to collect their toastie
    let customerEmail = null;
    let customerName = null;

    if(orderRecord.User === null) {
      customerEmail = `${orderRecord.externalCustomerUsername}@durham.ac.uk`;
      customerName = orderRecord.externalCustomerName;
    } else {
      customerEmail = orderRecord.User.email;
      customerName = makeDisplayName(orderRecord.User.firstNames, orderRecord.User.surname)
    }

    const completedEmailMessage = createCompletionEmail(customerName)
    mailer.sendEmail(customerEmail, "Toastie Bar Order Ready for Collection", completedEmailMessage);

    // Send the event to all other clients connected to the room
    io.to("toastieBarAdminClients").emit("toastieBarOrderCompleted", { orderId, completedTime });
  })

  // Open the toastie bar to enable ordering
  // Distributes to all other connected toastie socket clients
  socket.on("setToastieBarOpen", async (data) => {
    if(!hasPermission(socket.handshake.session, "toasties.manage")) {
      socket.disconnect();
      return;
    }

    const { open } = data;

    try {
      await PersistentVariable.update({ booleanStorage: open }, {
        where: { key: "TOASTIE_BAR_OPEN" }
      });
    } catch (error) {
      return { error: true };
    }

    io.to("toastieBarAdminClients").emit("toastieBarOpenStatusChanged", data);
  });
}

const processOrder = (order) => {
  let totalPrice = 0;
  let processedOrder = {
    id: order.id,
    customerName: order.User === null ? order.externalCustomerName : makeDisplayName(order.User.firstNames, order.User.surname),
    orderedAt: order.updatedAt,
    completedTime: order.completedTime,
    additionalItems: [],
    toasties: [] // specials will be processed into here
  }

  // Milkshakes first, merge equivalent milkshakes
  let milkshakeQuantities = {};

  for(const milkshake of order.ToastieBarComponentMilkshakes) {
    if(!Object.keys(milkshakeQuantities).includes(milkshake.ToastieBarMilkshake.name)) {
      milkshakeQuantities[milkshake.ToastieBarMilkshake.name] = 0;
    }

    milkshakeQuantities[milkshake.ToastieBarMilkshake.name] += 1;
    totalPrice += Number(milkshake.ToastieBarMilkshake.pricePerUnit);
  }

  // Add the milkshake quantities to the order
  let milkshakes = [];

  for(const milkshakeName of Object.keys(milkshakeQuantities)) {
    milkshakes.push({
      name: milkshakeName,
      quantity: milkshakeQuantities[milkshakeName]
    });
  }

  // On to additional items, merge equivalent items again
  let additionalItemQuantities = {};

  for(const additionalItem of order.ToastieBarComponentAdditionalItems) {
    const remappedName = `${additionalItem.ToastieBarAdditionalStock.name} (${additionalItem.ToastieBarAdditionalStock.ToastieBarAdditionalStockType.name})`;

    if(!Object.keys(additionalItemQuantities).includes(remappedName)) {
      additionalItemQuantities[remappedName] = 0;
    }

    additionalItemQuantities[remappedName] += 1;
    totalPrice += Number(additionalItem.ToastieBarAdditionalStock.pricePerUnit);
  }

  // Add the additional item quantities to the order
  let additionalItems = [];

  for(const additionalItemName of Object.keys(additionalItemQuantities)) {
    additionalItems.push({
      name: additionalItemName,
      quantity: additionalItemQuantities[additionalItemName]
    });
  }

  // Process the custom toasties
  // To merge these, we will hash the toastie object
  let toastieQuantities = {};

  // There could be a slight issue here. If we have a special consisting of X, Y, Z fillings
  // and someone submits the special and a separate toastie with the same fillings X, Y, Z
  // then they could be charged different prices for the special and the custom toastie
  // decided not to do anything about this as it will cause confusion
  for(const toastie of order.ToastieBarComponentToasties) {
    let toastiePrice = 0;

    const bread = toastie.ToastieBarBread.name;
    toastiePrice += Number(toastie.ToastieBarBread.pricePerUnit);

    let fillings = [];

    for(const filling of toastie.ToastieBarComponentToastieFillings) {
      fillings.push(filling.ToastieBarFilling.name);
      toastiePrice += Number(filling.ToastieBarFilling.pricePerUnit);
    }

    const toastieObj = {
      special: null,
      bread, 
      fillings
    }

    const toastieHash = hash(toastieObj);

    if(!Object.keys(toastieQuantities).includes(toastieHash)) {
      toastieQuantities[toastieHash] = {
        quantity: 0,
        ...toastieObj
      }
    }

    toastieQuantities[toastieHash].quantity += 1;
    totalPrice += toastiePrice;
  }

  // Now process the specials, they go into the toasties section with special = Name instead of null
  for(const specialParent of order.ToastieBarComponentSpecials) {
    const special = specialParent.ToastieBarSpecial;
    const bread = specialParent.ToastieBarBread.name;
    const toastiePrice = Number(specialParent.ToastieBarBread.pricePerUnit) + Number(special.priceWithoutBread);

    let fillings = [];

    for(const filling of special.ToastieBarSpecialFillings) {
      fillings.push(filling.ToastieBarFilling.name);
    }

    const toastieObj = {
      special: special.name,
      bread,
      fillings 
    }

    const toastieHash = hash(toastieObj);

    if(!Object.keys(toastieQuantities).includes(toastieHash)) {
      toastieQuantities[toastieHash] = {
        quantity: 0,
        ...toastieObj
      }
    }

    toastieQuantities[toastieHash].quantity += 1;
    totalPrice += toastiePrice;
  }

  // Add the toastie quantities to the order
  let toasties = Object.values(toastieQuantities);

  // Order processed
  processedOrder.totalPrice = totalPrice.toFixed(2);
  processedOrder.milkshakes = milkshakes;
  processedOrder.additionalItems = additionalItems;
  processedOrder.toasties = toasties;

  return processedOrder;
}

const createCompletionEmail = (name) => {
  let contents = [];

  contents.push(`<h1>Toastie Bar Order Collection</h1>`);
  contents.push(`<p>Hello ${name},</p>`);
  contents.push(`<p>Your online Toastie Bar order is ready for collection from the JCR.</p>`);
  contents.push(`<p>Please come and collect and pay as soon as possible!</p>`);
  contents.push(`<p>Failure to collect and pay for your order may prevent you from using the online ordering system in the future.</p>`);
  contents.push(`<p>Thank you</p>`);

  return contents.join("");
}

module.exports = { setupEvents };
