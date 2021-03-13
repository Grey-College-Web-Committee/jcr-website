const setupEvents = (socket, io) => {
  socket.on("subscribeToBarOrders", () => {
    socket.join("barOrderClients");
  });
}

const setupEmitter = (io) => {
  setInterval(() => {
    io.to("barOrderClients").emit("barOrder", new Date());
  }, 1000);
}

module.exports = { setupEvents, setupEmitter };
