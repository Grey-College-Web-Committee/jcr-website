const setupEvents = (socket, io) => {
  socket.on("subscribeToBarOrders", () => {
    socket.join("barOrderClients");
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
