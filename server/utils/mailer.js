const nodemailer = require("nodemailer");

const footer = [
  '<div style="text-align: left; font-size: small; font-style: italic;">',
  "<p>This is an automatically generated email. Replies to this email address are not monitored.</p>",
  "<p>If you have any queries please contact the JCR Website Editor at grey.website@durham.ac.uk</p>",
  "</div>"
].join("");

// Creates the transporter to send the mail

let transporter;

// Due to the uni forcing MFA we moved to postfix on the server in production
if(process.env.LOCAL_EMAIL) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    tls: {
      rejectUnauthorized: false
    }
  });
} else {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secureConnection: process.env.EMAIL_SECURE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100
  });
}

// Send an email using the transporter we have constructed
const sendEmail = async (to, subject, html) => {
  let info;

  const sendingHtml = html + footer;

  try {
    info = await transporter.sendMail({
      from: process.env.EMAIL_SENDER,
      to,
      subject,
      html: sendingHtml
    });
  } catch (error) {
    console.log(error);
    return false;
  }

  return info;
}

module.exports.sendEmail = sendEmail;
