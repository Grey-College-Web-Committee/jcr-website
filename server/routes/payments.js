// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, GymMembership, ToastieOrder, ToastieStock, ToastieOrderContent } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const bodyParser = require('body-parser');
const mailer = require("../utils/mailer");

router.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (error) {
    return res.status(400).json({ "error": "Webhook signature verification failed "});
  }

  switch(event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;

      if(!paymentIntent.metadata) {
        break;
      }

      if(!paymentIntent.metadata.type) {
        break;
      }

      switch(paymentIntent.metadata.type) {
        case "toastie_bar":
          processToastieBarOrder(paymentIntent);
          break;
        default:
          break;
      }

      break;
    default:
      break;
  }

  return res.status(200);
});

generateMessageForTBar = (orderId, firstName, lastName, user, bread, fillings, otherItems) => {
  let message = [];

  message.push(`<h1>Order Received (Order no. ${orderId})</h1>`);
  message.push(`Payment received at ${new Date().toLocaleString()}<br>`);
  message.push(`Ordered by: ${firstName} ${lastName} (${user.username})`);
  message.push(`<h2>Order Details</h2>`);
  message.push(`<h3>Toastie</h3>`);

  if(bread.length !== 0) {
    bread = bread[0];

    message.push(`Bread: ${bread.ToastieStock.name}<br>`);
    message.push(`Fillings:<br>`);
    message.push(`<ul>`);

    fillings.forEach(item => {
      message.push(`<li>${item.ToastieStock.name}</li>`);
    })

    message.push(`</ul>`);
  } else {
    message.push(`<p><strong>No toastie ordered.</strong></p>`);
  }

  message.push(`<h3>Other Items</h3>`);

  if(otherItems.length !== 0) {
    message.push(`<ul>`);

    otherItems.forEach(item => {
      message.push(`<li>${item.ToastieStock.name}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p><strong>No other items ordered.</strong></p>`);
  }

  return message.join("");
}

generateMessageForCustomer = (orderId, firstName, lastName, user, bread, fillings, otherItems) => {
  let message = [];
  let cost = 0;

  message.push(`<h1>Order Received (Order no. ${orderId})</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName}</p>`);
  message.push(`<p>Your ordered has been confirmed and sent to the Toastie Bar</p>`);
  message.push(`<p>Please come and collect it in about 15 minutes</p>`);
  message.push(`<h2>Order Details</h2>`);
  message.push(`<h3>Toastie</h3>`);

  if(bread.length !== 0) {
    bread = bread[0];
    cost += Number(bread.ToastieStock.price);

    message.push(`Bread: ${bread.ToastieStock.name}<br>`);
    message.push(`Fillings:<br>`);
    message.push(`<ul>`);

    fillings.forEach(item => {
      cost += Number(item.ToastieStock.price);
      message.push(`<li>${item.ToastieStock.name}</li>`);
    })

    message.push(`</ul>`);
  } else {
    message.push(`<p><strong>No toastie ordered.</strong></p>`);
  }

  message.push(`<h3>Other Items</h3>`);

  if(otherItems.length !== 0) {
    message.push(`<ul>`);

    otherItems.forEach(item => {
      cost += Number(item.ToastieStock.price);
      message.push(`<li>${item.ToastieStock.name}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p><strong>No other items ordered.</strong></p>`);
  }

  message.push(`<p>The total cost of this order was £${cost.toFixed(2)}`);
  message.push(`<p>You should also receive a receipt from Stripe confirming your payment.</p>`)
  message.push(`<p><strong>Thank you!</strong></p>`);

  return message.join("");
}

processToastieBarOrder = async (paymentIntent) => {
  const stripeId = paymentIntent.id;
  const orderId = paymentIntent.metadata.orderId;
  const order = await ToastieOrder.findOne({ where: { id: orderId } });

  if(order === null) {
    mailer.sendEmail("finlayboyle2001@gmail.com", `Null order #${orderId}`, "Null order received");
    // Something weird has to happen to trigger this.
    // Just email to myself for now. Should never happen though.
    return;
  }

  order.stripeId = stripeId;
  order.paid = true;
  await order.save();

  const user = await User.findOne({ where: { id: order.userId } });
  const orderedItems = await ToastieOrderContent.findAll({
    where: {
      orderId
    },
    include: [ ToastieStock ]
  });

  let bread = orderedItems.filter(item => item.ToastieStock.type === "bread");
  let fillings = orderedItems.filter(item => item.ToastieStock.type === "filling");
  let otherItems = orderedItems.filter(item => item.ToastieStock.type === "other");

  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();

  const tbMessage = generateMessageForTBar(orderId, firstName, lastName, user, bread, fillings, otherItems);
  mailer.sendEmail(process.env.TOASTIE_BAR_EMAIL_TO, `Toastie Bar Order Received #${orderId}`, tbMessage);

  const customerMessage = generateMessageForCustomer(orderId, firstName, lastName, user, bread, fillings, otherItems);
  mailer.sendEmail(user.email, `Toastie Bar Order Confirmation #${orderId}`, customerMessage);
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
