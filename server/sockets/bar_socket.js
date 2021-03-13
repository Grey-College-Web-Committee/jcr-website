const { User, BarDrinkType, BarDrinkSize, BarBaseDrink, BarDrink, BarMixer, BarOrder, BarOrderContent } = require("../database.models.js");

const setupEvents = (socket, io) => {
  socket.on("subscribeToBarOrders", async () => {
    socket.join("barOrderClients");
    console.log("subscribed")

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
          quantity: item.quantity
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

    console.log("sending initial")
    socket.emit("barInitialData", transformedOrders)
  });
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
