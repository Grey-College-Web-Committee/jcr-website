import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

class EventsFreeReqPage extends React.Component {
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
      paid: false,
      extraDetailsGiven: false,
      providedInfo: null,
      requiredInfoStructure: null,
      requiredInfoForms: {}
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
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    const { paid } = content.data;

    if(paid) {
      this.setState({ loaded: true, status: 200, paid });
      return;
    }

    if(!content.data.hasOwnProperty("detailsOnly")) {
      this.setState({ loaded: false, status: 400 });
      // handle, wrong page
      return;
    }

    // Load all of the content, there is a lot going on
    const { ticket, guestTickets, totalCost } = content.data;
    const { EventGroupBooking } = ticket;
    const { Event, EventTicketType } = EventGroupBooking;
    // Add 1 day on to the time the group was created
    const bookingCloses = new Date(new Date(EventGroupBooking.createdAt).getTime() + 60 * 60 * 24 * 1000);
    const requiredInfoStructure = JSON.parse(EventTicketType.requiredInformationForm);

    // Set the defaults to blanks or the default if it is a dropdown
    // This is for the additional information forms
    let providedInfo = {};
    let extraDetailsGiven = false;

    if(Object.keys(requiredInfoStructure).length === 0 || ticket.requiredInformation !== null) {
      extraDetailsGiven = true;
    } else {
      providedInfo[ticket.id] = {};
      guestTickets.forEach((guest, i) => {
        providedInfo[guest.id] = {};
      });

      Object.keys(requiredInfoStructure).forEach(ek => {
        const element = requiredInfoStructure[ek];
        let defaultValue = element.type === "checkbox" ? false : "";

        if(element.type === "dropdown") {
          Object.keys(element.dropdownValues).forEach(dk => {
            const dropdownValue = element.dropdownValues[dk];
            const { is_default, value } = dropdownValue;

            if(is_default || value.length === 0) {
              defaultValue = value;
            }
          });
        }

        providedInfo[ticket.id][element.name] = defaultValue;
        guestTickets.forEach((guest, i) => {
          providedInfo[guest.id][element.name] = defaultValue;
        });
      });
    }

    this.setState({ loaded: true, status: 200, ticket, guestTickets, event: Event, group: EventGroupBooking, type: EventTicketType, bookingCloses, totalCost, paid, providedInfo, extraDetailsGiven, requiredInfoStructure });
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

  renderExtraDetailsForms = () => {
    // Renders the extra detail forms
    const { ticket, guestTickets } = this.state;

    return (
      <div className="w-full">
        <div className="border p-2 my-1">
          <h3 className="font-semibold text-2xl">Your Details</h3>
          {this.renderExtraDetailForm(ticket.id)}
        </div>
        {
          guestTickets.map((t, key) => (
            <div className="border p-2 my-1">
              <h3 className="font-semibold text-2xl">Guest: {t.guestName}</h3>
              {this.renderExtraDetailForm(t.id)}
            </div>
          ))
        }
      </div>
    )
  }

  onExtraDetailChange = e => {
    // We want to only change the data for the specific ticket
    // So we use a data field to relay this
    const ticketId = e.target.getAttribute("data-ticket");

    let { providedInfo } = this.state;
    providedInfo[ticketId][e.target.name] = e.target.type === "checkbox" ? e.target.checked : e.target.value;

    this.setState({ providedInfo });
  }

