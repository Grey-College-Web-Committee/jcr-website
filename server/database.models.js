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
class Transaction extends Model {}

// Sequelize will automatically add IDs, createdAt and updatedAt

// No need to store a users email it is simply username@durham.ac.uk
// Wouldn't be difficult to add if it is wanted in the future
User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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

/*
To get around needing to use webhooks (at least temporarily) we will track transactions
through this table providing the id in a similar use to email verification tokens allowing
a single use that is safe (enough) to expose on the frontend
-- Ultimately want to move to webhooks eventually but this is practical given the time
'type' here is an enum that we could do with moving away from
*/
// completed => Has reached either failure or success page
// successful => Has reached the success page
Transaction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.INTEGER,
    defaultValue: -1
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  successful: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, { sequelize });

const TransactionType = Object.freeze({
  unknown: -1,
  gymMembership: 0,
  halloweenSaturday: 1,
  halloweenSunday: 2
});

// Associations are necessary to allow joins between tables

User.hasMany(GymMembership, { foreignKey: 'userId' });
GymMembership.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, GymMembership, Transaction, TransactionType };
