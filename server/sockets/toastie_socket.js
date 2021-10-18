const { User, ToastieOrderTracker, ShopOrder, ShopOrderContent, ToastieOrderContent, ToastieStock, PersistentVariable } = require("../database.models.js");
const { hasPermission } = require("../utils/permissionUtils.js");

const makeDisplayName = (user) => {
  const upperCaseFirstName = user.firstNames.split(",")[0];
  const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

  const upperCaseLastName = user.surname;
  const specialCaseList = ["MC", "MAC"];
  const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

  let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

  // Fix special cases like McDonald appearing as Mcdonald
  if(foundSpecialCase.length !== 0) {
    const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
    lastName = upperCaseLastName.substring(c.length);
    lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
  }

  // Fix hyphens
  if(lastName.includes("-")) {
    let capNext = false;
    let newLastName = [];

    for(const i in lastName) {
      if(capNext) {
        newLastName.push(lastName[i].toUpperCase());
        capNext = false;
        continue;
      }

      newLastName.push(lastName[i]);
      capNext = lastName[i] === "-";
    }

    lastName = newLastName.join("")
  }

  // Fix apostrophes
  if(lastName.includes("'")) {
    let capNext = false;
    let newLastName = [];

    for(const i in lastName) {
      if(capNext) {
        newLastName.push(lastName[i].toUpperCase());
        capNext = false;
        continue;
      }

      newLastName.push(lastName[i]);
      capNext = lastName[i] === "'";
    }

    lastName = newLastName.join("")
  }

  return `${firstName} ${lastName}`;
}

const setupEvents = (socket, io) => {
  socket.on("subscribeToToastieOrders", async () => {
    if(!hasPermission(socket.handshake.session, "toastie.stock.edit")) {
      socket.disconnect();
      return;
    }

    // Subscribe to the toastie ordering room
    socket.join("toastieOrderClients");

    // Get all of the non-completed orders
    let existingOrders;

    try {
      existingOrders = await ToastieOrderTracker.findAll({
        where: {
          completed: false
        },
        include: [
          {
            model: ShopOrder,
            include: [
              {
                model: ShopOrderContent,
                include: [
                  {
                    model: ToastieOrderContent,
                    include: [ ToastieStock ]
                  }
                ]
              },
              {
                model: User
              }
            ]
          }
        ]
      });
    } catch (error) {
      console.log(error);
      return {};
    }

    // Process the existing orders into a better format
    const transformedOrders = existingOrders.map(order => {
      const { orderId, completed, createdAt, ShopOrder } = order;
      const { User, ShopOrderContents } = ShopOrder;

      const items = ShopOrderContents.map(sub => {
        const { ToastieOrderContents } = sub;

        const inner = ToastieOrderContents.map(i => {
          const { completed, ToastieStock, quantity } = i;
          const { name } = ToastieStock;

          return { name, quantity, completed };
        });

        const part = {
          toastie: inner.length !== 1,
          components: inner
        }

        return part;
      });

      const displayName = makeDisplayName(User);

      return {
        id: orderId, completed, createdAt, displayName, items
      }
    });

    let toastieOpenRecord;

    try {
      toastieOpenRecord = await PersistentVariable.findOne({ where: { key: "TOASTIE_OPEN" } });
    } catch (error) {
      return {};
    }

    // open to do
    socket.emit("toastieInitialData", { transformedOrders, open: toastieOpenRecord.booleanStorage });
  });

  socket.on("markToastieOrderCompleted", async (data) => {
    if(!hasPermission(socket.handshake.session, "toastie.stock.edit")) {
      socket.disconnect();
      return;
    }

    const { orderId } = data;

    try {
      await ToastieOrderTracker.update({ completed: true }, {
        where: { orderId }
      })
    } catch (error) {
      console.log(error);
      return {};
    }

    io.to("toastieOrderClients").emit("toastieOrderCompleted", data);
  });

  socket.on("setToastieOpen", async (data) => {
    if(!hasPermission(socket.handshake.session, "toastie.stock.edit")) {
      socket.disconnect();
      return;
    }

    const { open } = data;

    try {
      await PersistentVariable.update({ booleanStorage: open }, {
        where: { key: "TOASTIE_OPEN" }
      });
    } catch (error) {
      // TODO: handle
      return {};
    }

    io.to("toastieOrderClients").emit("toastieOpenChanged", data);
  });
}

module.exports = { setupEvents };
