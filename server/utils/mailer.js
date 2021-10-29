const nodemailer = require("nodemailer");

// Creates the transporter to send the mail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secureConnection: process.env.EMAIL_SECURE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    ciphers: "SSLv3"
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100
});

const sendEmail = async (to, subject, html) => {
  return true;
}

// Changes to email means we can no longer connect so attempting to
// send emails is pointless
// Send an email using the transporter we have constructed
// const sendEmail = async (to, subject, html) => {
//   let info;

//   try {
//     info = await transporter.sendMail({
//       from: process.env.EMAIL_SENDER,
//       to,
//       subject,
//       html
//     });
//   } catch (error) {
//     console.log(error);
//   }

//   return info;
// }

module.exports.sendEmail = sendEmail;
