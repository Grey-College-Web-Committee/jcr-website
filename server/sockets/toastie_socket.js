const { User } = require("../database.models.js");
const { hasPermission } = require("../utils/permissionUtils.js");

const setupEvents = (socket, io) => {
  socket.on("subscribeToToastieOrders", async () => {
    if(!hasPermission(socket.handshake.session, "toastie.stock.edit")) {
      socket.disconnect();
      return;
    }
  });
}
