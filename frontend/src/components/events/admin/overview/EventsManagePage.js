import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import dateFormat from 'dateformat';

class EventsManagePage extends React.Component {
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
      content = await api.get("/events");
    } catch (error) {
      this.setState({ loaded: true, status: error.response.status, error: error.response.data.error });
      return;
    }

    this.setState({ loaded: true, events: content.data.records });
  }

  getEventsDiv = () => {
    return (
      <div className="w-full">
        <h2 className="text-left text-3xl font-semibold">All Events</h2>
        <table className="mx-auto border-2 text-left border-red-900 w-full">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Description</th>
              <th className="p-2 font-semibold">Event Date</th>
              <th className="p-2 font-semibold">Booking Closes</th>
              <th className="p-2 font-semibold">Export</th>
              <th className="p-2 font-semibold">Edit</th>
            </tr>
          </thead>
          <tbody>
            {this.state.events.map((record, i) => (
              <tr className="text-center border-b border-gray-400" key={i}>
                <td className="p-2 border-r border-gray-400">{record.name}</td>
                <td className="p-2 border-r border-gray-400">{record.shortDescription}</td>
                <td className="p-2 border-r border-gray-400">{dateFormat(record.date, "dd/mm/yyyy HH:MM")}</td>
                <td className="p-2 border-r border-gray-400">{dateFormat(record.bookingCloseTime, "dd/mm/yyyy HH:MM")}</td>
                <td className="p-2 border-r border-gray-400">
                  <Link to={`/events/admin/export/${record.id}`}>
                    <button
                      className="px-4 py-1 rounded bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    >Export</button>
                  </Link>
                </td>
                <td className="p-2 border-r border-gray-400">TODO</td>
              </tr>
            ))}
          </tbody>
        </table>
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Manage Events</h1>
          <div className="flex flex-col items-start mb-2">
            <h2 className="text-left text-3xl font-semibold">Create Event</h2>
            <Link to="/events/admin/create">
              <button
                className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 my-2"
              >Create New Event</button>
            </Link>
            { this.getEventsDiv() }
          </div>
        </div>
      </div>
    );
  }
}

export default EventsManagePage;
