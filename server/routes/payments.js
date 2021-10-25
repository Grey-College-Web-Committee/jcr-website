/**
* This file handles the data received from Stripe when a user pays.
**/

// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();

const { User, Address, ToastieOrder, ToastieStock, ToastieOrderContent, ShopOrder, ShopOrderContent, StashOrder, StashStock, StashColours, StashOrderCustomisation, GymMembership, Permission, PermissionLink, EventTicket, EventGroupBooking, Debt, ToastieOrderTracker } = require("../database.models.js");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const bodyParser = require('body-parser');
const mailer = require("../utils/mailer");
const dateFormat = require("dateformat")

// Basic function to prepare an email to be sent
const customerToastieEmail = (user, orderId, toasties, extras) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<h1>Order Received</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your order has been confirmed and sent to the Toastie Bar.</p>`);
  message.push(`<p>Please come and collect it in around 10 minutes (please note times may differ based on how busy the toastie bar is and this is only a guide).</p>`);
  message.push(`<h2>Order Details</h2>`);

  if(toasties.length !== 0) {
    message.push(`<h3>Toasties</h3>`);
    toasties.forEach((toastie, i) => {
      message.push(`<h4>Toastie #${i + 1}</h4>`);
      message.push(`<p>Bread: ${toastie.bread.name}</p>`);
      message.push(`<ul>`);

      toastie.fillings.forEach((filling, i) => {
        message.push(`<li>${filling.name}</li>`);
      });

      message.push(`</ul>`);
    });
  }

  if(extras.length !== 0) {
    message.push(`<h3>Extras</h3>`);
    message.push(`<ul>`);

    extras.forEach((extra, i) => {
      message.push(`<li>${extra.quantity} x ${extra.name}</li>`);
    });

    message.push(`</ul>`);
  }

  message.push(`<p>You will receive a receipt from Stripe confirming your payment.</p>`);
  message.push(`<p><strong>Thank you for your order!</strong></p>`);

  return message.join("");
}

// Basic function to prepare an email to be sent
const staffToastieEmail = (user, orderId, toasties, extras) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<h1>Order Received</h1>`);
  message.push(`<p>Payment received at ${dateFormat(new Date(), "dd/mm/yyyy HH:MM")}</p>`);
  message.push(`<p>Ordered by: ${firstName} ${lastName}</p>`);
  message.push(`<h2>Order Details</h2>`);

  if(toasties.length !== 0) {
    message.push(`<h3>Toasties</h3>`);
    toasties.forEach((toastie, i) => {
      message.push(`<h4>Toastie #${i + 1}</h4>`);
      message.push(`<p>Bread: ${toastie.bread.name}</p>`);
      message.push(`<ul>`);

      toastie.fillings.forEach((filling, i) => {
        message.push(`<li>${filling.name}</li>`);
      });

      message.push(`</ul>`);
    });
  }

  if(extras.length !== 0) {
    message.push(`<h3>Extras</h3>`);
    message.push(`<ul>`);

    extras.forEach((extra, i) => {
      message.push(`<li>${extra.quantity} x ${extra.name}</li>`);
    });

    message.push(`</ul>`);
  }

  return message.join("");
}

