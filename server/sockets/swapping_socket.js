const { User, Permission, PermissionLink, SwappingCredit, SwappingCreditLog, SwappingPair, PersistentVariable } = require("../database.models.js");
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

    let openRecord;

    try {
      openRecord = await PersistentVariable.findOne({ where: { key: "SWAPPING_OPEN" } });
    } catch (error) {
      console.log({ error });
      return {};
    }

    // Then send them the initial data
    let positions;

    try {
      positions = await SwappingPair.findAll({
        attributes: [ "id", "first", "second", "position", "count" ],
        order: [[ "position", "ASC" ]]
      });
    } catch (error) {
      console.log({ error });
      return {};
    }

    io.to("swapClients").emit("updateUserCount", { users: io.sockets.adapter.rooms.get("swapClients").size });
    socket.emit("swapInitialPositions", { positions, open: openRecord.booleanStorage, users: io.sockets.adapter.rooms.get("swapClients").size });
  });

  socket.on("disconnect", async () => {
    io.to("swapClients").emit("updateUserCount", { users: io.sockets.adapter.rooms.get("swapClients").size });
  })
}

module.exports = { setupEvents };
