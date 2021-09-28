const { User, Permission, PermissionLink, SwappingCredit, SwappingCreditLog } = require("../database.models.js");
const { hasPermission } = require("../utils/permissionUtils.js");

const setupEvents = (socket, io) => {
  socket.on("subscribeToSwap", async () => {
    if(!hasPermission(socket.handshake.session, "jcr.member")) {
      socket.disconnect();
      return;
    }

    // When they subscribe we will register them to the room
    // we broadcast all the messages over this room
    socket.join("swapClients");
  });

  // socket.on("markBarContentComplete", async (data) => {
  //   io.to("barOrderClients").emit("barContentCompleted", data);
  // });
}

module.exports = { setupEvents };
