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
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    this.setState({ loaded: true, status: 200, events: content.data.records, consented: content.data.consented });
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
        <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
          <h1 className="font-semibold text-5xl pb-4">Events</h1>
          {
            this.state.consented ? null : (
              <div className="border-red-900 border-2 p-2 my-2">
                <p className="text-left text-xl">Before you can book on to events or be booked on in a group by another member you must consent to the terms and conditions for events. We cannot allow you to book on to events until you have consented.</p>
                <Link
                  to="/events/terms"
                >
                  <button
                    className="px-4 py-1 mt-2 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  >View Terms and Conditions</button>
                </Link>
              </div>
            )
          }
          {this.state.consented ? (
            <p className="text-left pb-2">The JCR organises events throughout the year for the members of the JCR. Most of these are led by the Events Manager and the Events Committee. They offer many events throughout the year such as a range of different formals, the Winter Ball, Grey Day, Phoenix Ball, and many others. There are also a few other big events throughout the year such as the The President's Guest Night, the Sportsperson Formal, and the Grey College Charity Fashion Show.</p>
          ) : (
            <p className="text-left mt-4 pb-2">The JCR organises events throughout the year for the members of the JCR. Most of these are led by the Events Manager and the Events Committee. They offer many events throughout the year such as a range of different formals, the Winter Ball, Grey Day, and Phoenix Ball. There are also other events throughout the year such as the The President's Guest Night, the Sportsperson Formal, and the Grey College Charity Fashion Show.</p>
          )}
          <div className="flex flex-col">
            {
              this.state.events.length === 0 ? (<p>There are no events yet! Check back soon!</p>) : null
            }
            {
              this.state.events.map((record, i) => (
                <div key={i} className="border-2 border-grey-300 p-2 text-left mt-4">
                  <div className="flex flex-col md:flex-row">
                    {
                      record.EventImages.length === 0 ? null : (
                        <div className="mx-auto flex flex-row justify-center h-48 w-48 flex-grow-0 flex-shrink-0 self-center">
                          <img
                            src={`/uploads/images/events/${record.EventImages[0].image}`}
                            alt={record.EventImages[0].caption}
                            className="h-full w-auto"
                          />
                        </div>
                      )
                    }
                    <div className="flex flex-col justify-between mt-2 md:ml-2 md:mt-0 flex-grow">
                      <div>
                        <h2 className="font-semibold text-3xl text-center md:text-left">{record.name}</h2>
                        <p className="pb-2 text-lg text-center md:text-left">{dateFormat(record.date, "dd/mm/yyyy HH:MM")}</p>
                        <p className="pb-4 break-words">{record.shortDescription}</p>
                      </div>
                      <div className="flex flex-row justify-start">
                        {
                          this.state.consented ? (
                            <Link to={`/events/event/${record.id}`} className="w-full md:w-auto">
                              <button
                                className="px-4 py-1 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                              >More Details</button>
                            </Link>
                          ) : (
                            <div className="w-full md:w-auto">
                              <Link to="/events/terms" className="w-full md:w-auto">
                                <button
                                  className="px-4 py-1 rounded text-lg bg-red-900 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                                >View Terms and Conditions</button>
                            </Link>
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
          {this.state.consented ? (
            <div className="py-2 mt-4">
              <Link to="/events/terms">
                <button
                  className="px-4 py-1 rounded text-lg bg-red-900 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Review Terms and Conditions</button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

EventsOverviewPage.contextType = authContext;

export default EventsOverviewPage;
