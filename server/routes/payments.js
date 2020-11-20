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

  return res.status(204).end();
});

generateMessageForTBar = (orderId, firstName, lastName, user, bread, fillings, crisps, chocolates, drinks) => {
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

  message.push(`<h3>Crisps</h3>`);

  if(crisps.length !== 0) {
    message.push(`<ul>`);

    crisps.forEach(item => {
      message.push(`<li>${item.ToastieStock.name}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p><strong>No crisps ordered.</strong></p>`);
  }

  message.push(`<h3>Chocolates</h3>`);

  if(chocolates.length !== 0) {
    message.push(`<ul>`);

    chocolates.forEach(item => {
      message.push(`<li>${item.ToastieStock.name}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p><strong>No chocolates ordered.</strong></p>`);
  }

  message.push(`<h3>Drinks</h3>`);

  if(drinks.length !== 0) {
    message.push(`<ul>`);

    drinks.forEach(item => {
      message.push(`<li>${item.ToastieStock.name}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p><strong>No drinks ordered.</strong></p>`);
  }

  return message.join("");
}

generateMessageForCustomer = (orderId, firstName, lastName, user, bread, fillings, crisps, chocolates, drinks) => {
  let message = [];
  let cost = 0;

  message.push(`<h1>Order Received (Order no. ${orderId})</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your order has been confirmed and sent to the Toastie Bar.</p>`);
  message.push(`<p>Please collect your items from the collection area outside the JCR.</p>`);
  message.push(`<p>There shouldn't be a need to enter the JCR.</p>`);
  message.push(`<p>Please come and collect it in about 10-15 minutes.</p>`);
  message.push(`<h2>Order Details</h2>`);
  message.push(`<h3>Toastie</h3>`);

  let toastieOrdered = bread.length !== 0;

  if(toastieOrdered) {
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
    message.push(`<p>No toastie ordered.</p>`);
  }

  let chocOrDrinkOrdered = false;

  message.push(`<h3>Crisps</h3>`);

  if(crisps.length !== 0) {
    message.push(`<ul>`);

    crisps.forEach(item => {
      cost += Number(item.ToastieStock.price);
      message.push(`<li>${item.ToastieStock.name}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p>No crisps ordered.</p>`);
  }

  message.push(`<h3>Chocolates</h3>`);

  if(chocolates.length !== 0) {
    message.push(`<ul>`);

    chocolates.forEach(item => {
      chocOrDrinkOrdered = true;
      cost += Number(item.ToastieStock.price);
      message.push(`<li>${item.ToastieStock.name}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p>No chocolates ordered.</p>`);
  }

  message.push(`<h3>Drinks</h3>`);

  if(drinks.length !== 0) {
    message.push(`<ul>`);

    drinks.forEach(item => {
      chocOrDrinkOrdered = true;
      cost += Number(item.ToastieStock.price);
      message.push(`<li>${item.ToastieStock.name}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p>No drinks ordered.</p>`);
  }

  if(chocOrDrinkOrdered && toastieOrdered) {
    cost -= 0.2;
    message.push(`<p>A discount of £0.20 was applied to this ordered.</p>`);
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
  let otherItems = orderedItems.filter(item => item.ToastieStock.type === "crisps" || item.ToastieStock.type === "drinks" || item.ToastieStock.type === "chocolates");

  let crisps = orderedItems.filter(item => item.ToastieStock.type === "crisps");
  let chocolates = orderedItems.filter(item => item.ToastieStock.type === "chocolates");
  let drinks = orderedItems.filter(item => item.ToastieStock.type === "drinks");

  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();

  const tbMessage = generateMessageForTBar(orderId, firstName, lastName, user, bread, fillings, crisps, chocolates, drinks);
  mailer.sendEmail(process.env.TOASTIE_BAR_EMAIL_TO, `Toastie Bar Order Received #${orderId}`, tbMessage);

  const customerMessage = generateMessageForCustomer(orderId, firstName, lastName, user, bread, fillings, crisps, chocolates, drinks);
  mailer.sendEmail(user.email, `Toastie Bar Order Confirmation #${orderId}`, customerMessage);
}

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
