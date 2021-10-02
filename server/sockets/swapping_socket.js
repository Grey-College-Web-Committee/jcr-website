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

    io.to("swapClients").emit("updateUserCount", { users: io.sockets.adapter.rooms.get("swapClients") ? io.sockets.adapter.rooms.get("swapClients").size : 1 });
    socket.emit("swapInitialPositions", { positions, open: openRecord.booleanStorage, users: io.sockets.adapter.rooms.get("swapClients").size });
  });

  socket.on("performSwap", async (data) => {
    if(!hasPermission(socket.handshake.session, "jcr.member")) {
      socket.disconnect();
      return;
    }

    let openRecord;

    try {
      openRecord = await PersistentVariable.findOne({ where: { key: "SWAPPING_OPEN" } });
    } catch (error) {
      socket.emit("swappingError", { error: "An unexpected error occurred while checking swapping is open" });
      return;
    }

    const { firstPairId, secondPairId, flipFirst, flipSecond } = data;

    let firstPairRecord;

    try {
      firstPairRecord = await SwappingPair.findOne({ where: { id: firstPairId } });
    } catch (error) {
      socket.emit("swappingError", { error: "An unexpected error occurred while swapping (pair 1)" });
      return;
    }

    if(!firstPairRecord) {
      socket.emit("swappingError", { error: "Invalid pair selected (pair 1)" });
      return;
    }

    let secondPairRecord;

    try {
      secondPairRecord = await SwappingPair.findOne({ where: { id: secondPairId } });
    } catch (error) {
      socket.emit("swappingError", { error: "An unexpected error occurred while swapping (pair 2)" });
      return;
    }

    if(!secondPairRecord) {
      socket.emit("swappingError", { error: "Invalid pair selected (pair 2)" });
      return;
    }

    const pairPriceInPence = (pair) => 20 * 2 ** pair.count;
    const firstPairPriceIP = pairPriceInPence(firstPairRecord);
    const secondPairPriceIP = pairPriceInPence(secondPairRecord);

    const totalCostInPence = firstPairPriceIP > secondPairPriceIP ? firstPairPriceIP : secondPairPriceIP;

    let userCreditRecord;

    try {
      userCreditRecord = await SwappingCredit.findOne({ where: { userId: socket.handshake.session.user.id } });
    } catch (error) {
      socket.emit("swappingError", { error: "An unexpected error occurred while fetching current credit" });
      return;
    }

    if(!userCreditRecord) {
      socket.emit("swappingError", { error: "You have not added any credit to your account" });
      return;
    }

    if(userCreditRecord.credit < totalCostInPence) {
      socket.emit("swappingError", { error: `You currently have £${(userCreditRecord.credit / 100).toFixed(2)} and this swap costs £${(totalCostInPence / 100).toFixed(2)}.` });
      return
    }

    // Update their credit
    userCreditRecord.credit -= totalCostInPence;

    try {
      await userCreditRecord.save();
    } catch (error) {
      socket.emit("swappingError", { error: "Unable to update the credit for the user" });
      return
    }

    // Perform the swap
    const firstPos = firstPairRecord.position;
    firstPairRecord.position = secondPairRecord.position;
    firstPairRecord.count += 1;
    secondPairRecord.position = firstPos;
    secondPairRecord.count += 1;

    // Do the flips if needed too
    if(flipFirst) {
      const firstPerson = firstPairRecord.first;
      firstPairRecord.first = firstPairRecord.second;
      firstPairRecord.second = firstPerson;
    }

    if(flipSecond) {
      const firstPerson = secondPairRecord.first;
      secondPairRecord.first = secondPairRecord.second;
      secondPairRecord.second = firstPerson;
    }

    try {
      await firstPairRecord.save();
      await secondPairRecord.save();
    } catch (error) {
      socket.emit("swappingError", { error: "Unable to save the updated swap" });
      return
    }

    // Get the new positions
    let positions;

    try {
      positions = await SwappingPair.findAll({
        attributes: [ "id", "first", "second", "position", "count" ],
        order: [[ "position", "ASC" ]]
      });
    } catch (error) {
      socket.emit("swappingError", { error: "Unable to retrieve updated positions" });
      return
    }

    // Update all the clients
    io.to("swapClients").emit("swappingUpdate", { positions });

    // Update the log
    try {
      await SwappingCreditLog.create({
        userId: socket.handshake.session.user.id,
        amount: totalCostInPence,
        type: "swap"
      });
    } catch (error) {
      console.log({error})
      socket.emit("swappingError", { error: "Unable to create the credit log entry" });
      return
    }

    // Get their full history
    let history;

    try {
      history = await SwappingCreditLog.findAll({
        where: { userId: socket.handshake.session.user.id },
        order: [[ "updatedAt", "DESC" ]]
      });
    } catch (error) {
      socket.emit("swappingError", { error: "Unable to fetch the full history for the user" });
      return
    }

    socket.emit("swappingSuccess", { history, credit: userCreditRecord.credit });
  });

  socket.on("disconnect", async () => {
    io.to("swapClients").emit("updateUserCount", { users: io.sockets.adapter.rooms.get("swapClients") ? io.sockets.adapter.rooms.get("swapClients").size : 1 });
  })
}

module.exports = { setupEvents };
