import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

class EventsOverviewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: []
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
      content = await api.get("/events");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, events: content.data.records });
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Events</h1>
          <p>Put some text here about Grey Events...</p>
          <div className="flex flex-col pt-4">
            {
              this.state.events.map((record, i) => (
                <div key={i} className="border-2 border-black p-2 text-left">
                  <div className="flex flex-col md:flex-row">
                    {
                      record.EventImages.length === 0 ? null : (
                        <div className="border flex flex-row justify-center">
                          <img
                            src={`/uploads/images/events/${record.EventImages[0].image}`}
                            alt={record.EventImages[0].caption}
                            className="w-auto h-56"
                          />
                        </div>
                      )
                    }
                    <div className="flex flex-col justify-between border mt-2 md:ml-2 md:mt-0 flex-grow">
                      <div>
                        <h2 className="font-semibold text-3xl text-left">{record.name}</h2>
                        <p className="pb-2">Starts at {dateFormat(record.date, "dd/mm/yyyy HH:MM")}</p>
                        <p>{record.shortDescription}</p>
                      </div>
                      <div className="flex flex-row justify-end">
                        <Link to={`/events/event/${record.id}`}>
                          <button
                            className="px-4 py-1 rounded text-lg bg-green-900 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                          >See More!</button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}

EventsOverviewPage.contextType = authContext;

export default EventsOverviewPage;
