import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../../utils/axiosConfig';

class EventTicketRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stripePaymentId: props.ticket.stripePaymentId,
      paid: props.ticket.paid,
      disabled: false
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

  markAsPaid = async () => {
    this.setState({ disabled: true });

    if(this.state.paid) {
      alert("This user has already paid for their ticket");
      return;
    }

    // Overrides the payment for this ticket ID
    try {
      await api.post("/events/booking/override", { ticketId: this.props.ticket.id });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ disabled: false, paid: true, stripePaymentId: "overridden" });
  }

  render () {
    const { ticket } = this.props;
    const { paid, stripePaymentId } = this.state;

    // Separate out the guests from the normal tickets
    if(ticket.isGuestTicket) {
      return (
        <tr className="text-center border-b border-gray-400">
          <td className="p-2 border-r border-gray-400">{ticket.id}</td>
          <td className="p-2 border-r border-gray-400">{ticket.guestName}</td>
          <td className="p-2 border-r border-gray-400">{ticket.guestUsername}</td>
          <td className="p-2 border-r border-gray-400">Yes</td>
          <td className="p-2 border-r border-gray-400">(See Lead Booker)</td>
          <td className="p-2 border-r border-gray-400">(See Lead Booker)</td>
          <td className="p-2 border-r border-gray-400">(See Lead Booker)</td>
        </tr>
      )
    }

    console.log({ticket})

    let overrideButton = "Requires Additional Information";

    // It is difficult to allow override before the extra required information is enter
    // so we require that they have filled in the form first
    if(!this.props.requiresInformation) {
      overrideButton = (
        <button
          className="px-4 py-1 rounded bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          onClick={this.markAsPaid}
          disabled={this.state.disabled}
        >Mark as Paid</button>
      );
    }

    const isLeadBooker = this.props.leadBooker.id === ticket.User.id;
    const additionalClasses = isLeadBooker ? "bg-red-100 font-semibold" : "";

    return (
      <tr className={`text-center border-b border-gray-400 ${additionalClasses}`}>
        <td className="p-2 border-r border-gray-400">{ticket.id}</td>
        <td className="p-2 border-r border-gray-400">
          {this.makeDisplayName(ticket.User)} {isLeadBooker ? "(Lead)" : ""}
        </td>
        <td className="p-2 border-r border-gray-400">{ticket.User.username}</td>
        <td className="p-2 border-r border-gray-400">No</td>
        <td className="p-2 border-r border-gray-400">{paid ? "Yes" : "No"}</td>
        <td className="p-2 border-r border-gray-400">
          {paid ? "Already Paid" : overrideButton}
        </td>
        <td className="p-2 border-r border-gray-400">
          {paid ? stripePaymentId : "N/A"}
        </td>
      </tr>
    );
  }
}

EventTicketRow.propTypes = {
  ticket: PropTypes.object.isRequired,
  requiresInformation: PropTypes.bool.isRequired,
  leadBooker: PropTypes.object.isRequired,
}

export default EventTicketRow;
