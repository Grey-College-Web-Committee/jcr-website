const { User, Event, EventTicket, EventTicketType, EventGroupBooking } = require("../database.models.js");
const { Op } = require("sequelize");
const mailer = require("../utils/mailer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const forcedCancellationEmail = (group, ticket, notPaid) => {
  let message = [];
  let firstName = ticket.User.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = ticket.User.surname.charAt(0).toUpperCase() + ticket.User.surname.substr(1).toLowerCase();

  message.push(`<h1>Booking Cancelled</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your group's booking for ${group.Event.name} has been cancelled due to a lack of payment.</p>`);

  if(ticket.paid) {
    message.push(`<p>The hold on your card has been released. This can take up to 7 days depending on your bank.</p>`);
    message.push(`<p>The members of your group who had not authorised their card holds were:</p>`);
    message.push(`<ul>`);

    notPaid.forEach((record, i) => {
      if(record.isGuestTicket) {
        message.push(`<li>${record.guestName} (Guest)</li>`);
        return;
      }

      let firstNameNotPaid = record.User.firstNames.split(",")[0];
      firstNameNotPaid = firstNameNotPaid.charAt(0).toUpperCase() + firstNameNotPaid.substr(1).toLowerCase();
      const lastNameNotPaid = record.User.surname.charAt(0).toUpperCase() + record.User.surname.substr(1).toLowerCase();

      message.push(`<li>${firstNameNotPaid} ${lastNameNotPaid}</li>`);
    });

    message.push(`</ul>`);
  } else {
    message.push(`<p>A hold was never authorised on your card and as such there is no funds to release.</p>`);
    message.push(`<p>The members of your group who had not authorised their card holds were:</p>`);
    message.push(`<ul>`);

    notPaid.forEach((record, i) => {
      if(record.isGuestTicket) {
        message.push(`<li>${record.guestName} (Guest)</li>`);
        return;
      }

      let firstNameNotPaid = record.User.firstNames.split(",")[0];
      firstNameNotPaid = firstNameNotPaid.charAt(0).toUpperCase() + firstNameNotPaid.substr(1).toLowerCase();
      const lastNameNotPaid = record.User.surname.charAt(0).toUpperCase() + record.User.surname.substr(1).toLowerCase();

      message.push(`<li>${firstNameNotPaid} ${lastNameNotPaid}</li>`);
    });

    message.push(`</ul>`);
  }

  message.push(`<p>You may still be able to book on to the event.</p>`);
  message.push(`<p>If you believe you have received this in error please contact grey.treasurer@durham.ac.uk and grey.website@durham.ac.uk</p>`);

  return message.join("");
}

const cancelExpiredBookings = async () => {
  const now = new Date();
  console.log(`Running cancelExpiredBookings ${now}`);
  const dayBefore = new Date(now.getTime() - 1000 * 60 * 60 * 24);
  // Say a group books on at 13:01 on 19/02/2021 then they have until 14:00 20/02/2021
  // At 13:00 20/02/2021 we look at all groups made before 13:00 19/02/2021
  // They should not get caught in the cron job running at 13:00 but rather than one at 14:00
  // const hourBefore = new Date(now.getTime() - 1000 * 60 * 60);

  let expiredGroups;

  // Get all groups that have taken too long and haven't paid
  try {
    expiredGroups = await EventGroupBooking.findAll({
      where: {
        createdAt: {
          [Op.lt]: dayBefore
        },
        allPaid: false
      },
      include: [ EventTicket, Event ]
    });
  } catch (error) {
    console.log(error);
    return;
  }

  if(expiredGroups.length === 0) {
    // We then send any reminder emails
    console.log("No groups");
    reminderEmailsForBookings();
    return;
  }

  // Then get each group individually
  for(const group of expiredGroups) {
    let tickets;

    // Get the tickets and users in the group
    try {
      tickets = await EventTicket.findAll({
        where: {
          groupId: group.id
        },
        include: [ User ]
      });
    } catch (error) {
      console.log(error);
      break;
    }

    let notPaid = [];

    // Now go individually over the tickets
    for(const ticket of tickets) {
      // We don't really care too much about guests
      // Everything will be handled via the lead booker instead
      if(ticket.isGuestTicket) {
        continue;
      }

      // If they have paid we need to cancel the card hold
      if(ticket.paid) {
        // Sabbs can override the payment inline with the hardship policy
        // we'll set the paymentId to overridden in this case
        // don't try and cancel it cause Stripe will error
        if(ticket.stripePaymentId !== "overridden") {
          try {
            await stripe.paymentIntents.cancel(ticket.stripePaymentId);
          } catch (error) {
            console.log(error);
            break;
          }
        }
      } else {
        notPaid.push(ticket);
      }
    }

    // We now need to send them an email telling them we have cancelled their group
    for(const ticket of tickets) {
      if(ticket.isGuestTicket) {
        continue;
      }

      const cancellationEmail = forcedCancellationEmail(group, ticket, notPaid);
      mailer.sendEmail(ticket.User.email, `Event Booking Cancelled`, cancellationEmail);
    }

    // Could also send an email to grey.website or grey.treasurer
    // Now we delete the booking

    // Delete the group
    try {
      await group.destroy();
    } catch (error) {
      console.log(error);
      break;
    }
  }

  // Once this is done we can then send the reminder email
  reminderEmailsForBookings();
}

