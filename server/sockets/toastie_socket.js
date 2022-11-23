const { 
  User, Permission, PermissionLink, PersistentVariable,
  ToastieBarBread, ToastieBarFilling, ToastieBarMilkshake, ToastieBarSpecial, ToastieBarSpecialFilling, ToastieBarAdditionalStockType, ToastieBarAdditionalStock,
  ToastieBarOrder, ToastieBarComponentToastie, ToastieBarComponentToastieFilling, ToastieBarComponentSpecial, ToastieBarComponentMilkshake, ToastieBarComponentAdditionalItem
} = require("../database.models.js");
const { hasPermission } = require("../utils/permissionUtils.js");
const { Op } = require("sequelize");
const { makeDisplayName, processToastieOrder } = require("../utils/helper.js");
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
    const orders = orderRecords.reduce((acc, record) => (acc[record.id] = processToastieOrder(record), acc), {});

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
    mailer.sendEmail(customerEmail, "Toastie Bar Order Ready", completedEmailMessage);

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
