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
class ToastieOrderTracker extends Model {}

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

class Complaint extends Model {}

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

class CareersPost extends Model {}

class Feedback extends Model {}

class BarDrinkType extends Model {}
class BarDrinkSize extends Model {}
class BarBaseDrink extends Model {}
class BarDrink extends Model {}
class BarMixer extends Model {}
class BarOrder extends Model {}
class BarOrderContent extends Model {}
class BarBooking extends Model {}
class BarBookingGuest extends Model {}
class BarCordial extends Model {}

class PersistentVariable extends Model {}

// A role in the JCR, covers everything from Exec, Reps, Officers to committees
class JCRRole extends Model {}
// Link a user to the role, many users can be linked to one role (e.g. Senior Welfare)
class JCRRoleUserLink extends Model {}
// A committee in the JCR
class JCRCommittee extends Model {}
// Links a role to a committee
class JCRCommitteeRoleLink extends Model {}

// Folder for documents
class JCRFolder extends Model {}
// Represents a file
class JCRFile extends Model {}

class SportAndSoc extends Model {}

class PendingUserApplication extends Model {}
class PendingAlumniApplication extends Model {}

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
  },
  profilePicture: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
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
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, { sequelize, timestamps: false });

ToastieOrderTracker.init({
  orderId: {
    type: DataTypes.INTEGER,
    references: {
      model: ShopOrder,
      key: 'id'
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  tableNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { sequelize });

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
  },
  parq: {
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
    type: DataTypes.DECIMAL(6, 2),
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
  },
  inviteOnly: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  allPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, { sequelize });

EventTicket.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
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

CareersPost.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  emailSubject: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, { sequelize });

Complaint.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  signatureLink:  {
    type: DataTypes.TEXT,
    allowNull: false
  },
}, { sequelize });

Feedback.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  type: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  subject: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  anonymous: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  agreement: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, { sequelize, freezeTableName: true });

BarDrinkType.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  allowsMixer: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  allowsCordial: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, { sequelize });

BarDrinkSize.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { sequelize });

BarBaseDrink.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  typeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BarDrinkType,
      key: 'id'
    }
  },
  available: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, { sequelize });

BarDrink.init({
  baseDrinkId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BarBaseDrink,
      key: 'id'
    }
  },
  sizeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BarDrinkSize,
      key: 'id'
    }
  },
  price: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  }
}, { sequelize });

BarMixer.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  available: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  }
}, { sequelize });

BarCordial.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  available: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  }
}, { sequelize });

BarOrder.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  tableNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  paid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 0
  }
}, { sequelize });

BarOrderContent.init({
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BarOrder,
      key: 'id'
    }
  },
  drinkId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BarDrink,
      key: 'id'
    }
  },
  mixerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: BarMixer,
      key: 'id'
    }
  },
  cordialId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: BarCordial,
      key: 'id'
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { sequelize });

PersistentVariable.init({
  key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  booleanStorage: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null
  },
  textStorage: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  dateStorage: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  intStorage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  }
}, { sequelize });

JCRRole.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  descriptionEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  }
}, { sequelize });

JCRRoleUserLink.init({
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: JCRRole,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, { sequelize });

JCRCommittee.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { sequelize });

JCRCommitteeRoleLink.init({
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: JCRRole,
      key: 'id'
    }
  },
  committeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: JCRCommittee,
      key: 'id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, { sequelize });

JCRFolder.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parent: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: JCRFolder,
      key: 'id'
    }
  }
}, { sequelize });

JCRFile.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  realFileName: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parent: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: JCRFolder,
      key: 'id'
    }
  }
}, { sequelize });

BarBooking.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  requiredTables: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, { sequelize });

