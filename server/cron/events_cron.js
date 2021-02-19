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
    message.push(`<p>The hold on your card has been released.</p>`);
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
  }

  message.push(`<p>You may still be able to book on to the event.</p>`);
  message.push(`<p>If you believe you have received this in error please contact grey.treasurer@durham.ac.uk and grey.website@durham.ac.uk</p>`);

  return message.join("");
}

const cancelExpiredBookings = async () => {
  return;
  console.log("Run");
  const now = new Date();
  // add 60*24 at end
  const dayBefore = new Date(now.getTime() - 1000 * 60);
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
    console.log("No groups");
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
        try {
          await stripe.paymentIntents.cancel(ticket.stripePaymentId);
        } catch (error) {
          console.log(error);
          break;
        }
      } else {
        notPaid.push(ticket);
      }
    }

    // We now need to send them an email telling them we have cancelled their group
    for(const ticket of tickets) {
      const cancellationEmail = forcedCancellationEmail(group, ticket, notPaid);
      mailer.sendEmail(ticket.User.email, `Event Booking Cancelled`, cancellationEmail);
    }

    // Could also send an email to grey.website or grey.treasurer
    // Now we delete the booking

    // Commented out for testing
    // try {
    //   await group.destroy();
    // } catch (error) {
    //   console.log(error);
    //   break;
    // }
  }
}

module.exports = { cancelExpiredBookings };
