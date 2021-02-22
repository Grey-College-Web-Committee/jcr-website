import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import dateFormat from 'dateformat';

class EventsExportOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
    };

    // Change this to your permission
    this.requiredPermission = "events.export";
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

    const { events } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Export Events</h1>
          <p className="pb-2">Select an event from the table below to export it.</p>
          <table className="mx-auto border-2 text-left border-red-900 w-full">
            <thead className="bg-red-900 text-white">
              <tr>
                <td className="p-2 font-semibold">Name</td>
                <td className="p-2 font-semibold">Description</td>
                <td className="p-2 font-semibold">Booking Closes</td>
                <td className="p-2 font-semibold">Export</td>
              </tr>
            </thead>
            <tbody>
              {
                events.map((record, i) => (
                  <tr className="text-center border-b border-gray-400" key={i}>
                    <td className="p-2 border-r border-gray-400">{record.name}</td>
                    <td className="p-2 border-r border-gray-400">{record.shortDescription}</td>
                    <td className="p-2 border-r border-gray-400">{dateFormat(record.bookingCloseTime, "dd/mm/yyyy HH:MM")}</td>
                    <td className="p-2 border-r border-gray-400">
                      <Link to={`/events/admin/export/${record.id}`}>
                        <button
                          className="px-4 py-1 rounded bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        >Export</button>
                      </Link>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default EventsExportOverview;
