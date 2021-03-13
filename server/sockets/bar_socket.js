const { User, BarDrinkType, BarDrinkSize, BarBaseDrink, BarDrink, BarMixer, BarOrder, BarOrderContent } = require("../database.models.js");

const setupEvents = (socket, io) => {
  socket.on("subscribeToBarOrders", async () => {
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

    // These are then sent directly to the client which processes them
    socket.emit("barInitialData", transformedOrders)
  });

  socket.on("markBarContentComplete", async (data) => {
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

  // socket.on("markBarOrderPaid", async (data) => {
  //   const { orderId } = data;
  //
  //   let orderRecord;
  //
  //   try {
  //     orderRecord = await BarOrder.update({ paid: true }, {
  //       where: { id: orderId }
  //     });
  //   } catch (error) {
  //     // need to handle
  //     console.log(error);
  //     return {};
  //   }
  //
  //   if(orderRecord === null) {
  //     return {};
  //   }
  // });
}

const setupEmitter = (io) => {
  // setInterval(() => {
  //   io.to("barOrderClients").emit("barNewOrder", {
  //     id: Math.floor(Math.random() * 5000),
  //     orderedAt: new Date(),
  //     orderedBy: "Finlay Boyle",
  //     totalPrice: 4.2,
  //     contents: [
  //       {
  //         name: "Spiced Rum",
  //         size: "Double",
  //         mixer: "Coke",
  //         quantity: 2
  //       },
  //       {
  //         name: "Vodka",
  //         size: "Single",
  //         mixer: "None",
  //         quantity: 1
  //       }
  //     ]
  //   });
  // }, 5000);
}

module.exports = { setupEvents, setupEmitter };
