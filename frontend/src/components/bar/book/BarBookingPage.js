import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

const allowedGuests = 11;

class BarBookingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      availableInfo: {},
      disabled: false,
      showBookingDialogue: false,
      bookingDate: null,
      bookingState: 0,
      guestNames: [],
      bookingError: ""
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    try {
      await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status" });
      return;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/bar/book/available");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, availableInfo: content.data.availableInfo });
  }

  bookTable = (date) => {
    this.setState({ bookingDate: date, showBookingDialogue: true, bookingState: 0, guestNames: [...Array(11).keys()].map(() => ""), bookingError: "", disabled: true });
  }

  makeDisplayName = (user) => {
    const upperCaseFirstName = user.firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

    const upperCaseLastName = user.surname;
    const specialCaseList = ["MC", "MAC"];
    const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

    let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

    // Fix special cases like McDonald appearing as Mcdonald
    if(foundSpecialCase.length !== 0) {
      const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
      lastName = upperCaseLastName.substring(c.length);
      lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
    }

    // Fix hyphens
    if(lastName.includes("-")) {
      let capNext = false;
      let newLastName = [];

      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }

        newLastName.push(lastName[i]);
        capNext = lastName[i] === "-";
      }

      lastName = newLastName.join("")
    }

    return `${firstName} ${lastName}`;
  }

  updateGuestName = (e, index) => {
    let { guestNames } = this.state;
    guestNames[index] = e.target.value;
    this.setState({ guestNames });
  }

  placeBooking = async () => {
    this.setState({ bookingState: 1 });

    const { bookingDate, guestNames: unfilteredGuestNames } = this.state;
    const guestNames = unfilteredGuestNames.filter(name => name !== undefined && name !== null && name.length !== 0);

    if(guestNames.length > allowedGuests) {
      this.setState({ bookingState: 999, bookingError: `You are allowed a maximum of ${allowedGuests} guests only.` });
      return;
    }

    let result;

    try {
      result = await api.post("/bar/book", { date: bookingDate, guestNames });
    } catch (error) {
      this.setState({ bookingState: 999, bookingError: error.response.data.error });
      return;
    }

    let { availableInfo } = this.state;
    availableInfo[bookingDate].bookingId = result.data.bookingId;
    availableInfo[bookingDate].availableCount -= 1;

    this.setState({ bookingState: 2, availableInfo, disabled: false })
  }

  renderBookingDialogue = () => {
    if(!this.state.showBookingDialogue) {
      return null;
    }

    switch(this.state.bookingState) {
      case 0:
        return (
          <div className="w-screen h-full overflow-auto flex flex-row justify-center my-auto fixed bg-grey-500 bg-opacity-75 top-0 left-0 block z-10">
            <div className="flex flex-row justify-center overflow-y-auto overflow-x-hidden h-full">
              <div className="flex flex-col bg-white p-4 mx-2 md:mx-0 overflow-y-auto overflow-x-hidden md:w-96 w-full border-2 border-grey-900 h-auto my-auto">
                <h2 className="font-semibold text-3xl">Book Table</h2>
                <p className="mb-1 font-semibold">Selected Date: {dateFormat(this.state.bookingDate, "dd/mm/yyyy")}</p>
                <p>Please enter the names of everybody else who will be attending with you below.</p>
                <p>This cannot be changed without first cancelling your booking.</p>
                <h3 className="text-xl font-semibold my-1">Guests</h3>
                <div>
                  <p>Guest 1: {this.makeDisplayName(this.context)}</p>
                  {
                    [...Array(allowedGuests).keys()].map(i => (
                      this.state.availableInfo[this.state.bookingDate].availableCount <= 1 && i >= 5 ? null : (
                        <div className="flex flex-col mt-1" key={i}>
                          <p>Guest {i + 2} (Optional):</p>
                          <input
                            type="text"
                            className="w-full border border-gray-500 rounded pt-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-gray-800 focus:ring-gray-400"
                            onChange={(ev) => this.updateGuestName(ev, i)}
                            value={this.state.guestNames[i]}
                          />
                        </div>
                      )
                    ))
                  }
                </div>
                <button
                  onClick={this.placeBooking}
                  className="mt-2 px-4 py-1 rounded bg-red-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Confirm Booking</button>
                <button
                  onClick={() => this.setState({ showBookingDialogue: false, disabled: false })}
                  className="mt-2 px-4 py-1 text-sm rounded bg-grey-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Close without Booking</button>
              </div>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="w-screen h-screen flex flex-row justify-center items-center fixed bg-grey-500 bg-opacity-75 top-0 left-0 z-10">
            <div className="flex flex-col w-96 bg-white p-4 border-2 border-grey-900 text-lg">
              <h2 className="mb-2 text-2xl font-semibold">Processing...</h2>
              <LoadingHolder />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-screen h-full overflow-auto flex flex-row justify-center my-auto fixed bg-grey-500 bg-opacity-75 top-0 left-0 block z-10">
            <div className="flex flex-row justify-center overflow-y-auto overflow-x-hidden h-full">
              <div className="flex flex-col bg-white p-4 mx-2 md:mx-0 overflow-y-auto overflow-x-hidden md:w-96 w-full border-2 border-grey-900 h-auto my-auto">
                <h2 className="font-semibold text-3xl">Booking Confirmed!</h2>
                <p>Thank you for your booking!</p>
                <p>Your confirmed guests are:</p>
                <ul className="list-inside list-disc">
                  <li>{this.makeDisplayName(this.context)}</li>
                  {
                    this.state.guestNames.map((name, i) => (
                      name.length === 0 ? null : <li key={i}>{name}</li>
                    ))
                  }
                </ul>
                <button
                  onClick={() => this.setState({ showBookingDialogue: false, disabled: false })}
                  className="mt-2 px-4 py-1 rounded bg-grey-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Close</button>
              </div>
            </div>
          </div>
        );
      case 999:
        return (
          <div className="w-screen h-full overflow-auto flex flex-row justify-center my-auto fixed bg-grey-500 bg-opacity-75 top-0 left-0 block z-10">
            <div className="flex flex-row justify-center overflow-y-auto overflow-x-hidden h-full">
              <div className="flex flex-col bg-white p-4 mx-2 md:mx-0 overflow-y-auto overflow-x-hidden md:w-96 w-full border-2 border-grey-900 h-auto my-auto">
                <h2 className="font-semibold text-3xl">Booking Error</h2>
                <p>{this.state.bookingError}</p>
                <button
                  onClick={() => this.setState({ showBookingDialogue: false, disabled: false })}
                  className="mt-2 px-4 py-1 rounded bg-grey-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Close</button>
              </div>
            </div>
          </div>
        )
      default:
        return null;
    }
  }

  // bookTable = async (date) => {
  //   this.setState({ disabled: true });
  //
  //   let result;
  //
  //   try {
  //     result = await api.post("/bar/book", { date });
  //   } catch (error) {
  //     alert(error.response.data.error);
  //     this.setState({ disabled: false });
  //     return;
  //   }
  //
  //   let { availableInfo } = this.state;
  //   availableInfo[date].bookingId = result.data.bookingId;
  //   availableInfo[date].availableCount -= 1;
  //
  //   this.setState({ disabled: false, availableInfo });
  // }

  cancelBooking = async (date, id) => {
    this.setState({ disabled: true });

    try {
      await api.post("/bar/book/cancel", { id });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    let { availableInfo } = this.state;
    availableInfo[date].bookingId = null;
    availableInfo[date].availableCount += 1;

    this.setState({ disabled: false, availableInfo });
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

    const { availableInfo } = this.state;

    return (
      <React.Fragment>
        {this.renderBookingDialogue()}
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-2">Book a Table</h1>
            <p className="mt-1 text-left">Grey Bar is now open to all members of the college! We have made several adjustments to the bar to ensure that we can operate in a COVID-secure manner - namely operating from a brand new outside space on Grey Lawn (until restrictions change) and a <Link to="/bar" className="underline font-semibold">new table booking and ordering system</Link> that makes your lives as customers much, much easier.</p>
            <p className="mt-1 text-left">From Monday 24th May, our opening hours are:</p>
            <ul className="mt-1 text-lg font-semibold">
              <li>Monday - 7:30 - 11pm</li>
              <li>Tuesday - 7:30 - 11pm</li>
              <li>Wednesday - 7:30 - 11pm</li>
              <li>Thursday - 7:30 - 11pm</li>
              <li>Friday - 7:30 - 12am</li>
              <li>Saturday - 7:30 - 12am</li>
              <li>Sunday - 7:30 - 11pm</li>
            </ul>
            <p className="mt-1 text-left"><span className="font-semibold">We are now open to groups of 12 from any number of households</span> (including a mix of livers-in and livers-out). The names of all guests must be provided. <span className="font-semibold">Non-Grey students can also join your group</span> as long as Grey students remain the majority.</p>
            <p className="mt-1 text-left">We will also be allowing <span className="font-semibold">last-minute walk-ins for groups of 6 or less only</span> (as long as there are enough unreserved tables and staff).</p>
            <p className="mt-1 text-left">As per University Regulations <span className="font-semibold">we are required to carry out track and trace</span> and also ask for proof of a <span className="font-semibold">negative LFT test within the last 4 days from all group members.</span></p>
            <div className="flex-col flex w-full md:w-3/5 mx-auto">
              {
                Object.keys(availableInfo).map(date => (
                  <div className="border mt-4 p-2 w-full text-left text-lg">
                    <p className="text-left text-2xl font-semibold">Book for {dateFormat(date, "dd/mm/yyyy")}</p>
                    {
                      availableInfo[date].bookingId === null ? (
                        <div>
                          {
                            availableInfo[date].availableCount === 0 ? (
                              <div>
                                {
                                  availableInfo[date].open ? (
                                    <p>There are no more tables available for this night.</p>
                                  ) : (
                                    <p>The bar is closed on this night.</p>
                                  )
                                }
                              </div>
                            ) : (
                              <div>
                                <p>Available Tables: {availableInfo[date].availableCount}</p>
                                <button
                                  disabled={this.state.disabled}
                                  onClick={() => this.bookTable(date)}
                                  className="mt-2 px-4 py-1 rounded bg-grey-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                                >Book Now</button>
                              </div>
                            )
                          }
                        </div>
                      ) : (
                        <div>
                          <p>Thank you for your booking.</p>
                          <button
                            disabled={this.state.disabled}
                            className="mt-2 px-4 py-1 rounded bg-red-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                            onClick={() => this.cancelBooking(date, availableInfo[date].bookingId)}
                          >Cancel</button>
                        </div>
                      )
                    }
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

BarBookingPage.contextType = authContext;

export default BarBookingPage;
