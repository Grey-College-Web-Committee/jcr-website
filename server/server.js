// dotenv is used to access environment vars via process.env.<NAME>
require("dotenv").config();

// These are required for express to work correctly
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { hasPermission } = require("./utils/permissionUtils.js");
// Used to schedule jobs
const CronJob = require("cron").CronJob;

// Routes and database models
const { sequelize, User, Address, ToastieStock, ToastieOrderContent, StashColours, StashSizeChart, StashItemColours, StashStockImages, StashCustomisations, StashStock, StashOrder, Permission, PermissionLink, ShopOrder, ShopOrderContent, StashOrderCustomisation, GymMembership, Election, ElectionCandidate, ElectionVote, ElectionVoteLink, ElectionEditLog, Media, WelfareThread, WelfareThreadMessage, CareersPost, Feedback, Debt, Event, EventImage, EventTicketType, EventGroupBooking, EventTicket, Complaint, BarDrinkType, BarDrinkSize, BarBaseDrink, BarDrink, BarMixer, BarOrder, BarOrderContent, PersistentVariable, JCRRole, JCRRoleUserLink, JCRCommittee, JCRCommitteeRoleLink, JCRFolder, JCRFile } = require("./database.models.js");

const SequelizeStore = require("connect-session-sequelize")(session.Store);
const sharedSession = require("express-socket.io-session");

const authRoute = require("./routes/auth");
const paymentsRoute = require("./routes/payments");
const stashRoute = require("./routes/stash");
const toastieBarRoute = require("./routes/toastie_bar");
const permissionsRoute = require("./routes/permissions");
const cartRoute = require("./routes/cart");
const gymRoute = require("./routes/gym");
const membershipsRoute = require("./routes/memberships");
const electionsRoute = require("./routes/elections");
const mediaRoute = require("./routes/media");
const welfareMessagesRoute = require("./routes/welfare_messages");
const complaintsRoute = require("./routes/complaints");
const eventsRoute = require("./routes/events");
const debtRoute = require("./routes/debt");
const careersRoute = require("./routes/careers");
const feedbackRoute = require("./routes/feedback");
const barRoute = require("./routes/bar");
const jcrRoute = require("./routes/jcr");
const profileRoute = require("./routes/profile");

// Required to deploy the static React files for production
const path = require("path");
const fs = require("fs");

// The cron jobs for the events system
const eventsCron = require("./cron/events_cron");

// Load express
const app = express();

const http = require("http").Server(app);
const io = require("socket.io")(http);
const barSocket = require("./sockets/bar_socket");

io.on("connection", socket => {
  barSocket.setupEvents(socket, io);
});

// Tells express to recognise incoming requests as JSON
app.use((req, res, next) => {
  if(req.originalUrl === "/api/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Attach the socket.io to the request so it can be used in the routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
  store: sequelizeSessionStore,
  cookie: {
    expires: cookieExpiry,
    httpOnly: true
  }
};

if(process.env.NODE_ENV === "production") {
  console.log("Production Mode - Setting secure and proxy for the cookie.");
  sessionConfig.cookie.secure = true;
  sessionConfig.proxy = true;
  app.set("trust proxy", 1);
}

const configuredSession = session(sessionConfig);

app.use(configuredSession);
io.use(sharedSession(configuredSession, {
  autoSave: true
}));

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
    name: "Manage JCR",
    description: "Enables managing of JCR memberships, roles, and committees",
    internal: "jcr.manage"
  },
  {
    name: "Manage Elections",
    description: "Allows creation of elections as well as generating their results",
    internal: "elections.manage"
  },
  {
    name: "Manage Media",
    description: "Allows a user to add and remove media items",
    internal: "media.manage"
  },
  {
    name: "View Anonymous Messages",
    description: "Gives access to the anonymous messages received by the welfare team",
    internal: "welfare.anonymous"
  },
  {
    name: "View Complaints",
    description: "Gives access to view complaints",
    internal: "complaints.manage"
  },
  {
    name: "Manage Events",
    description: "Create, edit, delete and view details about events",
    internal: "events.manage"
  },
  {
    name: "Export Events",
    description: "Export the data for events",
    internal: "events.export"
  },
  {
    name: "Has Debt",
    description: "Denotes a user who owes a debt to the JCR",
    internal: "debt.has"
  },
  {
    name: "Manage Debt",
    description: "View and manage debt owed to the JCR",
    internal: "debt.manage"
  },
  {
    name: "Manage Careers",
    description: "Manage the posts on the careers page",
    internal: "careers.manage"
  },
  {
    name: "Manage Feedback",
    description: "Allows a user to view the feedback submitted",
    internal: "feedback.manage"
  },
  {
    name: "Manage Bar",
    description: "Allows a user to manage the bar stock",
    internal: "bar.manage"
  },
  {
    name: "Manage JCR Files",
    description: "Allows a user to manage the files uploaded for the JCR",
    internal: "jcr.files"
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
  await ElectionEditLog.sync();

  await Media.sync();

  await WelfareThread.sync();
  await WelfareThreadMessage.sync();

  await Complaint.sync();

  await Debt.sync();

  await Event.sync();
  await EventImage.sync();
  await EventTicketType.sync();
  await EventGroupBooking.sync();
  await EventTicket.sync();

  await CareersPost.sync();

  await Feedback.sync();

  await BarDrinkType.sync();
  await BarDrinkSize.sync();
  await BarBaseDrink.sync();
  await BarDrink.sync();
  await BarMixer.sync();
  await BarOrder.sync()
  await BarOrderContent.sync();

  await PersistentVariable.sync();

  await JCRRole.sync();
  await JCRRoleUserLink.sync();
  await JCRCommittee.sync();
  await JCRCommitteeRoleLink.sync();

  await JCRFolder.sync();
  await JCRFile.sync();

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

  await PersistentVariable.findOrCreate({
    where: {
      key: "BAR_OPEN"
    },
    defaults: {
      key: "BAR_OPEN",
      booleanStorage: false
    }
  });
})();

