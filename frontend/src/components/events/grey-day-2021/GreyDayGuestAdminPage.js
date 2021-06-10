import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

class GreyDayGuestAdminPagePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
    };

    // Change this to your permission
    this.requiredPermission = "events.manage";
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

    let content;

    try {
      content = await api.get("/gd2021/admin");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { availableTickets, greyDayBookingOpen, greyDayEventId, maxTickets } = content.data;

    this.setState({ loaded: true, availableTickets, greyDayBookingOpen, greyDayEventId, maxTickets, maxTicketsTemp: maxTickets });
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

    const { availableTickets, greyDayBookingOpen, greyDayEventId, maxTickets } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Manage Grey Day Guest Tickets</h1>
          <div className="flex flex-col items-start mb-2">
            <h2 className="text-2xl font-semibold">Booking Open Status</h2>
            <p className="text-left font-semibold text-lg py-1 mr-2">Open Status: { greyDayBookingOpen ? "Open" : "Closed" }</p>
            <button
              onClick={this.toggleOpen}
              className={`px-4 py-1 rounded ${ greyDayBookingOpen ? "bg-red-700" : "bg-green-700" } text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
            >{ greyDayBookingOpen ? "Set Closed" : "Set Open" }</button>
          </div>
          <div className="flex flex-col items-start mb-2">
            <h2 className="text-2xl font-semibold">Ticket Availability</h2>
            <p className="text-left font-semibold text-lg py-1 mr-2">Tickets Available: {availableTickets} / {maxTickets}</p>
            <div className="pt-2 pb-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold">Max Tickets</label>
              <span className="flex flex-row justify-start text-sm mb-2">The maximum of guest tickets that can be booked</span>
              <input
                type="number"
                name="maxTicketsTemp"
                value={this.state.maxTicketsTemp}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                step={1}
                min={0}
              />
            </div>
            <button
              onClick={this.updateMaxTickets}
              className={`px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
            >Save Max Tickets</button>
          </div>
        </div>
      </div>
    );
  }
}

export default GreyDayGuestAdminPagePage;
