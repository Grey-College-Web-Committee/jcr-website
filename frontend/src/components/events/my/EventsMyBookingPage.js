import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

class EventsMyBookingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ticketId: props.match.params.ticketId,
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      ticket: null
    };
  }

  makeDisplayName = (result) => {
    const split = result.firstNames.split(",");
    let firstName = split[0];
    firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    let surname = result.surname;
    surname = surname.substring(0, 1).toUpperCase() + surname.substring(1).toLowerCase();

    return `${firstName} ${surname}`;
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
      content = await api.get(`/events/ticket/my/${this.state.ticketId}`);
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    this.setState({ loaded: true, status: 200, ticket: content.data.ticket });
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

    const { ticket: myTicket } = this.state;
    const { EventGroupBooking: group, requiredInformation: stringReqInfo } = myTicket;
    const { Event: event, EventTickets: tickets, EventTicketType: ticketType, User: leadBooker } = group;
    const paymentReqDate = new Date(new Date(group.createdAt).getTime() + 1000 * 60 * 60 * 24);

    const parsedReqInfo = stringReqInfo === null ? null : JSON.parse(stringReqInfo);

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-2">{event.name} Booking</h1>
          <p className="font-semibold text-lg pb-2">Takes places at {dateFormat(event.date, "dd/mm/yyyy HH:MM")}</p>
          { myTicket.paid ? null : (
            <div className="border-2 border-red-900 p-2 my-2">
              <Link to={`/events/bookings/payment/${myTicket.id}`}>
                <p className="font-semibold underline text-red-700 text-2xl py-1">You have not paid for your ticket. Please click here to pay.</p>
              </Link>
            </div>
          )}
          <div className="flex flex-col text-left md:w-3/5 w-full mx-auto">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold pb-2">Ticket Details</h2>
              <p className="py-1"><span className="font-semibold">Booking Created:</span> {dateFormat(group.createdAt, "dd/mm/yyyy HH:MM")}</p>
              <p className="py-1"><span className="font-semibold">Lead Booker:</span> {this.makeDisplayName(leadBooker)}</p>
              <p className="py-1"><span className="font-semibold">Ticket Type:</span> {ticketType.name}</p>
              <p className="py-1"><span className="font-semibold">Booking Status:</span> {myTicket.EventGroupBooking.allPaid ? "Confirmed" : myTicket.paid ? "Awaiting Group Payments" : "Awaiting Your Payment"}</p>
              {myTicket.EventGroupBooking.allPaid ? null : (<p>Payment required from all members of the group by {dateFormat(paymentReqDate, "dd/mm/yyyy HH:MM")}</p>)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold pb-2">Group Details</h2>
              <table className="mx-auto border-2 text-left border-red-900 w-full">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Name</th>
                    <th className="p-2 font-semibold">Paid?</th>
                    {
                      parsedReqInfo === null ? null : (
                        Object.keys(parsedReqInfo).map((key, i) => (
                          <th key={i} className="p-2 font-semibold hidden lg:table-cell">{key}</th>
                        ))
                      )
                    }
                  </tr>
                </thead>
                <tbody>
                  {
                    tickets.map((ticket, i) => {
                      const name = ticket.isGuestTicket ? ticket.guestName : this.makeDisplayName(ticket.User);
                      const username = ticket.isGuestTicket ? ticket.guestUsername : ticket.User.username;
                      const reqInfo = ticket.requiredInformation;
                      const parsedIndividualInfo = reqInfo === null ? null : JSON.parse(reqInfo);

                      return (
                        <tr className="text-center border-b border-gray-400" key={i}>
                          <td className="p-2 border-r border-gray-400 break-all">
                            <p>{name}</p>
                            <p>({username})</p>
                          </td>
                          <td className="p-2 border-r border-gray-400 break-all">{ticket.paid ? "Yes" : "No"}</td>
                          {
                            parsedReqInfo === null ? null : (
                              Object.keys(parsedReqInfo).map((key, j) => {
                                if(parsedIndividualInfo === null) {
                                  return (
                                    <td key={i} className="p-2 border-r border-gray-400 break-all hidden lg:table-cell">Not Set</td>
                                  )
                                }

                                return (
                                  <td key={i} className="p-2 border-r border-gray-400 break-all hidden lg:table-cell">
                                    {typeof parsedIndividualInfo[key] === "boolean" ? (parsedIndividualInfo[key] ? "Yes" : "No") : parsedIndividualInfo[key]}
                                  </td>
                                );
                              })
                            )
                          }
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

EventsMyBookingPage.contextType = authContext;

export default EventsMyBookingPage;
