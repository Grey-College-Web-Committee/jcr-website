const { User, BarDrinkType, BarDrinkSize, BarBaseDrink, BarDrink, BarMixer, BarOrder, BarOrderContent, PersistentVariable, BarCordial } = require("../database.models.js");
const { hasPermission } = require("../utils/permissionUtils.js");

const setupEvents = (socket, io) => {
  socket.on("subscribeToBarOrders", async () => {
    if(!hasPermission(socket.handshake.session, "bar.manage")) {
      socket.disconnect();
      return;
    }

    // When they subscribe we will register them to the room
    // we broadcast all the messages over this room
    socket.join("barOrderClients");

    // Then we get all of the non-completed orders
    let existingOrders;

    try {
      existingOrders = await BarOrder.findAll({
        where: {
          completed: false
        },
        include: [
          {
            model: BarOrderContent,
            include: [
              {
                model: BarDrink,
                include: [ BarBaseDrink, BarDrinkSize ]
              },
              {
                model: BarMixer
              },
              {
                model: BarCordial
              },
            ]
          },
          {
            model: User
          }
        ]
      });
    } catch (error) {
      // need to handle errors at some point
      console.log(error);
      return {};
    }

    // And construct them into an array as if they were new orders
    let transformedOrders = existingOrders.map(order => {
      let firstName = order.User.firstNames.split(",")[0];
      firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
      const lastName = order.User.surname.charAt(0).toUpperCase() + order.User.surname.substr(1).toLowerCase();

      let contents = order.BarOrderContents.map(item => {
        return {
          id: item.id,
          name: item.BarDrink.BarBaseDrink.name,
          size: item.BarDrink.BarDrinkSize.name,
          mixer: item.mixerId === null ? null : item.BarMixer.name,
          cordial: item.cordialId === null ? null : item.BarCordial.name,
          quantity: item.quantity,
          completed: item.completed
        };
      })

      return {
        id: order.id,
        orderedAt: order.createdAt,
        orderedBy: `${firstName} ${lastName}`,
        email: order.User.email,
        paid: order.paid,
        totalPrice: Number(order.totalPrice),
        tableNumber: order.tableNumber,
        contents
      }
    });

    let barOpenRecord;

    try {
      barOpen = await PersistentVariable.findOne({ where: { key: "BAR_OPEN" }});
    } catch (error) {
      return {};
    }

    // These are then sent directly to the client which processes them
    socket.emit("barInitialData", { transformedOrders, open: barOpen.booleanStorage });
  });

  socket.on("markBarContentComplete", async (data) => {
    if(!hasPermission(socket.handshake.session, "bar.manage")) {
      socket.disconnect();
      return;
    }

    const { orderId, contentId } = data;

    // Update the record
    try {
      await BarOrderContent.update({ completed: true }, {
        where: { id: contentId, orderId }
      });
    } catch (error) {
      // need to handle
      console.log(error);
      return {};
    }

    // now emit to all others
    io.to("barOrderClients").emit("barContentCompleted", data);
  });

  socket.on("markBarOrderPaid", async (data) => {
    if(!hasPermission(socket.handshake.session, "bar.manage")) {
      socket.disconnect();
      return;
    }

    const { orderId } = data;

    try {
      await BarOrder.update({ paid: true }, {
        where: { id: orderId }
      });
    } catch (error) {
      // need to handle
      console.log(error);
      return {};
    }

    io.to("barOrderClients").emit("barOrderPaid", data);
  });

  socket.on("markBarOrderCompleted", async (data) => {
    if(!hasPermission(socket.handshake.session, "bar.manage")) {
      socket.disconnect();
      return;
    }

    const { orderId } = data;

    console.log({orderId})

    try {
      await BarOrder.update({ paid: true, completed: true }, {
        where: { id: orderId }
      });
    } catch (error) {
      // need to handle
      console.log(error);
      return {};
    }

    io.to("barOrderClients").emit("barOrderCompleted", data);
  });

  socket.on("setBarOpen", async (data) => {
    if(!hasPermission(socket.handshake.session, "bar.manage")) {
      socket.disconnect();
      return;
    }

    const { open } = data;

    try {
      await PersistentVariable.update({ booleanStorage: open }, {
        where: { key: "BAR_OPEN" }
      });
    } catch (error) {
      // TODO: handle
      return {};
    }

    io.to("barOrderClients").emit("barOpenChanged", data);
  });
}

module.exports = { setupEvents };
