// dotenv is used to access environment vars via process.env.<NAME>
require("dotenv").config();

// These are required for express to work correctly
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");

// Routes and database models
const { User, StashColours, StashSizeChart, StashItemColours, StashStockImages, StashCustomisations, StashStock, StashOrder, ToastieOrder, ToastieStock, ToastieOrderContent, Permission, PermissionLink, ShopOrder, ShopOrderContent, StashOrderCustomisation, GymMembership } = require("./database.models.js");

const authRoute = require("./routes/auth");
const paymentsRoute = require("./routes/payments");
const stashRoute = require("./routes/stash");
const toastieBarRoute = require("./routes/toastie_bar");
const permissionsRoute = require("./routes/permissions");
const cartRoute = require("./routes/cart");
const gymRoute = require("./routes/gym");

// Required to deploy the static React files for production
const path = require("path");

// Load express
const app = express();

// Tells express to recognise incoming requests as JSON
app.use((req, res, next) => {
  if(req.originalUrl === "/api/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
})
// Manages CORS headers to prevent errors
app.use(cors());
// Allows express to send and receive cookies
app.use(cookieParser());

// Adapted from https://www.codementor.io/@mayowa.a/how-to-build-a-simple-session-based-authentication-system-with-nodejs-from-scratch-6vn67mcy3
// sets the settings for the session
// Be aware that if you change expires you will need to update ./routes/auth.js in the login function
// 2 hours * 60 minutes * 60 seconds * 1000 ms
app.use(session({
  key: 'user_sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 2 * 60 * 60 * 1000
  }
}));

const requiredPermissions = [
  {
    name: "JCR Membership",
    description: "Grants JCR membership",
    internal: "jcr.member"
  },
  {
    name: "Edit Permissions",
    description: "Allows a user to assign permissions to other users",
    internal: "permissions.edit"
  },
  {
    name: "Edit Toastie Stock",
    description: "Enables editing of the Toastie Bar stock",
    internal: "toastie.stock.edit"
  },
  {
    name: "Edit Stash Stock",
    description: "Enables editing of the available stash",
    internal: "stash.stock.edit"
  },
  {
    name: "Export Stash",
    description: "Enables exporting of stash orders",
    internal: "stash.export"
  },
  {
    name: "Export Gym Memberships",
    description: "Enables exporting of gym memberships",
    internal: "gym.export"
  }
];

// Initialise the tables
(async() => {
  await User.sync();
  await Permission.sync();
  await PermissionLink.sync();

  await StashColours.sync();
  await StashSizeChart.sync();
  await StashStock.sync();
  await StashCustomisations.sync();
  await StashItemColours.sync();
  await StashStockImages.sync();

  await ShopOrder.sync();
  await ShopOrderContent.sync();

  await StashOrder.sync();
  await StashOrderCustomisation.sync();

  await ToastieStock.sync();
  await ToastieOrderContent.sync();

  await GymMembership.sync();

  requiredPermissions.forEach(async (item, i) => {
    await Permission.findOrCreate({
      where: {
        internal: item.internal
      },
      defaults: {
        name: item.name,
        description: item.description,
        internal: item.internal
      }
    });
  });
})();

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
// https://www.codementor.io/@mayowa.a/how-to-build-a-simple-session-based-authentication-system-with-nodejs-from-scratch-6vn67mcy3
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie('user_sid');
  }

  next();
});

// Middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
  // They are logged in if they have a valid cookie and the session recognises them
  if(req.session.user && req.cookies.user_sid) {
    return next();
  }

  res.status(401).json({ message: "Not logged in" });
  return;
};

// These are api routes that act as the backend
app.use("/api/auth", authRoute);
app.use("/api/stripe", paymentsRoute);
app.use("/api/stash", isLoggedIn, stashRoute);
app.use("/api/toastie_bar", isLoggedIn, toastieBarRoute);
app.use("/api/permissions", isLoggedIn, permissionsRoute);
app.use("/api/cart", isLoggedIn, cartRoute);
app.use("/api/gym", isLoggedIn, gymRoute);

/** !!! NEVER COMMENT THESE OUT ON MASTER BRANCH !!! **/

// Uncomment /* */ when deploying
// These are for serving production code
// The directory may need to change
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.use(express.static(path.join(__dirname, "../domain_verification")));
app.use(express.static(path.join(__dirname, "./uploads/images/stash")));
// Necessary since things like /gym do not actually exist they are routes
// within the index.html file
//
app.get("/.well-known/apple-developer-merchantid-domain-association", function (req, res) {
  res.sendFile(path.join(__dirname, "../domain_verification", "apple-developer-merchantid-domain-association"));
});

app.get("/uploads/images/stash/:id/:image", function(req, res) {
  const { id, image } = req.params;
  res.sendFile(path.join(__dirname, `./uploads/images/stash/${id}/${image}`));
});

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});


// Listen for requests on the port specified in the .env file
app.listen(process.env.EXPRESS_PORT, () => console.log(`Server started on ${process.env.EXPRESS_PORT}`));