BarBookingGuest.init({
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BarBooking,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { sequelize });

SportAndSoc.init({
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  facebook: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  instagram: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  discord: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { sequelize });

PendingUserApplication.init({
  username: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  firstName: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  surname: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { sequelize });

PendingAlumniApplication.init({
  username: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  verificationToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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

User.hasMany(Complaint, { foreignKey: 'userId' });
Complaint.belongsTo(User, { foreignKey: 'userId' });

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

User.hasMany(CareersPost, { foreignKey: 'userId' });
CareersPost.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Feedback, { foreignKey: 'userId' });
Feedback.belongsTo(User, { foreignKey: 'userId' });

BarDrinkType.hasMany(BarBaseDrink, { foreignKey: 'typeId' });
BarBaseDrink.belongsTo(BarDrinkType, { foreignKey: 'typeId' });

BarBaseDrink.hasMany(BarDrink, { foreignKey: 'baseDrinkId' });
BarDrink.belongsTo(BarBaseDrink, { foreignKey: 'baseDrinkId' });

BarDrinkSize.hasMany(BarDrink, { foreignKey: 'sizeId' });
BarDrink.belongsTo(BarDrinkSize, { foreignKey: 'sizeId' });

User.hasMany(BarOrder, { foreignKey: 'userId' });
BarOrder.belongsTo(User, { foreignKey: 'userId' });

BarOrder.hasMany(BarOrderContent, { foreignKey: 'orderId' });
BarOrderContent.belongsTo(BarOrder, { foreignKey: 'orderId' });

BarDrink.hasMany(BarOrderContent, { foreignKey: 'drinkId' });
BarOrderContent.belongsTo(BarDrink, { foreignKey: 'drinkId' });

BarMixer.hasMany(BarOrderContent, { foreignKey: 'mixerId' });
BarOrderContent.belongsTo(BarMixer, { foreignKey: 'mixerId' });

BarCordial.hasMany(BarOrderContent, { foreignKey: 'cordialId' });
BarOrderContent.belongsTo(BarCordial, { foreignKey: 'cordialId' });

JCRRole.hasMany(JCRRoleUserLink, { foreignKey: 'roleId' });
JCRRoleUserLink.belongsTo(JCRRole, { foreignKey: 'roleId' });

User.hasMany(JCRRoleUserLink, { foreignKey: 'userId' });
JCRRoleUserLink.belongsTo(User, { foreignKey: 'userId' });

JCRCommittee.hasMany(JCRCommitteeRoleLink, { foreignKey: 'committeeId' });
JCRCommitteeRoleLink.belongsTo(JCRCommittee, { foreignKey: 'committeeId' });

JCRRole.hasMany(JCRCommitteeRoleLink, { foreignKey: 'roleId' });
JCRCommitteeRoleLink.belongsTo(JCRRole, { foreignKey: 'roleId' });

JCRFolder.hasMany(JCRFolder, { foreignKey: 'parent' });
JCRFolder.belongsTo(JCRFolder, { foreignKey: 'parent' });

JCRFolder.hasMany(JCRFile, { foreignKey: 'parent' });
JCRFile.belongsTo(JCRFolder, { foreignKey: 'parent' });

User.hasMany(BarBooking, { foreignKey: 'userId' });
BarBooking.belongsTo(User, { foreignKey: 'userId' });

BarBooking.hasMany(BarBookingGuest, { foreignKey: 'bookingId' });
BarBookingGuest.belongsTo(BarBooking, { foreignKey: 'bookingId' });

ShopOrder.hasMany(ToastieOrderTracker, { foreignKey: 'orderId' });
ToastieOrderTracker.belongsTo(ShopOrder, { foreignKey: 'orderId' });

module.exports = { sequelize, User, Address, ToastieStock, ToastieOrderContent, StashColours, StashSizeChart, StashItemColours, StashStockImages, StashCustomisations, StashStock, StashOrder, Permission, PermissionLink, ShopOrder, ShopOrderContent, StashOrderCustomisation, GymMembership, Election, ElectionCandidate, ElectionVote, ElectionVoteLink, ElectionEditLog, Media, WelfareThread, WelfareThreadMessage, CareersPost, Feedback, Debt, Event, EventImage, EventTicketType, EventGroupBooking, EventTicket, Complaint, BarDrinkType, BarDrinkSize, BarBaseDrink, BarDrink, BarMixer, BarOrder, BarOrderContent, PersistentVariable, JCRRole, JCRRoleUserLink, JCRCommittee, JCRCommitteeRoleLink, JCRFolder, JCRFile, BarBooking, BarBookingGuest, BarCordial, ToastieOrderTracker, SportAndSoc, PendingUserApplication, PendingAlumniApplication };