  renderExtraDetailForm = (ticketId) => {
    const { requiredInfoStructure } = this.state;
    let formElements = [];

    // This will actually create the components to be rendered in the form
    Object.keys(requiredInfoStructure).forEach((ek, i) => {
      const element = requiredInfoStructure[ek];
      const { name, type } = element;
      let htmlElement = null;

      // Need to handle each type separately
      switch(type) {
        // This creates the dropdown
        case "dropdown":
          let options = [];
          const { dropdownValues } = element;

          // Make the options first
          Object.keys(dropdownValues).forEach((dk, j) => {
            const dropdownValue = dropdownValues[dk];
            const { value } = dropdownValue;

            options.push(
              (<option
                value={value}
              >{value}</option>)
            );
          });

          // Then make the select
          // We set the value to the default which was determined in componentDidMount
          htmlElement = (
            <select
              name={name}
              data-ticket={ticketId}
              className="w-auto border border-black rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onExtraDetailChange}
              value={this.state.providedInfo[ticketId][name]}
            >
              {options.map(o => (
                o
              ))}
            </select>
          );
          break;
        case "freetext":
          // Free text is a lot easier
          htmlElement = (
            <textarea
              name={name}
              data-ticket={ticketId}
              onChange={this.onExtraDetailChange}
              value={this.state.providedInfo[ticketId][name]}
              className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              maxLength={1000}
            />
          );
          break;
        case "checkbox":
          // Checkbox is also easier too
          htmlElement = (
            <input
              type="checkbox"
              name={name}
              data-ticket={ticketId}
              onChange={this.onExtraDetailChange}
              checked={this.state.providedInfo[ticketId][name]}
              className="p-2 h-6 w-6 align-middle mx-2 rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            />
          )
          break;
        default:
          return;
      }

      // For checkboxes we want the text on the same line
      // For the other fields we want them to be on new lines
      if(type === "checkbox") {
        formElements.push((
          <div className="flex flex-row justify-start my-2 items-center">
            <p className="text-lg font-semibold">{name}</p>
            {htmlElement}
          </div>
        ))
      } else {
        formElements.push((
          <div className="flex flex-col justify-start my-2">
            <p className="text-lg font-semibold">{name}</p>
            {type === "freetext" ? <span className="text-left">({1000 - this.state.providedInfo[ticketId][name].length} characters remaining)</span> : null}
            {htmlElement}
          </div>
        ));
      }
    });

    return formElements;
  }

  saveRequiredInformation = async () => {
    const { providedInfo, requiredInfoStructure } = this.state;

    // Checks that the information entered matches what we wanted
    for(const i in requiredInfoStructure) {
      const part = requiredInfoStructure[i];

      for(const ticketId in providedInfo) {
        const infoPart = providedInfo[ticketId][part.name];

        switch(part.type) {
          // Make sure the dropdown options are actually valid
          case "dropdown":
            if(!Object.keys(part.dropdownValues).map(k => part.dropdownValues[k].value).includes(infoPart)) {
              alert("Invalid dropdown choice");
              return;
            }

            break;
          case "freetext":
            // If it is required make sure that it has some text
            if(part.required && infoPart.length === 0) {
              alert(`You must fill in the ${part.name} field`);
              return;
            }

            if(infoPart.length > 1000) {
              alert("Text fields are limited to 1000 characters");
              return;
            }

            break;
          case "checkbox":
            // Nothing to check here
            break;
          default:
            // Shouldn't happen
            alert("Unknown type");
            return;
        }
      }
    }

    // Send it to the server
    try {
      await api.post("/events/booking/forms", { providedInfo });
    } catch (error) {
      alert(error.response.data.error);
      return;
    }

    // Render the next section
    this.setState({ extraDetailsGiven: true });
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

    // Might need to change / remove
    if(this.state.paid) {
      // We want to redirect to the booking overview instead I think
      return (
        <Redirect to={`/my/ticket/${this.state.id}`} />
      )
    }

    const { event, guestTickets, extraDetailsGiven } = this.state;

    // On successful payment
    if(extraDetailsGiven) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 w-full md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Details Recorded Successfully!</h1>
            <p className="py-1">The entered details have been recorded.</p>
            <p className="font-semibold text-xl py-1">Thank you!</p>
          </div>
        </div>
      );
    }

    // Renders the extra detail forms if they aren't set (or are being changed)
    if(!extraDetailsGiven) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">{event.name}</h1>
            <div className="flex flex-row justify-center">
              <div className="flex flex-col text-justify items-center md:w-3/5 w-full">
                <div className="w-full p-2">
                  <h2 className="font-semibold text-3xl pb-2">Extra Information Required</h2>
                  <p>This event requires some additional information, please fill in the form{guestTickets.length === 0 ? "" : "s"} below:</p>
                </div>
                <div className="w-full p-2">
                  {this.renderExtraDetailsForms()}
                </div>
                <div className="w-full px-2 flex flex-col">
                  <p className="font-semibold py-1">Once you save these details, they cannot be altered.</p>
                  <button
                    onClick={this.saveRequiredInformation}
                    className="px-4 py-1 text-xl rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  >Save Details</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

EventsFreeReqPage.contextType = authContext;

export default EventsFreeReqPage;
