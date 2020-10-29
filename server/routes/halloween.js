// Get express and the defined models for use in the endpoints
const express = require("express");
const router = express.Router();
const { User, GymMembership, Transaction, TransactionType } = require("../database.models.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

router.get("/", async (req, res) => {
  const { user } = req.session;

  // Get the user's transactions relating to the Halloween Bookings

  let halloweenUserTransactions;

  try {
    halloweenUserTransactions = await Transaction.findAll({
      where: {
        type: {
          [Op.or]: [TransactionType.halloweenSaturday, TransactionType.halloweenSunday]
        },
        userId: user.id
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error: Unable to query the database for user halloween transactions" });
  }

  // If they have any we need to check they aren't trying to double book

  if(halloweenUserTransactions.length !== 0) {
    let hasSuccessfulBooking = false;
    let hasActiveTransaction = false;
    let booking;

    halloweenUserTransactions.forEach((transaction, index) => {
      if(!transaction.dataValues.completed) {
        hasActiveTransaction = true;
        return;
      }

      if(transaction.dataValues.successful) {
        hasSuccessfulBooking = true;
        booking = transaction;
        return;
      }
    });

    if(hasSuccessfulBooking) {
      return res.status(200).json({ inTransaction: false, hasBooking: true, booking });
    }

    if(hasActiveTransaction) {
      return res.status(200).json({ inTransaction: true, hasBooking: false });
    }
  }

  // Once we are happy that they don't have active bookings we need to check that tickets are available

  let halloweenTransactions;

  try {
    halloweenTransactions = await Transaction.findAll({
      where: {
        type: {
          [Op.or]: [TransactionType.halloweenSaturday, TransactionType.halloweenSunday]
        }
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error: Unable to query the database for halloween transactions" });
  }

  // Could be 0 if they are the first to try

  let saturdayCount = 0;
  let sundayCount = 0;

  if(halloweenTransactions.length !== 0) {
    halloweenTransactions.forEach((transaction, index) => {
      if(transaction.dataValues.type === TransactionType.halloweenSaturday) {
        if(transaction.dataValues.completed) {
          if(transaction.dataValues.successful) {
            // Successful transaction => booked
            saturdayCount++;
          }
        } else {
          // Not completed => In progress
          // Should probably add some check here to see about expiry time
          saturdayCount++;
        }
      } else if (transaction.dataValues.type === TransactionType.halloweenSunday) {
        if(transaction.dataValues.completed) {
          if(transaction.dataValues.successful) {
            // Successful transaction => booked
            sundayCount++;
          }
        } else {
          // Not completed => In progress
          // Should probably add some check here to see about expiry time
          sundayCount++;
        }
      }
    });
  }

  return res.status(200).json({
    hasBooking: false,
    inTransaction: false,
    saturdayCount,
    sundayCount
  });
});

router.get("/all", async (req, res) => {
  const { user } = req.session;

  if(!user.admin) {
    return res.status(403).json({ message: "You do not have permission to perform this action" });
  }

  return res.status(200);
});

// Called when a POST request is to be served at /api/gym/create_stripe_checkout
// This will be used to get the user to the Stripe checkout
router.post("/create_stripe_checkout", async (req, res) => {
  const { user } = req.session;

  const saturday = req.body.saturday;
  let type;

  if(saturday) {
    type = TransactionType.halloweenSaturday;
  } else {
    type = TransactionType.halloweenSunday;
  }

  // Create a new Transaction and get its UUID
  const transaction = await Transaction.create({
    userId: user.id,
    type
  });

  // ** ADD ERROR CHECKING **

  const uuid = transaction.id;

  // We sign the success and failure tokens in JWTs
  // this is needed to prevent them taking the UUID and navigating to
  // success page if their payment actually failed

  const jwtExpiry = process.env.JWT_EXPIRY;

  const successJWT = jwt.sign({ transactionId: uuid, success: true }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: jwtExpiry
  });

  const failureJWT = jwt.sign({ transactionId: uuid, success: false }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: jwtExpiry
  });

  // Connects to Stripe to generate the checkout page
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: (saturday ? "Saturday" : "Sunday") + " Halloween Film Booking (6 Spaces)"
          },
          unit_amount: 2370
        },
        quantity: 1
      }
    ],
    mode: "payment",
    success_url: `${process.env.WEB_ADDRESS}/payments/success/${successJWT}`,
    cancel_url: `${process.env.WEB_ADDRESS}/payments/failure/${failureJWT}`
  });

  // Sends the session ID back so the user can navigate to the page
  res.status(200).json({ id: session.id });
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
