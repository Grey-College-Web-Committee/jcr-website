const nodemailer = require("nodemailer");

// Creates the transporter to send the mail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send an email using the transporter we have constructed
const sendEmail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to,
    subject,
    html
  });

  return info;
}

module.exports.sendEmail = sendEmail;
