import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import CreateTicketComponent from './CreateTicketComponent';

class CreateNewEventPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      name: "",
      date: null,
      shortDescription: "",
      description: "",
      maxIndividuals: 1,
      bookingCloseTime: null,
      disabled: false,
      ticketTypes: {}
    };

    // Change this to your permission
    this.requiredPermission = "events.manage";
    this.createNewTicketType();
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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

    this.setState({ loaded: true });
  }

  createNewTicketType = () => {
    const ticket = {
      name: "",
      description: "",
      maxOfType: "",
      minPeople: "",
      maxPeople: "",
      maxGuests: "",
      memberPrice: "",
      guestPrice: "",
      firstYearReleaseTime: null,
      secondYearReleaseTime: null,
      thirdYearReleaseTime: null,
      fourthYearReleaseTime: null,
      olderYearsCanOverride: true
    };

    const nextId = Object.keys(this.state.ticketTypes).length === 0 ? 0 : Math.max(...Object.keys(this.state.ticketTypes)) + 1;
    let newTickets = this.state.ticketTypes;
    newTickets[nextId] = ticket;

    this.setState({ ticketTypes: newTickets });
  }

  updateTicketType = (id, data) => {
    let newTickets = this.state.ticketTypes;
    newTickets[id] = data;
    this.setState({ ticketTypes: newTickets });
  }

  deleteTicketType = (id) => {
    let newTickets = this.state.ticketTypes;
    delete newTickets[id];
    this.setState({ ticketTypes: newTickets });
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Create New Event</h1>
          <p className="text-justify pb-2">Important: You must <a className="underline font-semibold" href="https://support.google.com/chrome/answer/95346?co=GENIE.Platform%3DDesktop&hl=en" rel="noopener noreferrer" target="_blank">use Google Chrome</a> or <a className="underline font-semibold" href="https://www.microsoft.com/en-us/edge" rel="noopener noreferrer" target="_blank">Microsoft Edge</a> otherwise the date and time selector will not show up. This is unfortunately caused by other browsers not supporting the feature (support is coming in the next major update to Safari on macOS). This page will not be easy to use on mobile devices due to the large amount of content that is needed.</p>
          <div className="flex flex-col items-center w-3/5 mx-auto">
            <div className="w-full">
              <h2 className="font-semibold text-5xl pb-2">Event Details</h2>
              <fieldset>
                <div className="pb-2 border-b-2">
                  <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Event Name</label>
                  <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.name.length} characters remaining)</span>
                  <input
                    type="text"
                    name="name"
                    value={this.state.name}
                    onChange={this.onInputChange}
                    className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    disabled={this.state.disabled}
                    autoComplete=""
                    maxLength={255}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="date" className="flex flex-row justify-start text-xl font-semibold">Event Date and Time</label>
                  <span className="flex flex-row justify-start text-sm mb-2">This is the date and time of the actual event</span>
                  <input
                    type="datetime-local"
                    name="date"
                    value={this.state.date}
                    className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    onChange={this.onInputChange}
                    autoComplete=""
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="shortDescription" className="flex flex-row justify-start text-xl font-semibold">Short Description</label>
                  <span className="flex flex-row justify-start text-sm">This will be displayed on the overview of upcoming events</span>
                  <span className="flex flex-row justify-start text-sm mb-2">({500 - this.state.shortDescription.length} characters remaining)</span>
                  <textarea
                    name="shortDescription"
                    value={this.state.shortDescription}
                    onChange={this.onInputChange}
                    className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    disabled={this.state.disabled}
                    autoComplete=""
                    maxLength={500}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="description" className="flex flex-row justify-start text-xl font-semibold">Full Description</label>
                  <span className="flex flex-row justify-start text-sm">This will be displayed on the page specifically for this event</span>
                  <span className="flex flex-row justify-start text-sm mb-2">({30000 - this.state.description.length} characters remaining)</span>
                  <textarea
                    name="description"
                    value={this.state.description}
                    onChange={this.onInputChange}
                    className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    disabled={this.state.disabled}
                    autoComplete=""
                    maxLength={30000}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="maxIndividuals" className="flex flex-row justify-start text-xl font-semibold">Maximum Number of Individuals</label>
                  <span className="flex flex-row justify-start text-sm pb-2">The total number of people who can attend. You can also limit the amount of each ticket.</span>
                  <input
                    type="number"
                    name="maxIndividuals"
                    value={this.state.maxIndividuals}
                    className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    onChange={this.onInputChange}
                    autoComplete=""
                    min={1}
                    step={1}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="bookingCloseTime" className="flex flex-row justify-start text-xl font-semibold">Booking Closing Date and Time</label>
                  <span className="flex flex-row justify-start text-sm">This is the cutoff for booking on to the event.</span>
                  <span className="flex flex-row justify-start text-sm font-semibold pb-2">They will have 24 hours after this deadline to pay. Please account for this!</span>
                  <input
                    type="datetime-local"
                    name="bookingCloseTime"
                    value={this.state.bookingCloseTime}
                    className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    onChange={this.onInputChange}
                    autoComplete=""
                  />
                </div>
              </fieldset>
            </div>
            <div className="w-full mt-6">
              <h2 className="font-semibold text-5xl pb-2">Event Tickets</h2>
              <div className="flex flex-col">
                <div className="flex flex-row justify-start pb-4">
                  <button
                    className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled}
                    onClick={this.createNewTicketType}
                  >Add New Ticket Type</button>
                </div>
                {
                  Object.keys(this.state.ticketTypes).length === 0 ? (
                    <div className="flex flex-row justify-start">
                      <p className="font-semibold text-xl">No ticket types added.</p>
                    </div>
                  ) : (
                    Object.keys(this.state.ticketTypes).map((id) => {
                      const ticketType = this.state.ticketTypes[id];

                      return (
                        <div className="flex flex-col border-2 border-black" key={id}>
                          <CreateTicketComponent
                            id={id}
                            passUp={this.updateTicketType}
                          />
                          <div className="p-2 flex flex-row justify-start">
                            <button
                              className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                              onClick={() => {
                                this.deleteTicketType(id)
                              }}
                            >Delete Ticket Type</button>
                          </div>
                        </div>
                      )
                    })
                  )
                }
                {
                  Object.keys(this.state.ticketTypes).length === 0 ? null : (
                    <div className="flex flex-row justify-start py-4">
                      <button
                        className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        disabled={this.state.disabled}
                        onClick={this.createNewTicketType}
                      >Add New Ticket Type</button>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateNewEventPage;
