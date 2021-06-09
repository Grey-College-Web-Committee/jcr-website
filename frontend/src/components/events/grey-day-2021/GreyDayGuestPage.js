import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import GenericCartableItem from '../../cart/GenericCartableItem';

class GreyDayGuestPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      isLoggedIn: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      responsible: false,
      guestName: "",
      detailsConfirmed: false,
      hasGuestTicket: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ loaded: true, isMember: false, isLoggedIn: false });
    }

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        this.setState({ loaded: true, isMember: false });
      }
    } else {
      this.setState({ loaded: true, isMember: false });
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/gd2021");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { loggedIn, availableTickets, hasGreyDayBooking, hasGuestTicket } = content.data;

    this.setState({ loaded: true, status: 200, loggedIn, availableTickets, hasGreyDayBooking, hasGuestTicket });
  }

  renderSelfGuest = () => {
    return (
      <div>
        <p>You do not have a Grey Day ticket. You can book a ticket for yourself for £10.</p>
        <GenericCartableItem
          name="Grey Day Non-Member Ticket"
          price={10}
          image="/images/grey_crest.svg"
          cartData={{
            shop: "gd2021",
            name: "Grey Day Non-Member Ticket",
            basePrice: 10,
            quantity: 1,
            submissionInformation: {
              selfTicket: true,
              guestName: ""
            },
            components: [],
            image: "/images/grey_crest.svg",
            upperLimit: 1
          }}
          disableOnCondition={(items) => {
            return items.filter(item => item.shop === "gd2021").length !== 0;
          }}
        />
      </div>
    )
  }

  renderOtherGuest = () => {
    return (
      <div>
        <p>You already have a Grey Day ticket. You can book a ticket for a guest for £10.</p>
        <div>
          <div>
            Guest Name:
            <input
              type="text"
              value={this.state.guestName}
              onChange={this.onInputChange}
              name="guestName"
              disabled={this.detailsConfirmed}
            />
          </div>
          <div>
            I confirm I am responsible for my guests:
            <input
              type="checkbox"
              checked={this.state.responsible}
              onChange={this.onInputChange}
              name="responsible"
              disabled={this.detailsConfirmed}
            />
          </div>

          <div>
            <button
              disabled={!this.state.responsible || this.state.guestName.length === 0}
              onClick={() => this.setState({ detailsConfirmed: true })}
            >Confirm Details</button>
          </div>
        </div>
        {
          this.state.detailsConfirmed ? (
            <GenericCartableItem
              name="Grey Day Guest Ticket"
              price={10}
              image="/images/grey_crest.svg"
              cartData={{
                shop: "gd2021",
                name: "Grey Day Non-Member Ticket",
                basePrice: 10,
                quantity: 1,
                submissionInformation: {
                  selfTicket: false,
                  guestName: this.state.guestName
                },
                components: [],
                image: "/images/grey_crest.svg",
                upperLimit: 1
              }}
              disableOnCondition={(items) => {
                return items.filter(item => item.shop === "gd2021").length !== 0;
              }}
            />
          ) : null
        }

      </div>
    )
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

    const { loggedIn, availableTickets, hasGreyDayBooking, hasGuestTicket } = this.state;

    if(availableTickets <= 0) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
            <p>No tickets available.</p>
          </div>
        </div>
      )
    }

    if(hasGuestTicket) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
            <p>You have already booked a guest ticket.</p>
          </div>
        </div>
      )
    }

    if(!this.state.isLoggedIn) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets - Logged Out</h1>

          </div>
        </div>
      )
    }

    if(!this.state.isMember) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets - Non-Member</h1>

          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
          <div className="text-left">
            <p className="pb-1">Guest tickets are £10 for non-JCR members. If you are a JCR member and want to book onto the event please contact the Events Manager as JCR member bookings have already closed.</p>
            <p className="pb-1">You can either book yourself on if you are not a JCR member or you can book a single guest onto the event with you.</p>
            {
              hasGreyDayBooking ? this.renderOtherGuest() : this.renderSelfGuest()
            }
          </div>
        </div>
      </div>
    );
  }
}

GreyDayGuestPage.contextType = authContext;

export default GreyDayGuestPage;
