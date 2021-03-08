import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import MemberSearch from '../../book/MemberSearch';
import AddGuest from '../../book/AddGuest';

class EventsAdminBookingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      eventId: props.match.params.eventId,
      ticketTypeId: props.match.params.ticketTypeId,
      loaded: false,
      status: 0,
      error: "",
      ticketType: null,
      group: {},
      maxMembers: 0,
      maxGuests: 0,
      disabled: false,
      memberDisabled: false,
      guestDisabled: false,
      unavailable: null,
      booked: false,
      leadDisabled: false,
      submitError: ""
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

    // Load any required data for the page here
    // Once the component is ready we can query the API
    let ticketType;

    try {
      ticketType = await api.get(`/events/ticketType/admin/${this.state.ticketTypeId}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status, error: error.response.data.error });
      return;
    }

    if(!ticketType.data.available) {
      this.setState({ loaded: true, status: 200, unavailable: ticketType.data.reason });
      return;
    }

    const group = {};
    const maxMembers = Math.min(ticketType.data.capacity.remainingIndividualSpaces, ticketType.data.record.maxPeople);

    this.setState({ loaded: true, status: 200, ticketType: ticketType.data, group, maxMembers, maxGuests: ticketType.data.record.maxGuests });
  }

  makeDisplayName = (result) => {
    const split = result.firstNames.split(",");
    let firstName = split[0];
    firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    let surname = result.surname;
    surname = surname.substring(0, 1).toUpperCase() + surname.substring(1).toLowerCase();

    return `${firstName} ${surname}`;
  }

  addToGroup = (details, guest, lead) => {
    const userRecord = {
      id: details.id,
      username: details.username.toLowerCase(),
      removable: !lead,
      displayName: this.makeDisplayName(details),
      guest,
      lead
    }

    const nextId = Object.keys(this.state.group).length === 0 ? 0 : Math.max(...Object.keys(this.state.group)) + 1;
    let { group } = this.state;

    group[nextId] = userRecord;

    if(lead) {
      this.setState({ group, leadDisabled: true });
    } else {
      this.setState({ group });
    }

    return true;
  }

  removeFromGroup = (key) => {
    let { group } = this.state;

    if(group[key].lead) {
      alert("You cannot remove the lead booker");
      return;
    }

    delete group[key];
    this.setState({ group });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  submitGroup = async () => {
    this.setState({ disabled: true, submitError: "" });

    const { group, maxMembers, maxGuests, ticketTypeId } = this.state;
    const { minMembers } = this.state.ticketType.record;
    const totalMembers = Object.keys(group).length;
    const totalGuests = Object.keys(group).map(k => group[k].guest).filter(guest => guest === true).length;

    if(totalMembers < minMembers) {
      this.setState({ disabled: false, submitError: `You must have at least ${minMembers} people in your group` });
      return;
    }

    if(totalMembers > maxMembers) {
      this.setState({ disabled: false, submitError: `You can only have a maximum of ${maxMembers} people in your group` });
      return;
    }

    if(totalGuests > maxGuests) {
      this.setState({ disabled: false, submitError: `You can only have a maximum of ${maxGuests} guests in your group` });
      return;
    }

    const packaged = Object.keys(group).map(k => group[k]);

    let result;

    try {
      result = await api.post("/events/booking/admin", { group: packaged, ticketTypeId });
    } catch (error) {
      alert(error.response.data.error);
      return;
    }

    this.setState({ disabled: true, booked: true });
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

    if(this.state.booked) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Admin Group Booking</h1>
            <p>The booking has been created successfully</p>
          </div>
        </div>
      );
    }

    if(this.state.unavailable) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Admin Group Booking</h1>
            <p className="py-1 text-justify">You can create bookings on the behalf of other users (e.g. for the Sportsperson Formal) this works in the same way as any other type of booking except that you do not necessarily have to be in the group. It will still check to make sure people are JCR members, have consented to the events terms and conditions, do not have debt, and have not already been booked on to the event. Once the booking is confirmed all of the users will be emailed with a payment link as normal. They will have 24 hours to pay otherwise their entire groups booking will be cancelled.</p>
            <p className="py-1 text-justify font-semibold">You cannot create a new booking. Reason: {this.state.unavailable}</p>
          </div>
        </div>
      );
    }

    const ticketType = this.state.ticketType.record;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Admin Group Booking</h1>
          <p className="py-1 text-justify">You can create bookings on the behalf of other users (e.g. for the Sportsperson Formal) this works in the same way as any other type of booking except that you do not necessarily have to be in the group. It will still check to make sure people are JCR members, have consented to the events terms and conditions, do not have debt, and have not already been booked on to the event. Once the booking is confirmed all of the users will be emailed with a payment link as normal. They will have 24 hours to pay otherwise their entire groups booking will be cancelled.</p>
          <div className="border border-gray-500 w-full md:w-3/5 mx-auto p-2 text-justify">
            <h2 className="font-semibold text-2xl pb-2">{ticketType.Event.name}: {ticketType.name}</h2>
            <p>{ticketType.description}</p>
            <p>Please set a lead booker (e.g. a society president). This cannot be altered once set without resetting the whole group!</p>
            <MemberSearch
              title="Set Group Lead Booker"
              ticketTypeId={this.state.ticketTypeId}
              disabled={this.state.disabled || this.state.leadDisabled || Object.keys(this.state.group).length >= this.state.maxMembers}
              addMember={(details) => this.addToGroup(details, false, true)}
              rejectIf={(username) => {
                return Object.keys(this.state.group).map(i => this.state.group[i].username).includes(username);
              }}
              disabledMessage="You can only set one lead booker and they cannot be altered."
            />
            <p>Once you have set the lead booker you can add other JCR members and guests</p>
            <MemberSearch
              title="Add JCR Members"
              ticketTypeId={this.state.ticketTypeId}
              disabled={this.state.disabled || this.state.memberDisabled || !this.state.leadDisabled || Object.keys(this.state.group).length >= this.state.maxMembers}
              addMember={(details) => this.addToGroup(details, false, false)}
              rejectIf={(username) => {
                return Object.keys(this.state.group).map(i => this.state.group[i].username).includes(username);
              }}
              disabledMessage="Either your group is full or you need to set the lead booker."
            />
            {
              this.state.maxGuests === 0 ? null : (
                <AddGuest
                  disabled={this.state.disabled || !this.state.leadDisabled || this.state.guestDisabled || Object.keys(this.state.group).length >= this.state.maxMembers || Object.keys(this.state.group).map(key => this.state.group[key].guest).filter(r => r === true).length >= this.state.maxGuests}
                  addGuest={(details) => this.addToGroup(details, true, false)}
                  rejectIf={(username) => {
                    return Object.keys(this.state.group).map(i => this.state.group[i].username).includes(username);
                  }}
                  disabledMessage="Either your group is full (for guests or overall) or you need to set the lead booker."
                />
              )
            }
            <div className="py-1">
              <table className="mx-auto border-2 text-left border-red-900 w-full">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Username</th>
                    <th className="p-2 font-semibold">Name</th>
                    <th className="p-2 font-semibold">Guest?</th>
                    <th className="p-2 font-semibold">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    Object.keys(this.state.group).map(key => {
                      const entry = this.state.group[key];

                      return (
                        <tr
                          className={`text-center border-b border-gray-400 ${entry.lead ? "bg-red-100" : ""}`}
                          key={key}
                        >
                          <td className="p-2 border-r border-gray-400">
                            {entry.username}
                          </td>
                          <td className="p-2 border-r border-gray-400">
                            {entry.displayName} {entry.lead ? "(Lead)" : ""}
                          </td>
                          <td className="p-2 border-r border-gray-400">
                            {entry.guest ? "Yes" : "No"}
                          </td>
                          <td className="p-2 border-r border-gray-400">
                            {entry.removable ? (
                              <button
                                onClick={() => this.removeFromGroup(key)}
                                className="px-4 py-1 rounded bg-red-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                              >Remove</button>
                            ) : "N/A"}
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
            <div className="py-1">
              <p className="py-1 font-semibold">Please note that you cannot change the group once you have submitted it so please double check the details are entered correctly!</p>
              <p className="py-1">Each member of the group will receive an email to pay and collect any additional details needed for the event. This must be completed within 24 hours otherwise the booking will be cancelled.</p>
              { Object.keys(this.state.group).length < this.state.ticketType.record.minPeople ? (
                <p className="py-1">This ticket type requires a minimum of {this.state.ticketType.record.minPeople} person before you can book.</p>
              ) : (
                <button
                  onClick={this.submitGroup}
                  className="px-4 py-2 text-lg rounded bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled}
                >Confirm Booking</button>
              ) }
              {
                this.state.submitError.length === 0 ? null : (
                  <p className="py-1 text-red-900 font-semibold">{this.state.submitError}</p>
                )
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EventsAdminBookingPage;
