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
      this.setState({ loaded: false, status: error.response.status });
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
          <h1 className="font-semibold text-5xl pb-4">My Event Bookings</h1>
          {
            tickets.length === 0 ? (<p className="text-2xl">No bookings yet!</p>) : (
              <table className="mx-auto border-2 text-left border-red-900 w-full">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Event</th>
                    <th className="p-2 font-semibold">Ticket Type</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">Lead Booker</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">Fully Confirmed</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">Booked At</th>
                    <th className="p-2 font-semibold">See More</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    tickets.map((ticket, i) => (
                      <tr className="text-center border-b border-gray-400" key={i}>
                        <td className="p-2 border-r border-gray-400 break-all">
                          <p>{ticket.EventGroupBooking.Event.name}</p>
                          <p>({dateFormat(ticket.EventGroupBooking.Event.date, "dd/mm/yyyy")})</p>
                        </td>
                        <td className="p-2 border-r border-gray-400 break-all">{ticket.EventGroupBooking.EventTicketType.name}</td>
                        <td className="p-2 border-r border-gray-400 break-all hidden lg:table-cell">{this.makeDisplayName(ticket.EventGroupBooking.User)}</td>
                        <td className="p-2 border-r border-gray-400 break-all hidden lg:table-cell">
                          <p>{ticket.EventGroupBooking.allPaid ? "Yes" : "No"}</p>
                          <p>(You have {ticket.paid ? "paid" : "not paid"})</p>
                        </td>
                        <td className="p-2 border-r border-gray-400 break-all hidden lg:table-cell">{dateFormat(ticket.EventGroupBooking.createdAt, "dd/mm/yyyy HH:MM")}</td>
                        <td className="p-2 border-r border-gray-400 break-all">
                          <Link to={`/my/ticket/${ticket.id}`}>
                            <button
                              className="px-4 py-1 rounded bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                            >View Group</button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    );
  }
}

EventsMyBookingsOverview.contextType = authContext;

export default EventsMyBookingsOverview;
