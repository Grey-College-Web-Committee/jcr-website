import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import EventTicketRow from './EventTicketRow';
const dateFormat = require("dateformat")

class EventsGroupManagePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      eventId: this.props.match.params.eventId,
      loaded: false,
      status: 0,
      error: "",
      disabled: false
    };

    // Change this to your permission
    this.requiredPermission = "events.manage";
  }

  // Load the data once the element is ready
  componentDidMount = async () => {
    let adminCheck;

    try {
      adminCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify admin status" });
      return;
    }

    // Ensure they are an admin
    if(adminCheck.data.user.permissions) {
      if(adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if(!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    let content;

    // Get the groups from the server
    try {
      content = await api.get(`/events/groups/${this.state.eventId}`);
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    const { event, groups, ticketTypes } = content.data;

    // Want to map the ticketTypes to an object with the key as the ticket type ID
    const ticketTypesByID = ticketTypes.reduce((obj, ticketType) => {
      obj[ticketType.id] = ticketType;
      return obj;
    }, {});

    this.setState({ loaded: true, event, groups, ticketTypes: ticketTypesByID });
  }

  makeDisplayName = (result) => {
    const split = result.firstNames.split(",");
    let firstName = split[0];
    firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    let surname = result.surname;
    surname = surname.substring(0, 1).toUpperCase() + surname.substring(1).toLowerCase();

    return `${firstName} ${surname}`;
  }

  deleteGroup = async (id) => {
    this.setState({ disabled: true });
    const confirmed = window.confirm("Are you sure want to delete this booking? This will NOT refund the people in the group.");

    if(!confirmed) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/events/group/${id}`);
    } catch (error) {
      alert(error.response.data.error);
      return;
    }

    let { groups } = this.state;
    groups = groups.filter(group => group.id !== id);
    this.setState({ disabled: false, groups });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <LoadingHolder />
      );
    }

    const { event, groups, ticketTypes } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Manage Groups for {event.name}</h1>
          <div>
            <h2 className="text-left font-semibold text-2xl">Groups</h2>
            <p className="text-justify py-1">To find a specific user press CTRL+F (or Command+F on Mac) and search for their username or their name</p>
            <p className="text-justify py-1">If you are overriding a payment but it says 'Requires Additional Information' this means that the person needs to fill in specific details requested for the event. To do this, ask them to check their email for the payment link (or alternatively send them the link of the following format https://services.greyjcr.com/events/bookings/payment/[ticketID] where [ticketID] is their specific ID from the tables below). If they click the link (which will only work for their specific user) the first screen will require them to fill in the form. Then, once they have done so and submit the form it will ask them for payment. At this point you can then refresh this admin page and it will allow you to override their payment.</p>
            <p className="text-justify py-1">You can also create groups (such as for the Sportsperson Formal) by clicking the button below which will redirect you to the admin booking page.</p>
            <div className="flex flex-row justify-start">
              {
                Object.keys(ticketTypes).map(id => (
                  <Link to={`/events/admin/groups/${event.id}/create/${id}`} key={id}>
                    <button
                      className="px-4 py-1 ml-2 mb-2 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 flex flex-row justify-start"
                    >Create {ticketTypes[id].name} Group</button>
                  </Link>
                ))
              }
            </div>
            {
              groups.map((group, i) => {
                const ticketType = ticketTypes[group.ticketTypeId];
                const guestsAllowed = ticketType.maxGuests !== 0;
                const paymentClose = new Date(new Date(group.createdAt).getTime() + 1000 * 60 * 60 * 24);
                let requiresInformation = false;

                if(ticketType.requiredInformationForm !== "{}") {
                  if(Object.keys(JSON.parse(ticketType.requiredInformationForm)).length !== 0) {
                    requiresInformation = true;
                  }
                }

                let prices = `Member Price: £${Number(ticketType.memberPrice).toFixed(2)}`;

                if(guestsAllowed) {
                  prices = `${prices}, Guest Price: £${Number(ticketType.guestPrice).toFixed(2)}`;
                }

                console.log({requiresInformation})

                return (
                  <div key={i} className="border p-2 my-2 text-left">
                    <div className="mb-2">
                      <p>Ticket Type: {ticketType.name} (Guests Allowed: {guestsAllowed ? "Yes" : "No"})</p>
                      <p>Lead Booker: {this.makeDisplayName(group.User)} (note: approving payment for the lead booker will also approve it for all the guests of the group)</p>
                      <p>{prices}</p>
                      <p>Booking Placed: {dateFormat(group.createdAt, "dd/mm/yyyy HH:MM")}</p>
                      <p>Payment Closes: {dateFormat(paymentClose, "dd/mm/yyyy HH:MM")}</p>
                    </div>
                    <div className="mb-2">
                      <p className="py-1">This will delete the group booking. Please note that this will not cancel any holds or refund any payments. This must be done manually on Stripe instead - this is intentional to allow flexibility in case you do not want to refund the payment for any reason.</p>
                      <button
                        className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        onClick={() => this.deleteGroup(group.id)}
                      >Delete Booking</button>
                    </div>
                    <table className="mx-auto border-2 text-left border-red-900 w-full">
                      <thead className="bg-red-900 text-white">
                        <tr>
                          <th className="p-2 font-semibold">Ticket ID</th>
                          <th className="p-2 font-semibold">Name</th>
                          <th className="p-2 font-semibold">Username</th>
                          <th className="p-2 font-semibold">Is Guest?</th>
                          <th className="p-2 font-semibold">Paid?</th>
                          <th className="p-2 font-semibold">Override Payment</th>
                          <th className="p-2 font-semibold">Stripe Payment ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          group.EventTickets.map((ticket, j) => (
                            <EventTicketRow
                              ticket={ticket}
                              requiresInformation={requiresInformation && ticket.requiredInformation === null}
                              key={j}
                              leadBooker={group.User}
                            />
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    );
  }
}

export default EventsGroupManagePage;