const fulfilToastieOrders = async (user, orderId, relatedOrders, deliveryInformation, io) => {
  let extras = [];
  let toasties = [];

  // Prepares the order to be sent to the toastie bar
  for(let i = 0; i < relatedOrders.length; i++) {
    const order = relatedOrders[i];
    const { id, additional } = order;

    let orderContent;

    try {
      orderContent = await ToastieOrderContent.findAll({
        where: { orderId: id },
        include: [ ToastieStock ]
      });
    } catch (error) {
      return;
    }

    if(orderContent.length === 1) {
      // we have a non-toastie
      const item = orderContent[0];
      const { quantity } = item.dataValues;
      const { name } = item.ToastieStock;

      extras.push({ name, quantity });
    } else {
      // we have a toastie
      const bread = orderContent.filter(item => item.ToastieStock.type === "bread")[0].ToastieStock;
      const fillings = orderContent.filter(item => item.ToastieStock.type === "filling").map(filling => filling.ToastieStock);
      toasties.push({ quantity: 1, bread, fillings });
    }
  }

  const customerEmail = customerToastieEmail(user, orderId, toasties, extras);
  mailer.sendEmail(user.email, `Toastie Bar Order Confirmation`, customerEmail);

  let entry;

  // Create the order tracker entry
  try {
    entry = await ToastieOrderTracker.create({
      orderId,
      completed: false,
      tableNumber: 0
    });
  } catch (error) {
    console.log(error);
  }

  const extrasFormatted = extras.map(extra => {
    return {
      toastie: false,
      components: [
        {
          name: extra.name,
          quantity: extra.quantity,
          completed: false
        }
      ]
    }
  });

  const toastiesFormatted = toasties.map(toastie => {
    let components = [];

    components.push({
      name: toastie.bread.name,
      quantity: 1,
      completed: false
    });

    let fillings = toastie.fillings.map(filling => {
      return {
        name: filling.name,
        quantity: 1,
        completed: false
      }
    });

    components = components.concat(fillings);

    return {
      toastie: true,
      components
    }
  });

  // Create their display name
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();

  const items = toastiesFormatted.concat(extrasFormatted);

  // Send the order to all of the registered toastie clients via the websocke
  io.to("toastieOrderClients").emit("toastieNewOrder", {
    completed: false,
    id: orderId,
    displayName: `${firstName} ${lastName}`,
    createdAt: entry.createdAt,
    items
  });
}

// Convert size into display names
const translateSize = (size) => {
  switch(size) {
    case "WS8":
      return "Women's Size 8";
    case "WS10":
      return "Women's Size 10";
    case "WS12":
      return "Women's Size 12";
    case "WS14":
      return "Women's Size 14";
    case "WS16":
      return "Women's Size 16";
    case "WS18":
      return "Women's Size 18";
    default:
      return size;
  }
}

// Basic function to prepare an email to be sent
const customerStashEmail = (user, orderId, relatedOrders, deliveryInformation) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  const customisationValidChoices = [
    "Back Print: Grey College or Durham University",
    "Leg Print: Grey College or Durham University",
    "Back Embroidery: Grey College or Durham University",
    "Back Embroidery Personalised",
    "Right Breast/Small Item Personalisation"
  ];

  message.push(`<h1>Stash Order Received</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your order has been confirmed and registered with the JCR.</p>`);

  if(deliveryInformation.option === "delivery") {
    message.push(`<h2>Delivery Information</h2>`);
    message.push(`<p>You have opted for delivery. The stash company will send this to your address as soon as possible.</p>`);
    message.push(`<h3>Address</h3>`);
    message.push(`<p>${deliveryInformation.address.recipient}</p>`);
    message.push(`<p>${deliveryInformation.address.line1}</p>`);
    message.push(`<p>${deliveryInformation.address.line2}</p>`);
    message.push(`<p>${deliveryInformation.address.city}</p>`);
    message.push(`<p>${deliveryInformation.address.postcode}</p>`);
  } else {
    message.push(`<h2>Collection Information</h2>`);
    message.push(`<p>Once the stash has arrived and is ready for collection the JCR secretary will be in touch!</p>`);
  }

  message.push(`<h2>Order Details</h2>`);

  relatedOrders.forEach((order, i) => {
    message.push(`<h3>${order.StashStock.name} (Qty: ${order.quantity})</h3>`);
    message.push(`<p>Size: ${translateSize(order.size)}</p>`);
    message.push(`<p>Shield Or Crest: ${order.shieldOrCrest === 1 ? "Crest" : "Shield"}</p>`);
    message.push(`<p>Under Shield/Crest Text: ${order.underShieldText}</p>`);

    if(order.colourId !== null) {
      message.push(`<p>Colour: ${order.StashColour.name}</p>`);
    }

    if(order.StashOrderCustomisations !== null && order.StashOrderCustomisations.length !== 0) {
      message.push(`<h4>Personalisation</h4>`);
      order.StashOrderCustomisations.forEach(cust => {
        message.push(`<p>${customisationValidChoices[cust.type]}: ${cust.text}</p>`);
      });
    }
  });

  message.push(`<p>You will receive a receipt from Stripe confirming your payment.</p>`)
  message.push(`<p><strong>Thank you for your order!</strong></p>`);

  return message.join("");
}

