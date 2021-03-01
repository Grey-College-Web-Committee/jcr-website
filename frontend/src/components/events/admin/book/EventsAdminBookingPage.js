import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';

class EventsAdminBookingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      eventId: props.match.params.eventId,
      ticketTypeId: props.match.params.ticketTypeId,
      loaded: false,
      status: 0,
      error: ""
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

    this.setState({ loaded: true });
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
          <h1 className="font-semibold text-5xl pb-4">Admin Group Booking</h1>
          <p className="py-1 text-justify">You can create bookings on the behalf of other users (e.g. for the Sportsperson Formal) this works in the same way as any other type of booking except that you do not necessarily have to be in the group. It will still check to make sure people are JCR members, have consented to the events terms and conditions, do not have debt, and have not already been booked on to the event. Once the booking is confirmed all of the users will be emailed with a payment link as normal. They will have 24 hours to pay otherwise their entire groups booking will be cancelled.</p>
        </div>
      </div>
    );
  }
}

export default EventsAdminBookingPage;
