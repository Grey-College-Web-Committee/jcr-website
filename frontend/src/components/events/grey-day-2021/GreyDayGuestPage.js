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
      hasGuestTicket: false,
      greyDayBookingOpen: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck = null;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ loaded: true, isMember: false, isLoggedIn: false });
      membershipCheck = null;
    }

    // Ensure they are an admin
    if(membershipCheck && membershipCheck.data.user.permissions) {
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

    const { loggedIn, availableTickets, hasGreyDayBooking, hasGuestTicket, greyDayBookingOpen } = content.data;

    this.setState({ loaded: true, status: 200, loggedIn, availableTickets, hasGreyDayBooking, hasGuestTicket, greyDayBookingOpen });
  }

  renderSelfGuest = () => {
    return (
      <div>
        <p className="font-semibold">You do not have a Grey Day ticket. You can book a ticket for yourself for £10. To do so, add the item below to your bag.</p>
        <div className="flex flex-col items-center">
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
      </div>
    )
  }

  renderOtherGuest = () => {
    return (
      <div className="text-left">
        <p className="pb-1">You already have a Grey Day ticket. You can book a ticket for a guest for £10.</p>
        {
          this.state.detailsConfirmed ? (
            <div className="flex flex-col items-center">
              <div className="w-full">
                <p className="font-semibold text-left">Your guest's details have been confirmed. You can now add the ticket to your bag and checkout.</p>
              </div>
              <GenericCartableItem
                name="Grey Day Guest Ticket"
                description={`Guest Name: ${this.state.guestName}`}
                price={10}
                image="/images/grey_crest.svg"
                cartData={{
                  shop: "gd2021",
                  name: "Grey Day Guest Ticket",
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
            </div>
        ) : (
          <React.Fragment>
            <p className="font-semibold">Please fill in your guest's name below and then click the button to confirm their details. You will then be able to add a ticket to your bag for checkout.</p>
            <div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Guest Name</label>
                <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.guestName.length} characters remaining)</span>
                <input
                  type="text"
                  name="guestName"
                  value={this.state.guestName}
                  onChange={this.onInputChange}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.detailsConfirmed}
                  autoComplete=""
                  maxLength={255}
                />
              </div>
              <div className="flex flex-row justify-start pt-2 pb-2 border-b-2 items-center">
                <p className="text-lg font-semibold">I agree that I am responsible for my guests:</p>
                <input
                  type="checkbox"
                  name="responsible"
                  onChange={this.onInputChange}
                  checked={this.state.responsible}
                  className="p-2 h-8 w-8 align-middle mx-2 rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <button
                  className="px-4 py-2 rounded text-xl bg-grey-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={!this.state.responsible || this.state.guestName.length === 0}
                    onClick={() => this.setState({ detailsConfirmed: true })}
                >Confirm Details</button>
              </div>
            </div>
          </React.Fragment>
        )
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

    const { loggedIn, availableTickets, hasGreyDayBooking, hasGuestTicket, greyDayBookingOpen } = this.state;

    if(!greyDayBookingOpen) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
            <p className="text-left">Grey Day guest ticket booking is not currently open. Please check for emails from the Events Manager to find out when they will be available!</p>
          </div>
        </div>
      )
    }

    if(availableTickets <= 0) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
            <p>Grey Day is fully sold out! There are no more tickets available.</p>
          </div>
        </div>
      )
    }

    if(hasGuestTicket) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
            <p className="text-center">You have already booked a guest ticket.</p>
          </div>
        </div>
      )
    }

    if(!this.state.isLoggedIn) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
            <div className="text-left">
              <p className="pb-1">Grey Day is an annual event hosted on Grey Lawn celebrating all things Grey. There will be great entertainment, performances, food, and hopefully good weather! Tickets for JCR members have already been released and we are now accepting guest bookings.</p>
              <p className="pb-1">If you are a current of member of Grey College (regardless of JCR membership) <a href="/accounts/login?ref=/events/grey-day-2021-guests" className="font-semibold underline">please login</a> to purchase a ticket.</p>
              <p className="pb-1">For recent graduates, please either ask a current JCR member to book you on as a guest or contact the current FACSO, Will Morrice (grey.treasurer@durham.ac.uk), or the Events Manager Ellie Reid (grey.events@durham.ac.uk)</p>
            </div>
          </div>
        </div>
      )
    }

    if(!this.state.isMember) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
            <div className="text-left">
              <p className="pb-1">Grey Day is an annual event hosted on Grey Lawn celebrating all things Grey. There will be great entertainment, performances, food, and hopefully good weather! Tickets for JCR members have already been released and we are now accepting guest bookings.</p>
              <p className="pb-1">You can book yourself on as you are not a JCR member. Tickets cost £10.</p>
              <p className="pb-1">Tickets Remaining: { this.state.availableTickets }</p>
              { this.renderSelfGuest() }
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4 md:w-3/5">
          <h1 className="font-semibold text-5xl pb-4">Grey Day Guest Tickets</h1>
          <div className="text-left">
            <p className="pb-1">Grey Day is an annual event hosted on Grey Lawn celebrating all things Grey. There will be great entertainment, performances, food, and hopefully good weather! Tickets for JCR members have already been released and we are now accepting guest bookings.</p>
            <p className="pb-1">You can either book yourself on if you are not a JCR member or you can book a single guest onto the event with you. Guest tickets are £10.</p>
            <p className="pb-1">Tickets Remaining: { this.state.availableTickets }</p>
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