const fulfilStashOrders = (user, orderId, relatedOrders, deliveryInformation, io) => {
  // Simply sends a confirmation email
  const customerEmail = customerStashEmail(user, orderId, relatedOrders, deliveryInformation);
  mailer.sendEmail(user.email, `Stash Order Confirmation`, customerEmail);
}

// Basic function to prepare an email to be sent
const customerGymEmail = (user, orderId, order) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<h1>Gym Order Received</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your order has been confirmed and registered with the JCR.</p>`);
  message.push(`<p>Access to the gym will be granted soon!</p>`);
  message.push(`<p>Your access will expire on ${dateFormat(order.expiresAt, "dd/mm/yyyy")}</p>`);
  message.push(`<p>You will receive a receipt from Stripe confirming your payment.</p>`)
  message.push(`<p><strong>Thank you for your order!</strong></p>`);

  return message.join("");
}

// Basic function to prepare an email to be sent
const facsoGymEmail = (user, orderId, order) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Name: ${firstName} ${lastName},</p>`);
  message.push(`<p>Username: ${user.username}</p>`);
  message.push(`<p>Expires on ${dateFormat(order.expiresAt, "dd/mm/yyyy")}</p>`);

  return message.join("");
}

const facsoParqGymEmail = (user, orderId, order, parq) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Name: ${firstName} ${lastName},</p>`);
  message.push(`<p>Username: ${user.username}</p>`);
  message.push(`<p>Expires on ${dateFormat(order.expiresAt, "dd/mm/yyyy")}</p>`);

  message.push(`<p>This person answered yes to the following questions:</p>`);
  message.push(`<ul>`);

  parq.forEach(q => {
    message.push(`<li>${q}</li>`);
  });

  message.push(`</ul>`);
  return message.join("");
}

const fulfilGymOrders = async (user, orderId, relatedOrders, deliveryInformation, io) => {
  // Just checks for the membership and sends emails
  let membershipRecord;

  try {
    membershipRecord = await GymMembership.findOne({
      where: {
        orderId
      }
    });
  } catch (error) {
    console.log(error);
    return;
  }

  if(membershipRecord === null) {
    console.log("NULL MR");
    return;
  }

  const parqResponses = JSON.parse(membershipRecord.parq);

  if(parqResponses.filter(p => Number(p) === 1)) {
    const parqQuestions = ["Do you have a heart condition that you should only do physical activity recommended by a doctor?", "Do you feel pain in your chest when you do physical activity?", "In the past month, have you had chest pain when not doing physical activity?", "Do you lose balance because of dizziness or do you ever lose consciousness?", "Do you have a bone or joint problem that could be worsened by a change in physical activity?", "Is your doctor currently prescribing medication for your blood pressure or heart condition?", "Do you know of any other reason why you shouldn’t take part in physical activity?"];

    const failedQuestions = parqQuestions.reduce((acc, val, index) => {
      if(Number(parqResponses[index]) === 1) {
        acc.push(val);
      }

      return acc;
    }, []);

    const facsoParqEmail = facsoParqGymEmail(user, orderId, membershipRecord, failedQuestions);
    mailer.sendEmail("grey.website@durham.ac.uk", "Gym PARQ Failed", facsoParqEmail)
  } else {
    const facsoEmail = facsoGymEmail(user, orderId, membershipRecord);
    mailer.sendEmail("grey.website@durham.ac.uk", "Gym Membership Purchased", facsoEmail)
  }

  const customerEmail = customerGymEmail(user, orderId, membershipRecord);
  mailer.sendEmail(user.email, `Gym Membership Confirmation`, customerEmail);
}

// Basic function to prepare an email to be sent
const customerJCRMembershipEmail = (user, orderId, expiresAt) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<h1>Welcome to the JCR!</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your membership has been confirmed and registered with the JCR.</p>`);
  message.push(`<p>Please logout and back into the website to gain access to the JCR services!</p>`);
  message.push(`<p>Your membership will expire on ${dateFormat(expiresAt, "dd/mm/yyyy")}</p>`);
  message.push(`<p>You will receive a receipt from Stripe confirming your payment.</p>`);
  message.push(`<p><strong>Thank you!</strong></p>`);

  return message.join("");
}

