import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import MemberSearch from './MemberSearch';
import AddGuest from './AddGuest';

class EventsGroupBookingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.match.params.id,
      type: this.props.match.params.type,
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      ticketType: null,
      group: {},
      maxMembers: 0,
      maxGuests: 0,
      disabled: false,
      memberDisabled: false,
      guestDisabled: false,
      unavailable: null,
      booked: false
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
    let ticketType;

    try {
      ticketType = await api.get(`/events/ticketType/${this.state.type}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    if(!ticketType.data.available) {
      this.setState({ loaded: true, status: 200, unavailable: ticketType.data.reason });
      return;
    }

    const { userId } = membershipCheck.data.user;

    const userRecord = {
      id: userId,
      username: this.context.username.toLowerCase(),
      removable: false,
      displayName: this.makeDisplayName(this.context),
      guest: false
    }

    const group = { "0": userRecord }
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

  addToGroup = (details, guest) => {
    const userRecord = {
      id: details.id,
      username: details.username.toLowerCase(),
      removable: true,
      displayName: this.makeDisplayName(details),
      guest
    }

    const nextId = Object.keys(this.state.group).length === 0 ? 0 : Math.max(...Object.keys(this.state.group)) + 1;
    let { group } = this.state;

    group[nextId] = userRecord;

    this.setState({ group });
    return true;
  }

  removeFromGroup = (key) => {
    let { group } = this.state;
    delete group[key];
    this.setState({ group });
  }

  submitGroup = async () => {
    this.setState({ disabled: true });

    const { group, maxMembers, maxGuests, type } = this.state;
    const { minMembers } = this.state.ticketType.record;
    const totalMembers = Object.keys(group).length;
    const totalGuests = Object.keys(group).map(k => group[k].guest).filter(guest => guest === true).length;

    if(totalMembers < minMembers) {
      this.setState({ disabled: false, error: `You must have at least ${minMembers} people in your group` });
      return;
    }

    if(totalMembers > maxMembers) {
      this.setState({ disabled: false, error: `You can only have a maximum of ${maxMembers} people in your group` });
      return;
    }

    if(totalGuests > maxGuests) {
      this.setState({ disabled: false, error: `You can only have a maximum of ${maxGuests} guests in your group` });
      return;
    }

    const packaged = Object.keys(group).map(k => group[k]);

    let result;

    try {
      result = await api.post("/events/booking", { group: packaged, ticketTypeId: type });
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

      if(!this.state.isMember) {
          return (
            <Redirect to="/membership" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    if(this.state.booked) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Booking Successful!</h1>
            <div className="py-1">
              <p className="py-1">Your group has been successfully booked on to the event. Please check your Durham University email address for more details on how to complete this booking and pay. Each member of your group has 24 hours to pay for their ticket and enter any additional details required for this ticket (e.g. dietary requirements).</p>
              <p className="py-1">Your confirmed group is as follows:</p>
            </div>
            <div className="py-1">
              <table className="mx-auto border-2 text-left border-red-900 w-full">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Username</th>
                    <th className="p-2 font-semibold">Name</th>
                    <th className="p-2 font-semibold">Guest?</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    Object.keys(this.state.group).map(key => {
                      const entry = this.state.group[key];

                      return (
                        <tr
                          className="text-center border-b border-gray-400"
                          key={key}
                        >
                          <td className="p-2 border-r border-gray-400">
                            {entry.username}
                          </td>
                          <td className="p-2 border-r border-gray-400">
                            {entry.displayName}
                          </td>
                          <td className="p-2 border-r border-gray-400">
                            {entry.guest ? "Yes" : "No"}
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if(this.state.unavailable !== null) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Ticket Unavailable</h1>
          </div>
        </div>
      );
    }

    const ticketType = this.state.ticketType.record;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">{ticketType.Event.name}</h1>
          <div className="border border-gray-500 w-full md:w-3/5 mx-auto p-2 text-justify">
            <h2 className="font-semibold text-2xl pb-2">{ticketType.name}</h2>
            <p>{ticketType.description}</p>
            <MemberSearch
              ticketTypeId={this.state.type}
              disabled={this.state.disabled || this.state.memberDisabled || Object.keys(this.state.group).length >= this.state.maxMembers}
              addMember={(details) => this.addToGroup(details, false)}
              rejectIf={(username) => {
                return Object.keys(this.state.group).map(i => this.state.group[i].username).includes(username);
              }}
            />
            {
              this.state.maxGuests === 0 ? null : (
                <AddGuest
                  disabled={this.state.disabled || this.state.guestDisabled || Object.keys(this.state.group).length >= this.state.maxMembers || Object.keys(this.state.group).map(key => this.state.group[key].guest).filter(r => r === true).length >= this.state.maxGuests}
                  addGuest={(details) => this.addToGroup(details, true)}
                  rejectIf={(username) => {
                    return Object.keys(this.state.group).map(i => this.state.group[i].username).includes(username);
                  }}
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
                          className="text-center border-b border-gray-400"
                          key={key}
                        >
                          <td className="p-2 border-r border-gray-400">
                            {entry.username}
                          </td>
                          <td className="p-2 border-r border-gray-400">
                            {entry.displayName}
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
              <p className="py-1 font-semibold">Please note that you cannot change your group once you have submitted it so please double check the details are entered correctly!</p>
              <p className="py-1">Each member of your group will receive an email to pay and collect any additional details needed for the event. This must be completed within 24 hours otherwise your booking will be cancelled and we cannot guarantee that you will be able to rebook on to the event.</p>
              { Object.keys(this.state.group).map(key => this.state.group[key].guest).filter(guest => guest === true).length === 0 ? null : (
                <p className="py-1">As you have guests in your group, the lead booker ({this.state.group[0].displayName}) will be responsible for all guests in this group and will be expected to pay on behalf of all of the guests for the event tickets as well as fill out any additional details required for the event.</p>
              )}
              { Object.keys(this.state.group).length < this.state.ticketType.record.minPeople ? (
                <p className="py-1">This ticket type requires a minimum of {this.state.ticketType.record.minPeople} person before you can book.</p>
              ) : (
                <button
                  onClick={this.submitGroup}
                  className="px-4 py-2 text-lg rounded bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Confirm Booking</button>
              ) }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

EventsGroupBookingPage.contextType = authContext;

export default EventsGroupBookingPage;
