import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import CountdownClock from '../../common/CountdownClock';
import CheckoutForm from '../../checkout/CheckoutForm';
import dateFormat from 'dateformat';

class EventsPaymentPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.match.params.id,
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      ticket: null,
      guestTickets: null,
      event: null,
      group: null,
      type: null,
      bookingCloses: null,
      totalCost: null,
      clientSecret: null,
      paidNow: false,
      paid: false
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status", isMember: false });
      return;
    }

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
      return;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get(`/events/booking/payment/${this.state.id}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { paid } = content.data;

    if(paid) {
      this.setState({ loaded: true, status: 200, paid });
      return;
    }

    const { ticket, guestTickets, totalCost, clientSecret } = content.data;
    const { EventGroupBooking } = ticket;
    const { Event, EventTicketType } = EventGroupBooking;
    // Add 1 day on to the time the group was created
    const bookingCloses = new Date(new Date(EventGroupBooking.createdAt).getTime() + 60 * 60 * 24 * 1000);

    this.setState({ loaded: true, status: 200, ticket, guestTickets, event: Event, group: EventGroupBooking, type: EventTicketType, bookingCloses, totalCost, paid, clientSecret });
  }

  makeDisplayName = (result) => {
    // Converts the firstNames and surname into a suitable display format
    const split = result.firstNames.split(",");
    let firstName = split[0];
    firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    let surname = result.surname;
    surname = surname.substring(0, 1).toUpperCase() + surname.substring(1).toLowerCase();

    return `${firstName} ${surname}`;
  }

  onPaymentSuccess = () => {
    // Called when the hold is successfully
    this.setState({ paidNow: true });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/membership" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    if(this.state.paid) {
      // We want to redirect to the booking overview instead I think
      return (
        <div>
          Already paid
        </div>
      )
    }

    const { event, group, guestTickets, ticket, type, bookingCloses, totalCost, clientSecret, paidNow } = this.state;

    if(paidNow) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 w-full md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Payment Successful!</h1>
            <p className="py-1">A hold has been successfully placed on your card and you will receive an email confirming this shortly.</p>
            <p className="font-semibold text-xl py-1">Thank you!</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">{event.name} - Payment</h1>
          <div className="flex flex-col-reverse md:flex-row text-justify">
            <div className="flex-1 mt-2 md:mt-0 p-2">
              <h2 className="font-semibold text-3xl pb-2">Your Group</h2>
              <p className="py-1">Everybody in your group must have authorised their payment by <span className="font-semibold">{dateFormat(bookingCloses, "dd/mm/yyyy HH:MM")}</span> otherwise you're group's booking will be cancelled and you may be unable to get a place on the event.</p>
              <table className="mx-auto border-2 text-left border-red-900 w-full mt-2">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Name</th>
                    <th className="p-2 font-semibold">Is Guest?</th>
                    <th className="p-2 font-semibold">Has Paid?</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    group.EventTickets.map((ticket, i) => {
                      let displayName;

                      if(ticket.isGuestTicket) {
                        displayName = ticket.guestName;
                      } else {
                        displayName = this.makeDisplayName(ticket.User);
                      }

                      return (
                        <tr key={i} className="text-center border-b border-gray-400">
                          <td className="p-2 border-r border-gray-400">{displayName}</td>
                          <td className="p-2 border-r border-gray-400">{ticket.isGuestTicket ? "Yes" : "No"}</td>
                          <td className="p-2 border-r border-gray-400">{ticket.paid ? "Yes" : "No"}</td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
            <div className="flex-1 mr-0 md:mr-2 p-2">
              <h2 className="font-semibold text-3xl pb-2">Your Payment</h2>
              <p className="py-1">{type.name}</p>
              <p className="py-1">This will place a hold on your card for the amount of £{(totalCost / 100).toFixed(2)} which will be taken from your account once all members of your group have authorised their cards. If your booking is cancelled then the hold will be released and no funds will be taken.</p>
              <div className="w-full text-base py-4 align-middle">
                <CheckoutForm
                  clientSecret={clientSecret}
                  onSuccess={this.onPaymentSuccess}
                  totalAmountInPence={totalCost}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

EventsPaymentPage.contextType = authContext;

export default EventsPaymentPage;
