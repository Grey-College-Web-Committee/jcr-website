import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import MemberSearch from './MemberSearch';

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
      ticketType: null
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

    this.setState({ loaded: true, status: 200, ticketType: ticketType.data });
  }

  addToGroup = (details) => {
    console.log("Added", details);
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

    if(!this.state.ticketType.available) {
      return (
        <div>
          Unavailable
        </div>
      )
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
              disabled={false}
              addMember={this.addToGroup}
            />
          </div>
        </div>
      </div>
    );
  }
}

EventsGroupBookingPage.contextType = authContext;

export default EventsGroupBookingPage;