// Basic function to prepare an email to be sent
const facsoJCRMembershipEmail = (user, orderId, expiresAt) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Email: ${user.email}</p>`);
  message.push(`<p>Username: ${user.username}</p>`);
  message.push(`<p>Name: ${firstName} ${lastName}</p>`);
  message.push(`<p>Expires At: ${dateFormat(expiresAt, "dd/mm/yyyy")}</p>`)

  return message.join("");
}

const fulfilJCRMembershipOrders = async (user, orderId, relatedOrders, deliveryInformation, io) => {
  // Some of these checks are obsolete
  if(relatedOrders.length !== 1) {
    console.log("Many memberships?");
    return;
  }

  const type = relatedOrders[0].additional;

  if(type === null) {
    console.log("NULL TYPE");
    return;
  }

  // Needs updating yearly
  const currentMembershipOptions = {
    one_year: {
      expires: new Date("2022-08-01"),
      price: 56
    },
    two_year: {
      expires: new Date("2023-08-01"),
      price: 112
    },
    three_year: {
      expires: new Date("2024-08-01"),
      price: 168
    },
    four_year: {
      expires: new Date("2025-08-01"),
      price: 208
    }
  };

  let userRecord;

  try {
    userRecord = await User.findOne({
      where: {
        id: user.id
      }
    });
  } catch (error) {
    console.log({error});
    return;
  }

  // Update the user record to reflect their status
  userRecord.membershipExpiresAt = currentMembershipOptions[type].expires;

  try {
    await userRecord.save();
  } catch (error) {
    console.log({error});
    return;
  }

  let permissionRecord;

  // Gives them the permission needed to access some pages on the website
  try {
    permissionRecord = await Permission.findOne({
      where: {
        internal: "jcr.member"
      }
    });
  } catch (error) {
    console.log({error});
    return;
  }

  if(permissionRecord === null) {
    console.log("NULL PR");
    return;
  }

  try {
    await PermissionLink.create({
      grantedToId: userRecord.id,
      permissionId: permissionRecord.id,
      grantedById: 1
    });
  } catch (error) {
    console.log({error});
    return;
  }

  // Send confirmation emails
  const customerEmail = customerJCRMembershipEmail(user, orderId, currentMembershipOptions[type].expires);
  mailer.sendEmail(user.email, `JCR Membership Confirmation`, customerEmail);

  const facsoEmail = facsoJCRMembershipEmail(user, orderId, currentMembershipOptions[type].expires);
  mailer.sendEmail("grey.treasurer@durham.ac.uk", `New JCR Membership Purchased (${user.username})`, facsoEmail);
}

const fulfilDebtOrders = async (user, orderId, relatedOrders, deliveryInformation, io) => {
  // Remove the debt record and the debt permission

  let debtPermission;

  // Get the permission so we can have the ID of it
  try {
    debtPermission = await Permission.findOne({ where: { internal: "debt.has" } });
  } catch (error) {
    return;
  }

  if(debtPermission === null) {
    return;
  }

  // Remove the permission link
  try {
    await PermissionLink.destroy({
      where: {
        permissionId: debtPermission.id,
        grantedToId: user.id
      }
    });
  } catch (error) {
    return;
  }

  // Remove the debt
  try {
    await Debt.destroy({
      where: {
        username: user.username
      }
    });
  } catch (error) {
    return;
  }

  // Sends the FACSO an email
  const debtFacsoEmail = createFacsoDebtEmail(user);
  mailer.sendEmail("grey.treasurer@durham.ac.uk", `Debt Cleared (${user.username})`, debtFacsoEmail);
}

// Basic function to prepare an email to be sent
const createFacsoDebtEmail = (user) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>${firstName} ${lastName} (Username: ${user.username}) has cleared their debt</p>`);
  return message.join("");
}

