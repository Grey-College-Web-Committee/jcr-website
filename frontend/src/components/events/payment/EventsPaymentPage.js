import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import CountdownClock from '../../common/CountdownClock';

class EventsPaymentPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.match.params.id,
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: []
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
      content = await api.get(`/events/booking/${this.state.id}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { ticket, guestTickets } = content.data;
    const { EventGroupBooking } = ticket;
    const { Event, EventTicketType } = EventGroupBooking;
    const bookingCloses = new Date(new Date(EventGroupBooking.createdAt).getTime() + 60 * 60 * 24 * 1000);

    this.setState({ loaded: true, status: 200, ticket, guestTickets, event: Event, group: EventGroupBooking, type: EventTicketType, bookingCloses });
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

    const { event, group, guestTickets, ticket, type, bookingCloses } = this.state;

    const amountToPay = 0;

    // <CountdownClock
    //   until={bookingCloses}
    //   onFinish={() => {
    //     console.log("COUNTDOWN FINISHED");
    //   }}
    //   verb={"Closes"}
    //   aboveText={"Time remaining for your group to complete payment:"}
    // />
    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">{event.name} - Payment</h1>
          <div className="flex flex-col md:flex-row text-justify">
            <div className="flex-1 border-2 mr-0 md:mr-2 p-2">
              <h2 className="font-semibold text-2xl pb-2">Your Payment</h2>
              <p>{type.name}</p>
            </div>
            <div className="flex-1 border-2 mt-2 md:mt-0 p-2">
              <h2 className="font-semibold text-2xl pb-2">Your Group</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Is Guest?</th>
                    <th>Has Paid?</th>
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
                        <tr key={i}>
                          <td>{displayName}</td>
                          <td>{ticket.isGuestTicket ? "Yes" : "No"}</td>
                          <td>{ticket.paid ? "Yes" : "No"}</td>
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

EventsPaymentPage.contextType = authContext;

export default EventsPaymentPage;
