import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

class EventsMyBookingsOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      tickets: []
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
      content = await api.get("/events/bookings/my");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    this.setState({ loaded: true, status: 200, tickets: content.data.tickets });
  }

  makeDisplayName = (result) => {
    const split = result.firstNames.split(",");
    let firstName = split[0];
    firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    let surname = result.surname;
    surname = surname.substring(0, 1).toUpperCase() + surname.substring(1).toLowerCase();

    return `${firstName} ${surname}`;
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

    const { tickets } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-2">My Event Bookings</h1>
          {
            tickets.length === 0 ? (<p className="text-2xl mt-2">No bookings yet!</p>) : (
              <div className="w-full md:w-3/5 flex flex-col mx-auto">
                {
                  tickets.map((ticket, i) => (
                    <div className="border px-2 mt-2 flex flex-col items-start w-full">
                      <div className="my-2 flex flex-col w-full items-start md:flex-row md:justify-between  md:items-center">
                        <h2 className="font-semibold text-3xl">{ticket.EventGroupBooking.Event.name}</h2>
                        <p className="break-all text-sm md:text-base">Booked at {dateFormat(ticket.EventGroupBooking.createdAt, "dd/mm/yyyy HH:MM")} by {this.makeDisplayName(ticket.EventGroupBooking.User)}</p>
                      </div>
                      <p className="py-1">{ticket.EventGroupBooking.Event.shortDescription}</p>
                      <p>Event takes place on {dateFormat(ticket.EventGroupBooking.Event.date, "dd/mm/yyyy")}</p>
                      <p className={ticket.paid ? "" : "text-red-900 font-semibold"}>Booking Status: {ticket.EventGroupBooking.allPaid ? "Confirmed" : ticket.paid ? "Awaiting Group Payments" : "Awaiting Your Payment"}</p>
                      <p>Ticket Type: {ticket.EventGroupBooking.EventTicketType.name}</p>
                      <div className={`my-2 w-full flex flex-row justify-start border-t ${ticket.paid ? "border-red-900" : "border-grey-500"} pt-2`}>
                        {
                          ticket.paid ? (
                            <Link to={`/my/ticket/${ticket.id}`} className="w-full">
                              <button
                                className="px-4 py-1 rounded bg-grey-500 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                              >View Group</button>
                            </Link>
                          ) : (
                            <Link to={`/events/bookings/payment/${ticket.id}`} className="w-full">
                              <button
                                className="px-4 py-1 rounded bg-red-900 text-white md:w-64 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                              >Pay Now</button>
                            </Link>
                          )
                        }
                      </div>
                    </div>
                  ))
                }
              </div>
            )
          }
        </div>
      </div>
    );
  }
}

EventsMyBookingsOverview.contextType = authContext;

export default EventsMyBookingsOverview;