// Basic function to prepare an email to be sent
const awaitingEventPaymentsEmail = (user, notPaid, groupCreatedAtDate) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  const paymentClose = new Date(new Date(groupCreatedAtDate).getTime() + 1000 * 60 * 60 * 24)

  message.push(`<p>Hello ${firstName} ${lastName},`);
  message.push(`<p>Your payment has been authorised successfully and a hold has been placed on your card.</p>`);
  message.push(`<p>Once all of your group has authorised their payments we will take the held amount from your account.</p>`);
  message.push(`<p>Not everyone in the group has done this yet and <strong>they have until ${dateFormat(paymentClose, "dd/mm/yyyy HH:MM")} to do this otherwise your booking will be cancelled</strong>. If this happens the hold will be released from your card and you will not be charged.<p>`);
  message.push(`<p>The remaining members of your group who have not paid are:</p>`);
  message.push(`<ul>`);

  notPaid.forEach((record, i) => {
    if(record.isGuestTicket) {
      message.push(`<li>${record.guestName} (Guest)</li>`);
      return;
    }

    let firstNameNotPaid = record.User.firstNames.split(",")[0];
    firstNameNotPaid = firstNameNotPaid.charAt(0).toUpperCase() + firstNameNotPaid.substr(1).toLowerCase();
    const lastNameNotPaid = record.User.surname.charAt(0).toUpperCase() + record.User.surname.substr(1).toLowerCase();

    message.push(`<li>${firstNameNotPaid} ${lastNameNotPaid}</li>`);
  });


  message.push(`</ul>`);
  message.push(`<p>Please encourage them to authorise their payment before the deadline!</p>`);
  message.push(`<p><strong>Thank you!</strong></p>`);

  return message.join("");
}

const processEventHold = async (ticketId) => {
  // Event tickets are different as we place a hold on their card
  // This sends emails and then eventually takes the money once all of the holds
  // are placed
  let purchasedTicket;

  // Get the ticket related to the ticketId
  try {
    purchasedTicket = await EventTicket.findOne({
      where: { id: ticketId },
      include: [ User, EventGroupBooking ]
    });
  } catch (error) {
    return {
      status: 500,
      error: "Unable to contact the database for the event ticket"
    };
  }

  // Make sure it was valid
  // Don't see how this could happen but just in case
  if(purchasedTicket === null) {
    return {
      status: 400,
      error: "Invalid ticket ID"
    };
  }

  // So they have successfully paid (not captured yet though)
  purchasedTicket.paid = true;

  try {
    await purchasedTicket.save();
  } catch (error) {
    return {
      status: 500,
      error: "Unable to contact the database to update the event ticket"
    };
  }

  // Now we need to update the guests as well if they have some

  try {
    await EventTicket.update({ paid: true }, {
      where: {
        bookerId: purchasedTicket.User.id,
        isGuestTicket: true
      }
    });
  } catch (error) {
    return {
      status: 500,
      error: "Unable to contact the database to update the event tickets for the guests"
    };
  }

  // Now lets check if everyone in the group has placed a hold (if so we can capture the payments)

  let groupsTickets;

  try {
    groupTickets = await EventTicket.findAll({
      where: {
        groupId: purchasedTicket.groupId
      },
      include: [ User ]
    });
  } catch (error) {
    return {
      status: 500,
      error: "Unable to contact the database to get all the tickets in the group"
    };
  }

  let allPaid = true;
  let notPaid = [];

  // Start by assuming they all have then loop and change it if necessary
  // Also collect everyone who hasn't paid so we can put it in the email
  for(let ticket of groupTickets) {
    if(!ticket.paid) {
      allPaid = false;
      notPaid.push(ticket);
    }
  }

  // Now we can capture
  if(allPaid) {
    for(let ticket of groupTickets) {
      // We will capture the guests via the lead booker
      if(ticket.isGuestTicket) {
        continue;
      }

      // Can't capture this as this is overridden by the FACSO
      if(ticket.stripePaymentId === "overridden") {
        continue;
      }
      // Capture each payment
      // https://stripe.com/docs/payments/capture-later
      try {
        await stripe.paymentIntents.capture(ticket.stripePaymentId);
      } catch (error) {
        return {
          status: 500,
          error: `Unable to capture the payment for ticket ${ticket.id}`
        };
      }
    }

    // All captured so update the group
    // Will prevent the booking from being deleted
    try {
      await EventGroupBooking.update({ allPaid: true }, {
        where: { id: purchasedTicket.groupId }
      });
    } catch (error) {
      return {
        status: 500,
        error: "Unable to update the group's payment status"
      };
    }

    // All captured so now we can send emails to those who had their payment overridden
    for(let ticket of groupTickets) {
      if(ticket.isGuestTicket) {
        continue;
      }

      if(ticket.stripePaymentId === "overridden") {
        // Send emails to those who had it overridden
        const completedEmail = createCompletedEventPaymentEmail(ticket);
        mailer.sendEmail(ticket.User.email, `Event Booking Confirmation`, completedEmail);
      }
    }

    // This will have triggered the payment_intent.captured event from Stripe
    // we send the emails to non-overridden ones there instead
  } else {
    // Send them an email confirming their hold
    // And list who hasn't paid and how long they have left
    const notPaidEmail = awaitingEventPaymentsEmail(purchasedTicket.User, notPaid, purchasedTicket.createdAt);
    mailer.sendEmail(purchasedTicket.User.email, `Event Ticket Hold Authorised`, notPaidEmail);
  }

  return {
    status: 204,
    error: ""
  };
}

