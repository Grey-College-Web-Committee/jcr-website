// dotenv is used to access environment vars via process.env.<NAME>
require("dotenv").config();

// These are required for express to work correctly
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");

// Routes and database models
const { sequelize, User, Address, ToastieStock, ToastieOrderContent, StashColours, StashSizeChart, StashItemColours, StashStockImages, StashCustomisations, StashStock, StashOrder, Permission, PermissionLink, ShopOrder, ShopOrderContent, StashOrderCustomisation, GymMembership, Election, ElectionCandidate, ElectionVote, ElectionVoteLink } = require("./database.models.js");

const SequelizeStore = require("connect-session-sequelize")(session.Store)

const authRoute = require("./routes/auth");
const paymentsRoute = require("./routes/payments");
const stashRoute = require("./routes/stash");
const toastieBarRoute = require("./routes/toastie_bar");
const permissionsRoute = require("./routes/permissions");
const cartRoute = require("./routes/cart");
const gymRoute = require("./routes/gym");
const membershipsRoute = require("./routes/memberships");
const electionsRoute = require("./routes/elections");

// Required to deploy the static React files for production
const path = require("path");
const fs = require("fs");

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
const cookieExpiry = 3 * 60 * 60 * 1000;

const sequelizeSessionStore = new SequelizeStore({
  db: sequelize
});

let sessionConfig = {
  key: 'user_sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: cookieExpiry
  },
  store: sequelizeSessionStore,
  resave: false
};

if(process.env.NODE_ENV === "production") {
  sessionConfig.cookie.secure = true;
  sessionConfig.proxy = true;
  app.set("trust proxy", 1);
}

app.use(session(sessionConfig));

const requiredPermissions = [
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
  },
  {
    name: "JCR Membership",
    description: "Grants JCR membership",
    internal: "jcr.member"
  },
  {
    name: "Export JCR Memberships",
    description: "Enables exporting of JCR memberships",
    internal: "jcr.export"
  },
  {
    name: "Manage JCR Memberships",
    description: "Enables managing of JCR memberships",
    internal: "jcr.manage"
  },
  {
    name: "Manage Elections",
    description: "Allows creation of elections as well as generating their results",
    internal: "elections.manage"
  }
];

// Initialise the tables
(async() => {
  await sequelizeSessionStore.sync();

  await User.sync();
  await Address.sync();

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

  await Election.sync();
  await ElectionCandidate.sync();
  await ElectionVote.sync();
  await ElectionVoteLink.sync();

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
app.use("/api/memberships", isLoggedIn, membershipsRoute);
app.use("/api/elections", isLoggedIn, electionsRoute);

/** !!! NEVER COMMENT THESE OUT ON MASTER BRANCH !!! **/

// Uncomment /* */ when deploying
// These are for serving production code
// The directory may need to change
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.use(express.static(path.join(__dirname, "../domain_verification")));
app.use(express.static(path.join(__dirname, "./uploads/images/stash")));
app.use(express.static(path.join(__dirname, "./uploads/images/toastie_bar")));
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

app.get("/uploads/images/toastie_bar/:image", function(req, res) {
  const image = req.params.image;
  res.sendFile(path.join(__dirname, `./uploads/images/toastie_bar/${image}`));
});

app.get("/elections/manifesto/:filename", function(req, res) {
  const filename = req.params.filename;

  fs.readFile(path.join(__dirname, `./manifestos/${filename}`), (err, data) => {
    if(err) {
      res.status(404).end();
    } else {
      res.contentType("application/pdf");
      res.send(data);
    }
  })
})

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});


// Listen for requests on the port specified in the .env file
app.listen(process.env.EXPRESS_PORT, () => console.log(`Server started on ${process.env.EXPRESS_PORT}`));
