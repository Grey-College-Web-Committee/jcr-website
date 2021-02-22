import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';

class EventsExportPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      eventId: props.match.params.eventId,
      loaded: false,
      status: 0,
      error: "",
      disabled: false,
      pageState: 0,
      fileLocation: null
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
      content = await api.get(`/events/single/${this.state.eventId}`);
    } catch (error) {
      this.setState({ loaded: true, status: error.response.status, error: error.response.data.error });
      return;
    }

    this.setState({ loaded: true, event: content.data.record });
  }

  generateExport = async (e) => {
    e.preventDefault();
    this.setState({ disabled: true });

    let exportResponse;

    try {
      exportResponse = await api.get(`/events/export/${this.state.eventId}`);
    } catch (error) {
      alert("An error occurred preparing the export");
      return;
    }

    const { fileLocation } = exportResponse.data;
    this.setState({ pageState: 1, disabled: false, fileLocation });
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

    const { event, pageState } = this.state;

    if(pageState === 0) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Export {event.name}</h1>
            <p>Generates a CSV consisting of all of the paid tickets</p>
            <div className="mx-auto w-64 py-4">
              <button
                className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.state.disabled}
                onClick={this.generateExport}
              >Generate CSV</button>
            </div>
          </div>
        </div>
      );
    } else if (pageState === 1) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Export {event.name}</h1>
            <p>Download Ready</p>
            <div className="mx-auto w-64 py-4">
              <a href={`/api/events/download/${this.state.fileLocation}`} download target="_self">
                <button
                  className="px-4 py-1 rounded bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >
                  Download File
                </button>
              </a>
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default EventsExportPage;
