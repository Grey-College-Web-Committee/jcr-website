'database.models.js'
// Get the exported classes from the sequelize module in node.js
const { Sequelize, Model, DataTypes } = require("sequelize");

// Create an instance of sequelise with the specific database from the .env file
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT
});

// Define the models representing tables in the database
// Note that sequelize will pluralise these for us
// User => users

class User extends Model {}

class GymMembership extends Model {}
class StashColours extends Model {}
class StashSizeChart extends Model {}
class StashStock extends Model {}
class StashItemColours extends Model {}
class StashStockImages extends Model {}
class StashOrder extends Model {}
class StashOrderContent extends Model {}
class ToastieStock extends Model {}
class ToastieOrder extends Model {}
class ToastieOrderContent extends Model {}

class Permission extends Model {}
class PermissionLink extends Model {}

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
  }
}, { sequelize });

// Only need to store the length of membership can derive end date
// Considered putting this in the Users table but keeping it separate
// allows for greater expansion of any functionality (e.g. automating the approval process for their cards)
GymMembership.init({
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  approved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  }
}, { sequelize });

StashStock.init({
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
  customisationAvailable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  cusotmisationDescription: {
    type: DataTypes.STRING,
    allowNull: true
  },
  addedPriceForCusotmisation: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    defaultValue: 0.00
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

StashOrder.init({
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
  }
}, { sequelize });

StashOrderContent.init({
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StashOrder,
      key: 'id'
    }
  },
  logoOrCrest: {
    type: DataTypes.BOOLEAN, // 0 for Logo, 1 for Crest
    allowNull: false
  },
  colourId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StashColours,
      key: 'id'
    }
  },
  stockId: {
    type: DataTypes.INTEGER,
    references: {
      model: StashStock,
      key: 'id'
    }
  }
}, { sequelize, timestamps: false });


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
  }
}, { sequelize, freezeTableName: true });

ToastieOrder.init({
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
  }
}, { sequelize });

ToastieOrderContent.init({
  orderId: {
    type: DataTypes.INTEGER,
    references: {
      model: ToastieOrder,
      key: 'id'
    }
  },
  stockId: {
    type: DataTypes.INTEGER,
    references: {
      model: ToastieStock,
      key: 'id'
    }
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

// Associations are necessary to allow joins between tables

User.hasMany(GymMembership, { foreignKey: 'userId' });
GymMembership.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(StashOrder, { foreignKey: 'userId' });
StashOrder.belongsTo(User, { foreignKey: 'userId' });

StashOrder.hasMany(StashOrderContent, { foreignKey: 'orderId' });
StashOrderContent.belongsTo(StashOrder, { foreignKey: 'orderId' });

StashStock.hasMany(StashOrderContent, { foreignKey: 'stockId' });
StashOrderContent.belongsTo(StashStock, { foreignKey: 'stockId' });

StashSizeChart.hasMany(StashStock, { foreignKey: 'sizeChartId' });
StashStock.belongsTo(StashSizeChart, { foreignKey: 'sizeChartId' });

StashColours.hasMany(StashItemColours, { foreignKey: 'colourId' });
StashItemColours.belongsTo(StashColours, { foreignKey: 'colourId' });

StashStock.hasMany(StashItemColours, { foreignKey: 'productId' });
StashItemColours.belongsTo(StashStock, { foreignKey: 'productId' });

StashStock.hasMany(StashStockImages, { foreignKey: 'productId' });
StashStockImages.belongsTo(StashStock, { foreignKey: 'productId' });

User.hasMany(ToastieOrder, { foreignKey: 'userId' });
ToastieOrder.belongsTo(User, { foreignKey: 'userId' });

ToastieOrder.hasMany(ToastieOrderContent, { foreignKey: 'orderId' });
ToastieOrderContent.belongsTo(ToastieOrder, { foreignKey: 'orderId' });

ToastieStock.hasMany(ToastieOrderContent, { foreignKey: 'stockId' });
ToastieOrderContent.belongsTo(ToastieStock, { foreignKey: 'stockId' });

Permission.hasMany(PermissionLink, { foreignKey: 'permissionId' });
PermissionLink.belongsTo(Permission, { foreignKey: 'permissionId' });

PermissionLink.belongsTo(User, { as: "grantedTo", foreignKey: "grantedToId" });
PermissionLink.belongsTo(User, { as: "grantedBy", foreignKey: "grantedById" });

module.exports = { User, GymMembership, StashColours, StashSizeChart, StashItemColours, StashStockImages, StashOrder, StashStock, StashOrderContent, ToastieOrder, ToastieStock, ToastieOrderContent, Permission, PermissionLink };
