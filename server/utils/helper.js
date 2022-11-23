const hash = require("object-hash");

const makeDisplayName = (firstNames, surname) => {
    const upperCaseFirstName = firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();
  
    const upperCaseLastName = surname;
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

const processToastieOrder = (order) => {
  let totalPrice = 0;
  let processedOrder = {
    id: order.id,
    customerName: order.User === null ? order.externalCustomerName : makeDisplayName(order.User.firstNames, order.User.surname),
    orderedAt: order.updatedAt,
    completedTime: order.completedTime,
    additionalItems: [],
    toasties: [] // specials will be processed into here
  }

  // Milkshakes first, merge equivalent milkshakes
  let milkshakeQuantities = {};

  for(const milkshake of order.ToastieBarComponentMilkshakes) {
    if(!Object.keys(milkshakeQuantities).includes(milkshake.ToastieBarMilkshake.name)) {
      milkshakeQuantities[milkshake.ToastieBarMilkshake.name] = 0;
    }

    milkshakeQuantities[milkshake.ToastieBarMilkshake.name] += 1;
    totalPrice += Number(milkshake.ToastieBarMilkshake.pricePerUnit);
  }

  // Add the milkshake quantities to the order
  let milkshakes = [];

  for(const milkshakeName of Object.keys(milkshakeQuantities)) {
    milkshakes.push({
      name: milkshakeName,
      quantity: milkshakeQuantities[milkshakeName]
    });
  }

  // On to additional items, merge equivalent items again
  let additionalItemQuantities = {};

  for(const additionalItem of order.ToastieBarComponentAdditionalItems) {
    const remappedName = `${additionalItem.ToastieBarAdditionalStock.name} (${additionalItem.ToastieBarAdditionalStock.ToastieBarAdditionalStockType.name})`;

    if(!Object.keys(additionalItemQuantities).includes(remappedName)) {
      additionalItemQuantities[remappedName] = 0;
    }

    additionalItemQuantities[remappedName] += 1;
    totalPrice += Number(additionalItem.ToastieBarAdditionalStock.pricePerUnit);
  }

  // Add the additional item quantities to the order
  let additionalItems = [];

  for(const additionalItemName of Object.keys(additionalItemQuantities)) {
    additionalItems.push({
      name: additionalItemName,
      quantity: additionalItemQuantities[additionalItemName]
    });
  }

  // Process the custom toasties
  // To merge these, we will hash the toastie object
  let toastieQuantities = {};

  // There could be a slight issue here. If we have a special consisting of X, Y, Z fillings
  // and someone submits the special and a separate toastie with the same fillings X, Y, Z
  // then they could be charged different prices for the special and the custom toastie
  // decided not to do anything about this as it will cause confusion
  for(const toastie of order.ToastieBarComponentToasties) {
    let toastiePrice = 0;

    const bread = toastie.ToastieBarBread.name;
    toastiePrice += Number(toastie.ToastieBarBread.pricePerUnit);

    let fillings = [];

    for(const filling of toastie.ToastieBarComponentToastieFillings) {
      fillings.push(filling.ToastieBarFilling.name);
      toastiePrice += Number(filling.ToastieBarFilling.pricePerUnit);
    }

    const toastieObj = {
      special: null,
      bread, 
      fillings
    }

    const toastieHash = hash(toastieObj);

    if(!Object.keys(toastieQuantities).includes(toastieHash)) {
      toastieQuantities[toastieHash] = {
        quantity: 0,
        ...toastieObj
      }
    }

    toastieQuantities[toastieHash].quantity += 1;
    totalPrice += toastiePrice;
  }

  // Now process the specials, they go into the toasties section with special = Name instead of null
  for(const specialParent of order.ToastieBarComponentSpecials) {
    const special = specialParent.ToastieBarSpecial;
    const bread = specialParent.ToastieBarBread.name;
    const toastiePrice = Number(specialParent.ToastieBarBread.pricePerUnit) + Number(special.priceWithoutBread);

    let fillings = [];

    for(const filling of special.ToastieBarSpecialFillings) {
      fillings.push(filling.ToastieBarFilling.name);
    }

    const toastieObj = {
      special: special.name,
      bread,
      fillings 
    }

    const toastieHash = hash(toastieObj);

    if(!Object.keys(toastieQuantities).includes(toastieHash)) {
      toastieQuantities[toastieHash] = {
        quantity: 0,
        ...toastieObj
      }
    }

    toastieQuantities[toastieHash].quantity += 1;
    totalPrice += toastiePrice;
  }

  // Add the toastie quantities to the order
  let toasties = Object.values(toastieQuantities);

  // Order processed
  processedOrder.totalPrice = totalPrice.toFixed(2);
  processedOrder.milkshakes = milkshakes;
  processedOrder.additionalItems = additionalItems;
  processedOrder.toasties = toasties;

  return processedOrder;
}

module.exports = { makeDisplayName, processToastieOrder };