console.log("NODE_APP_INSTANCE:", process.env.NODE_APP_INSTANCE);

// When in cluster mode we only want 1 instance to run the cron job
// PM2 will always set the NODE_APP_INSTANCE env variable for us
// but on local testing there is no need for PM2 so it will be undefined
if(process.env.NODE_APP_INSTANCE === undefined || process.env.NODE_APP_INSTANCE === "0") {
  // ("* * * * *") runs every minute
  // ("0 * * * *") runs every hour
  // TODO Figure out what every hour is shouldn't be too bad
  // Will send the emails for reminder and cancellations (as well as cancel bookings)
  const eventsEmailCronJob = new CronJob("0 * * * *", eventsCron.cancelExpiredBookings);
  eventsEmailCronJob.start();
}

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
app.use("/api/media", isLoggedIn, mediaRoute);
app.use("/api/welfare/messages", isLoggedIn, welfareMessagesRoute);
app.use("/api/complaints", isLoggedIn, complaintsRoute);
app.use("/api/events", isLoggedIn, eventsRoute);
app.use("/api/debt", isLoggedIn, debtRoute);
app.use("/api/careers", isLoggedIn, careersRoute);
app.use("/api/feedback", isLoggedIn, feedbackRoute);
app.use("/api/bar", isLoggedIn, barRoute);
app.use("/api/jcr", isLoggedIn, jcrRoute);
app.use("/api/profile", isLoggedIn, profileRoute);

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

app.get("/uploads/images/stash/:id/:image", isLoggedIn, function(req, res) {
  const { id, image } = req.params;
  res.sendFile(path.join(__dirname, `./uploads/images/stash/${id}/${image}`));
});

app.get("/uploads/images/toastie_bar/:image", isLoggedIn, function(req, res) {
  const image = req.params.image;
  res.sendFile(path.join(__dirname, `./uploads/images/toastie_bar/${image}`));
});

// Make sure they have permission before they view the signature
app.get("/uploads/complaints/signatures/:image", isLoggedIn, function(req, res) {
  const { user } = req.session;

  if(!hasPermission(req.session, "complaints.manage")) {
    return res.status(403).json({ error: "You do not have permission to view this resource" });
  }

  const image = req.params.image;
  res.sendFile(path.join(__dirname, `./uploads/complaints/signatures/${image}`));
});

app.get("/uploads/images/events/:image", isLoggedIn, function(req, res) {
  const image = req.params.image;
  res.sendFile(path.join(__dirname, `./uploads/images/events/${image}`));
});

app.get("/uploads/images/bar/:image", isLoggedIn, function(req, res) {
  const image = req.params.image;
  res.sendFile(path.join(__dirname, `./uploads/images/bar/${image}`));
});

app.get("/uploads/images/profile/:image", isLoggedIn, function(req, res) {
  const image = req.params.image;
  res.sendFile(path.join(__dirname, `./uploads/images/profile/${image}`));
});

app.get("/uploads/jcr/:filename", isLoggedIn, function(req, res) {
  const filename = req.params.filename;

  fs.readFile(path.join(__dirname, `./uploads/jcr/${filename}`), (err, data) => {
    if(err) {
      res.status(404).end();
    } else {
      res.contentType("application/pdf");
      res.send(data);
    }
  });
});

app.get("/elections/manifesto/:filename", isLoggedIn, function(req, res) {
  const filename = req.params.filename;

  fs.readFile(path.join(__dirname, `./manifestos/${filename}`), (err, data) => {
    if(err) {
      res.status(404).end();
    } else {
      res.contentType("application/pdf");
      res.send(data);
    }
  });
});

app.get("/uploads/complaints/procedure", isLoggedIn, function(req, res) {
  fs.readFile(path.join(__dirname, "./uploads/complaints/procedure/complaints_procedure.pdf"), (err, data) => {
    if(err) {
      res.status(404).end();
    } else {
      res.contentType("application/pdf");
      res.send(data);
    }
  });
})

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});


// Listen for requests on the port specified in the .env file
http.listen(process.env.EXPRESS_PORT, () => console.log(`Server started on ${process.env.EXPRESS_PORT}`));
