// Get the exported classes from the sequelize module in node.js
const { Sequelize, Model, DataTypes } = require("sequelize");

// Create an instance of sequelize with the specific database from the .env file
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT
});

// Define the models representing tables in the database
// Note that sequelize will pluralise these for us
// User => users

class User extends Model {}
class Address extends Model {}

class ShopOrder extends Model {}
class ShopOrderContent extends Model {}

class StashColours extends Model {}
class StashSizeChart extends Model {}
class StashStock extends Model {}
class StashCustomisations extends Model {}
class StashItemColours extends Model {}
class StashStockImages extends Model {}
class StashOrder extends Model {}
class StashOrderCustomisation extends Model {}

class ToastieStock extends Model {}
class ToastieOrderContent extends Model {}

class Permission extends Model {}
class PermissionLink extends Model {}

class GymMembership extends Model {}

class Election extends Model {}
class ElectionCandidate extends Model {}
class ElectionVote extends Model {}
class ElectionVoteLink extends Model {}
class ElectionEditLog extends Model {}

class Media extends Model {}

class WelfareThread extends Model {}
class WelfareThreadMessage extends Model {}

// Any historical debt from the old website
class Debt extends Model {}

// Represents a single event
class Event extends Model {}
// Stores the images for the event gallery
class EventImage extends Model {}
// Events may have multiple ticket types
class EventTicketType extends Model {}
// The overarching booking for a group (or individual i.e. group of 1)
class EventGroupBooking extends Model {}
// The individual record for each member of a group (i.e. to track their Stripe payments)
class EventTicket extends Model {}

// Sequelize will automatically add IDs, createdAt and updatedAt

// No need to store a users email it is simply username@durham.ac.uk
// Wouldn't be difficult to add if it is wanted in the future
User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING
  },
  surname: {
    type: DataTypes.STRING
  },
  firstNames: {
    type: DataTypes.STRING
  },
  year: {
    type: DataTypes.INTEGER
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  membershipExpiresAt: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  hlm: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  eventConsent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, { sequelize });

Address.init({
  recipient: {
    type: DataTypes.STRING,
    allowNull: false
  },
  line1: {
    type: DataTypes.STRING,
    allowNull: false
  },
  line2: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postcode: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { sequelize });

StashColours.init({
  name:{
    type: DataTypes.STRING,
    allowNull: false
  },
  colour:{
    type: DataTypes.STRING,
    allowNull: false
  },
  twoTone: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  secondaryColour:{
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "#BE2B2E"
  },
}, { sequelize });

StashSizeChart.init({
  XS: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  S: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  M: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  L: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  XL: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  XXL: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  WS8: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  WS10: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  WS12: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  WS14: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  WS16: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  WS18: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, { sequelize });

StashStock.init({
  manufacturerCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customisationsAvailable: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: false
  },
  price: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  },
  sizeChartId:{
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: StashSizeChart,
      key: 'id'
    }
  }
}, { sequelize, freezeTableName: true });

StashCustomisations.init({
  name:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  productId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StashStock,
      key: 'id'
    }
  },
  customisationChoice: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  addedPriceForCustomisation: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    defaultValue: 0.00
  }
}, { sequelize });

StashItemColours.init({
  productId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StashStock,
      key: 'id'
    }
  },
  colourId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StashColours,
      key: 'id'
    }
  }
}, { sequelize });

StashStockImages.init({
  productId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StashStock,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { sequelize });

ShopOrder.init({
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stripeId: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  deliveryOption: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "none"
  },
  deliveryAddressId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    references: {
      model: Address,
      key: 'id'
    }
  }
}, { sequelize });

ShopOrderContent.init({
  orderId: {
    type: DataTypes.INTEGER,
    references: {
      model: ShopOrder,
      key: 'id'
    }
  },
  shop: {
    type: DataTypes.STRING,
    allowNull: false
  },
  additional: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, { sequelize });

ToastieStock.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  },
  imageName:{
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, { sequelize, freezeTableName: true });

ToastieOrderContent.init({
  orderId: {
    type: DataTypes.INTEGER,
    references: {
      model: ShopOrderContent,
      key: 'id'
    }
  },
  stockId: {
    type: DataTypes.INTEGER,
    references: {
      model: ToastieStock,
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, { sequelize, timestamps: false });

Permission.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  internal: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { sequelize, timestamps: false });

PermissionLink.init({
  permissionId: {
    type: DataTypes.INTEGER,
    references: {
      model: Permission,
      key: 'id'
    }
  }
}, { sequelize, timestamps: true, updatedAt: false });

StashOrder.init({
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ShopOrder,
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      StashStock,
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  size: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shieldOrCrest: { // 0 = Shield, 1 = Crest
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  underShieldText: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Grey College"
  },
  colourId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      model: StashColours,
      key: 'id'
    }
  }
}, { sequelize });