const makeReminderEmail = (group, ticket, notPaid) => {
  let message = [];
  let firstName = ticket.User.firstNames.split(",")[0];
  firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
  const lastName = ticket.User.surname.charAt(0).toUpperCase() + ticket.User.surname.substr(1).toLowerCase();

  message.push(`<h1>Payment Needed</h1>`);
  message.push(`<p>Hello ${firstName} ${lastName},</p>`);
  message.push(`<p>Your group's booking for ${group.Event.name} will be cancelled within the next hour</p>`);
  message.push(`<p>The members of your group who have not authorised their card holds are:</p>`);
  message.push(`<ul>`);

  notPaid.forEach((record, i) => {
    if(record.isGuestTicket) {
      message.push(`<li>${record.guestName} (Guest)</li>`);
      return;
    }

    let firstNameNotPaid = record.User.firstNames.split(",")[0];
    firstNameNotPaid = firstNameNotPaid.charAt(0).toUpperCase() + firstNameNotPaid.substr(1).toLowerCase();
    const lastNameNotPaid = record.User.surname.charAt(0).toUpperCase() + record.User.surname.substr(1).toLowerCase();

    message.push(`<li>${firstNameNotPaid} ${lastNameNotPaid}</li>`);
  });

  message.push(`</ul>`);

  message.push(`<p>Please encourage them to authorise payment as soon as possible to prevent your booking being automatically cancelled!</p>`);
  message.push(`<p>If you believe you have received this in error please contact grey.treasurer@durham.ac.uk and grey.website@durham.ac.uk</p>`);
  message.push(`<p>Thank you</p>`);

  return message.join("");
}

const reminderEmailsForBookings = async () => {
  const now = new Date();
  console.log(`Running reminderEmailsForBookings ${now}`);
  // 22 hours ago, send an email 1 hour before the deadline
  const oneHourToGo = new Date(now.getTime() - 1000 * 60 * 60 * 23);

  let groups;

  // Get all groups that are at risk of being cancelled
  try {
    groups = await EventGroupBooking.findAll({
      where: {
        createdAt: {
          [Op.lt]: oneHourToGo
        },
        allPaid: false
      },
      include: [ EventTicket, Event ]
    });
  } catch (error) {
    console.log(error);
    return;
  }

  if(groups.length === 0) {
    console.log("No groups");
    return;
  }

  // Then get each group individually
  for(const group of groups) {
    let tickets;

    // Get the tickets and users in the group
    try {
      tickets = await EventTicket.findAll({
        where: {
          groupId: group.id
        },
        include: [ User ]
      });
    } catch (error) {
      console.log(error);
      break;
    }

    let notPaid = [];

    // Now go individually over the tickets
    for(const ticket of tickets) {
      // We don't really care too much about guests
      // Everything will be handled via the lead booker instead
      if(ticket.isGuestTicket) {
        continue;
      }

      // Want to collect a list of people who haven't paid
      if(!ticket.paid) {
        notPaid.push(ticket);
      }
    }

    // We now send an email to all of the group to tell them to encourage those who haven't paid
    for(const ticket of tickets) {
      if(ticket.isGuestTicket) {
        continue;
      }

      const reminderEmail = makeReminderEmail(group, ticket, notPaid);
      mailer.sendEmail(ticket.User.email, `Event Payment Reminder`, reminderEmail);
    }
  }
}

module.exports = { cancelExpiredBookings, reminderEmailsForBookings };