// Basic function to prepare an email to be sent
const createCompletedEventPaymentEmail = (ticket) => {
  // This email will be sent once we capture the hold amount
  let firstName = ticket.User.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = ticket.User.surname.charAt(0).toUpperCase() + ticket.User.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<p>Hello ${firstName} ${lastName},`);
  message.push(`<p>Everybody in your group has successfully paid for their ticket!</p>`);
  message.push(`<p>This email is confirmation of your booking.</p>`);
  message.push(`<p><strong>Thank you!</strong></p>`);

  return message.join("");
}

// Basic function to prepare an email to be sent
const sendCompletedEventPaymentEmail = async (ticketId) => {
  let purchasedTicket;

  // Get their ticket
  try {
    purchasedTicket = await EventTicket.findOne({
      where: { id: ticketId },
      include: [ User ]
    });
  } catch (error) {
    return {
      status: 500,
      error: "Unable to contact the database for the event ticket"
    };
  }

  if(purchasedTicket === null) {
    return {
      status: 400,
      error: "Invalid ticket ID"
    };
  }

  // Won't email guests
  if(purchasedTicket.isGuestTicket) {
    return {
      status: 200,
      error: ""
    }
  }

  // Send them the email to confirm everyone has paid
  const completedEmail = createCompletedEventPaymentEmail(purchasedTicket);
  mailer.sendEmail(purchasedTicket.User.email, `Event Booking Confirmation`, completedEmail);

  return {
    status: 200,
    error: ""
  }
}

// If you add a new shop you need to add the fulfil function to here
const fulfilOrderProcessors = {
  "toastie": fulfilToastieOrders,
  "stash": fulfilStashOrders,
  "gym": fulfilGymOrders,
  "jcr_membership": fulfilJCRMembershipOrders,
  "debt": fulfilDebtOrders
}

// bodyParser is needed as otherwise Stripe isn't able to verify the signature which is important
router.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (error) {
    return res.status(400).json({ error: "Webhook signature verification failed "});
  }

  const paymentIntent = event.data.object;

  switch(event.type) {
    case "payment_intent.succeeded":
      if(!paymentIntent.metadata) {
        return res.status(400).end();
      }

      // Happens for the GCCFS donations from SquareSpace
      // We don't want to handle these but 400 is an error
      // and Stripe will eventually shut down the endpoint
      if(paymentIntent.metadata.hasOwnProperty("websiteId")) {
        return res.status(204).end();
      }

      // This is for the events
      // Occurs when they all have placed their holds
      if(paymentIntent.metadata.hasOwnProperty("ticketId")) {
        const emailResult = await sendCompletedEventPaymentEmail(paymentIntent.metadata.ticketId);

        if(emailResult.status !== 200 || emailResult.status !== 204) {
          return res.status(emailResult.status).json({ error: emailResult.error });
        }

        return res.status(204).end();
      }

      if(!paymentIntent.metadata.hasOwnProperty("orderId")) {
        return res.status(400).end();
      }

      if(!paymentIntent.metadata.hasOwnProperty("usedShops")) {
        return res.status(400).end();
      }

      const { orderId } = paymentIntent.metadata;
      const usedShops = JSON.parse(paymentIntent.metadata.usedShops);

      // Start by updating the database to show they have paid

      let order;

      try {
        order = await ShopOrder.findOne({ where: { id: orderId }});
      } catch (error) {
        return res.status(500).json({ error });
      }

      if(order === null) {
        return res.status(500).json({ error: "Null order" });
      }

      order.stripeId = paymentIntent.id;
      order.paid = true;

      try {
        await order.save();
      } catch (error) {
        return res.status(500).json({ error: "Unable to save order"});
      }

      const { deliveryOption, deliveryAddressId } = order;
      let deliveryInformation = {
        option: deliveryOption,
        address: null
      }

      if(deliveryOption === "delivery") {
        if(deliveryAddressId === undefined || deliveryAddressId === null || deliveryAddressId === "-1") {
          return res.status(500).json({ error: "Error with addresses" });
        }

        let addressRecord;

        try {
          addressRecord = await Address.findOne({ where: { id: deliveryAddressId }});
        } catch (error) {
          return res.status(500).json({ error: "Unable to find address" });
        }

        deliveryInformation.address = addressRecord.dataValues;
      }

      let user;

      try {
        user = await User.findOne({ where: { id: order.userId } });
      } catch (error) {
        return res.status(500).json({ error });
      }

      if(user === null) {
        return res.status(500).json({ error: "No user" });
      }

      user = user.dataValues;

      // Get the sub order IDs

      let subOrders;

      try {
        subOrders = await ShopOrderContent.findAll({ where: { orderId } });
      } catch (error) {
        return res.status(500).json({ error });
      }

      let stashOrders;

      try {
        stashOrders = await StashOrder.findAll({
          where: { orderId },
          include: [
            StashStock,
            StashColours,
            StashOrderCustomisation
          ]
        });
      } catch (error) {
        return res.status(500).json({ error });
      }

      if(subOrders.length === 0 && stashOrders.length === 0) {
        return res.status(500).json({ error: "No suborders" });
      }

      subOrders = subOrders.map(order => order.dataValues);

      usedShops.forEach(async shop => {
        const relatedOrders = subOrders.filter(order => order.shop === shop);

        if(relatedOrders.length !== 0) {
          await fulfilOrderProcessors[shop](user, orderId, relatedOrders, deliveryInformation, req.io);
        }
      });

      stashOrders = stashOrders.map(order => order.dataValues);

      if(stashOrders.length !== 0) {
        fulfilOrderProcessors["stash"](user, orderId, stashOrders, deliveryInformation, req.io);
      }

      break;
    case "payment_intent.amount_capturable_updated":
      // This is called when a hold is placed on the card i.e. an event ticket

      if(!paymentIntent.metadata) {
        return res.status(400).end();
      }

      // Make sure we have a ticketId
      if(!paymentIntent.metadata.hasOwnProperty("ticketId")) {
        return res.status(400).end();
      }

      const { ticketId } = paymentIntent.metadata;
      const result = await processEventHold(ticketId);

      if(result.status !== 200 || result.status !== 204) {
        return res.status(result.status).json({ error: result.error });
      }

      break;
    default:
      break;
  }

  return res.status(204).end();
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