StashOrderCustomisation.init({
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StashOrder,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { sequelize });

GymMembership.init({
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ShopOrder,
      key: 'id'
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { sequelize });

Election.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  manifestoReleaseTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  votingOpenTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  votingCloseTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  winner: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  deepLog: {
    type: DataTypes.TEXT("long")
  },
  roundSummaries: {
    type: DataTypes.TEXT("long")
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, { sequelize });

ElectionCandidate.init({
  electionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Election,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  manifestoLink: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { sequelize });

ElectionVote.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  electionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Election,
      key: 'id'
    }
  }
}, { sequelize });

ElectionVoteLink.init({
  voteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ElectionVote,
      key: 'id'
    }
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ElectionCandidate,
      key: 'id'
    }
  },
  preference: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { sequelize });

ElectionEditLog.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  electionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Election,
      key: 'id'
    }
  },
  action: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { sequelize });

Media.init({
  mediaTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mediaType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mediaCategory: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mediaLink: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mediaDescription:{
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ""
  }
}, { sequelize });

WelfareThread.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  userHash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  lastUpdate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, { sequelize, timestamps: true, updatedAt: false });

WelfareThreadMessage.init({
  threadId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: WelfareThread,
      key: 'id'
    }
  },
  from: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, { sequelize });

Debt.init({
  username: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  debt: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { sequelize });

Event.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shortDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  maxIndividuals: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bookingCloseTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, { sequelize });

EventImage.init({
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Event,
      key: 'id'
    }
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  position: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { sequelize });

EventTicketType.init({
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Event,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  maxOfType: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  minPeople: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  maxPeople: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  maxGuests: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  memberPrice: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  },
  guestPrice: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  },
  requiredInformationForm: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  firstYearReleaseTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  secondYearReleaseTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  thirdYearReleaseTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fourthYearReleaseTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  olderYearsCanOverride: {
    type: DataTypes.BOOLEAN,
    default: true
  }
}, { sequelize });

EventGroupBooking.init({
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Event,
      key: 'id'
    }
  },
  leadBookerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  ticketTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: EventTicketType,
      key: 'id'
    }
  },
  totalMembers: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  firstHoldTime: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  allPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, { sequelize });

EventTicket.init({
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: EventGroupBooking,
      key: 'id'
    }
  },
  bookerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  paid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  stripePaymentId: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  requiredInformation: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  isGuestTicket: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  guestName: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  guestUsername: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  }
}, { sequelize });

// Associations are necessary to allow joins between tables

StashSizeChart.hasMany(StashStock, { foreignKey: 'sizeChartId' });
StashStock.belongsTo(StashSizeChart, { foreignKey: 'sizeChartId' });

StashColours.hasMany(StashItemColours, { foreignKey: 'colourId' });
StashItemColours.belongsTo(StashColours, { foreignKey: 'colourId' });

StashStock.hasMany(StashItemColours, { foreignKey: 'productId' });
StashItemColours.belongsTo(StashStock, { foreignKey: 'productId' });

StashStock.hasMany(StashCustomisations, { foreignKey: 'productId' });
StashCustomisations.belongsTo(StashStock, { foreignKey: 'productId' });

StashStock.hasMany(StashStockImages, { foreignKey: 'productId' });
StashStockImages.belongsTo(StashStock, { foreignKey: 'productId' });

User.hasMany(ShopOrder, { foreignKey: 'userId' });
ShopOrder.belongsTo(User, { foreignKey: 'userId' });

Address.hasMany(ShopOrder, { foreignKey: 'deliveryAddressId' });
ShopOrder.belongsTo(Address, { foreignKey: 'deliveryAddressId' });

ShopOrder.hasMany(ShopOrderContent, { foreignKey: 'orderId' });
ShopOrderContent.belongsTo(ShopOrder, { foreignKey: 'orderId' });

ShopOrderContent.hasMany(ToastieOrderContent, { foreignKey: 'orderId' });
ToastieOrderContent.belongsTo(ShopOrderContent, { foreignKey: 'orderId' });

ToastieStock.hasMany(ToastieOrderContent, { foreignKey: 'stockId' });
ToastieOrderContent.belongsTo(ToastieStock, { foreignKey: 'stockId' });

