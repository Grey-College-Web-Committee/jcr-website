// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, ToastieOrder, ToastieStock, ToastieOrderContent, ShopOrder, ShopOrderContent, StashOrder, StashStock, StashColours, StashOrderCustomisation } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const bodyParser = require('body-parser');
const mailer = require("../utils/mailer");
const dateFormat = require("dateformat")

const customerToastieEmail = (user, orderId, toasties, extras) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<h1>Order Received (Order no. ${orderId})</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your order has been confirmed and sent to the Toastie Bar.</p>`);
  message.push(`<p>Please collect your order from the collection area outside the JCR.</p>`);
  message.push(`<p>There shouldn't be a need to enter the JCR.</p>`);
  message.push(`<p>Please come and collect it in about 10-15 minutes.</p>`);
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

  message.push(`<p>You will receive a receipt from Stripe confirming your payment.</p>`)
  message.push(`<p><strong>Thank you for your order!</strong></p>`);

  return message.join("");
}

const staffToastieEmail = (user, orderId, toasties, extras) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<h1>Order Received (Order no. ${orderId})</h1>`);
  message.push(`<p>Payment received at ${new Date().toLocaleString()}</p>`);
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

const fulfilToastieOrders = async (user, orderId, relatedOrders) => {
  let extras = [];
  let toasties = [];

  for(let i = 0; i < relatedOrders.length; i++) {
    const order = relatedOrders[i];
    const id = order.id;

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

  // Now construct and send the emails
  const staffEmail = staffToastieEmail(user, orderId, toasties, extras);
  mailer.sendEmail(process.env.TOASTIE_BAR_EMAIL_TO, `Toastie Bar Order Received #${orderId}`, staffEmail);

  const customerEmail = customerToastieEmail(user, orderId, toasties, extras);
  mailer.sendEmail(user.email, `Toastie Bar Order Confirmation #${orderId}`, customerEmail);
}

const customerStashEmail = (user, orderId, relatedOrders) => {
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

  message.push(`<h1>Stash Order Received (Order no. ${orderId})</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your order has been confirmed and registered with the JCR.</p>`);
  message.push(`<p>Below is confirmation of your order.</p>`);
  message.push(`<h2>Order Details</h2>`);

  relatedOrders.forEach((order, i) => {
    message.push(`<h3>${order.StashStock.name} (Qty: ${order.quantity})</h3>`);
    message.push(`<p>Size: ${order.size}</p>`);
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

const fulfilStashOrders = (user, orderId, relatedOrders) => {
  const customerEmail = customerStashEmail(user, orderId, relatedOrders);
  mailer.sendEmail(user.email, `Stash Order Confirmation #${orderId}`, customerEmail);
}

const customerGymEmail = (user, orderId, order) => {
  let firstName = user.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = user.surname.charAt(0).toUpperCase() + user.surname.substr(1).toLowerCase();
  let message = [];

  message.push(`<h1>Gym Order Received (Order no. ${orderId})</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your order has been confirmed and registered with the JCR.</p>`);
  message.push(`<p>Access to the gym will be granted soon!</p>`);
  message.push(`<p>Your access will expire on ${dateFormat(order.expiresAt, "dd/mm/yyyy")}</p>`);
  message.push(`<p>You will receive a receipt from Stripe confirming your payment.</p>`)
  message.push(`<p><strong>Thank you for your order!</strong></p>`);

  return message.join("");
}

const fulfilGymOrders = async (user, orderId, relatedOrders) => {
  const customerEmail = customerGymEmail(user, orderId, relatedOrders[0]);
  mailer.sendEmail(user.email, `Gym Order Confirmation #${orderId}`, customerEmail);
}

const fulfilOrderProcessors = {
  "toastie": fulfilToastieOrders,
  "stash": fulfilStashOrders,
  "gym": fulfilGymOrders
}

router.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (error) {
    return res.status(400).json({ error: "Webhook signature verification failed "});
  }

  switch(event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;

      if(!paymentIntent.metadata) {
        return res.status(400).end();
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
          await fulfilOrderProcessors[shop](user, orderId, relatedOrders);
        }
      });

      stashOrders = stashOrders.map(order => order.dataValues);

      if(stashOrders.length !== 0) {
        fulfilOrderProcessors["stash"](user, orderId, stashOrders);
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