Permission.hasMany(PermissionLink, { foreignKey: 'permissionId' });
PermissionLink.belongsTo(Permission, { foreignKey: 'permissionId' });

PermissionLink.belongsTo(User, { as: "grantedTo", foreignKey: "grantedToId" });
PermissionLink.belongsTo(User, { as: "grantedBy", foreignKey: "grantedById" });

ShopOrder.hasMany(StashOrder, { foreignKey: 'orderId' });
StashOrder.belongsTo(ShopOrder, { foreignKey: 'orderId' });

StashStock.hasMany(StashOrder, { foreignKey: 'productId' });
StashOrder.belongsTo(StashStock, { foreignKey: 'productId' });

StashColours.hasMany(StashOrder, { foreignKey: 'colourId' });
StashOrder.belongsTo(StashColours, { foreignKey: 'colourId' });

StashOrder.hasMany(StashOrderCustomisation, { foreignKey: 'orderId' });
StashOrderCustomisation.belongsTo(StashOrder, { foreignKey: 'orderId' });

ShopOrder.hasMany(GymMembership, { foreignKey: 'orderId' });
GymMembership.belongsTo(ShopOrder, { foreignKey: 'orderId' });

User.hasMany(GymMembership, { foreignKey: 'userId' });
GymMembership.belongsTo(User, { foreignKey: 'userId' });

Election.hasMany(ElectionCandidate, { foreignKey: 'electionId' });
ElectionCandidate.belongsTo(Election, { foreignKey: 'electionId' });

User.hasMany(ElectionVote, { foreignKey: 'userId' });
ElectionVote.belongsTo(User, { foreignKey: 'userId' });

Election.hasMany(ElectionVote, { foreignKey: 'electionId' });
ElectionVote.belongsTo(Election, { foreignKey: 'electionId' });

ElectionCandidate.hasMany(ElectionVoteLink, { foreignKey: 'candidateId' });
ElectionVoteLink.belongsTo(ElectionCandidate, { foreignKey: 'candidateId' });

ElectionVote.hasMany(ElectionVoteLink, { foreignKey: 'voteId' });
ElectionVoteLink.belongsTo(ElectionVote, { foreignKey: 'voteId' });

User.hasMany(ElectionEditLog, { foreignKey: 'userId' });
ElectionEditLog.belongsTo(User, { foreignKey: 'userId' });

Election.hasMany(ElectionEditLog, { foreignKey: 'electionId' });
ElectionEditLog.belongsTo(Election, { foreignKey: 'electionId' });

WelfareThread.hasMany(WelfareThreadMessage, { foreignKey: 'threadId' });
WelfareThreadMessage.belongsTo(WelfareThread, { foreignKey: 'threadId' });

Event.hasMany(EventImage, { foreignKey: 'eventId' });
EventImage.belongsTo(Event, { foreignKey: 'eventId' });

Event.hasMany(EventTicketType, { foreignKey: 'eventId' });
EventTicketType.belongsTo(Event, { foreignKey: 'eventId' });

Event.hasMany(EventGroupBooking, { foreignKey: 'eventId' });
EventGroupBooking.belongsTo(Event, { foreignKey: 'eventId' });

User.hasMany(EventGroupBooking, { foreignKey: 'leadBookerId' });
EventGroupBooking.belongsTo(User, { foreignKey: 'leadBookerId' });

EventGroupBooking.hasMany(EventTicket, { foreignKey: 'groupId' });
EventTicket.belongsTo(EventGroupBooking, { foreignKey: 'groupId' });

User.hasMany(EventTicket, { foreignKey: 'bookerId' });
EventTicket.belongsTo(User, { foreignKey: 'bookerId' });

EventTicketType.hasMany(EventGroupBooking, { foreignKey: 'ticketTypeId' });
EventGroupBooking.belongsTo(EventTicketType, { foreignKey: 'ticketTypeId' });

module.exports = { sequelize, User, Address, ToastieStock, ToastieOrderContent, StashColours, StashSizeChart, StashItemColours, StashStockImages, StashCustomisations, StashStock, StashOrder, Permission, PermissionLink, ShopOrder, ShopOrderContent, StashOrderCustomisation, GymMembership, Election, ElectionCandidate, ElectionVote, ElectionVoteLink, ElectionEditLog, Media, WelfareThread, WelfareThreadMessage, Debt, Event, EventImage, EventTicketType, EventGroupBooking, EventTicket };
