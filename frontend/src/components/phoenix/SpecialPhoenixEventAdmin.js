import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import LoadingHolder from '../common/LoadingHolder';

class SpecialPhoenixEventAdmin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      disabled: false,
      downloadPrepared: false,
      downloadLoc: null,
      successes: 0,
      stripeFailures: [],
      databaseFailures: [],
      captured: false
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

    this.setState({ loaded: true });
  }

  prepareDownload = async () => {
    this.setState({ disabled: true });

    let result;

    try {
      result = await api.post("/phoenix/export");
    } catch (error) {
      alert("Unable to prepare the exported details for download");
      this.setState({ disabled: false });
      return;
    }

    const { fileLocation } = result.data;

    this.setState({ disabled: false, downloadLoc: fileLocation, downloadPrepared: true });
  }

  capturePayments = async () => {
    this.setState({ disabled: true, captured: false });

    let result;

    try {
      result = await api.get("/phoenix/capture");
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    const { stripeFailures, databaseFailures, successes } = result.data;

    this.setState({ disabled: false, stripeFailures, databaseFailures, successes, captured: true });
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

    const { downloadPrepared } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Phoenix Festival Admin</h1>
          <div className="flex flex-col items-start mb-2 border-gray-400 border-2 my-2 p-1">
            <h2 className="text-2xl font-semibold">Export Tickets</h2>
            <p className="mb-1">Click the button below once to prepare the download, once it is ready the button will turn green. Click it again to download the file.</p>
            {
              downloadPrepared ? (
                <a href={`/api/phoenix/download/${this.state.downloadLoc}`} download target="_self">
                  <button
                    className={`px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                    disabled={this.state.disabled}
                  >Download Guests</button>
                </a>
              ) : (
                <button
                  onClick={this.prepareDownload}
                  className={`px-4 py-1 rounded bg-gray-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                  disabled={this.state.disabled}
                >Prepare Download</button>
              )
            }
          </div>
          <div className="flex flex-col items-start mb-2 border-gray-400 border-2 my-2 p-1">
            <h2 className="text-2xl font-semibold">Capture Payments</h2>
            <p className="mb-1">Use this periodically to capture any outstanding payments (doesn't recapture those that have already been captured)</p>
            <p className="mb-1">This may take a short while to complete.</p>
            <button
              className={`px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
              onClick={this.capturePayments}
              disabled={this.state.disabled}
            >Capture Payments</button>
            {
              this.state.captured ? (
                <div className="text-left p-2">
                  <h3 className="text-lg font-semibold">Result</h3>
                  <p className="py-1">Successes: {this.state.successes}</p>
                  <p className="py-1">Stripe Failures: {this.state.stripeFailures.length}</p>
                  {
                    this.state.stripeFailures.length === 0 ? null : (
                      <pre>
                        {JSON.stringify(this.state.stripeFailures)}
                      </pre>
                    )
                  }
                  <p className="py-1">Database Failures: {this.state.databaseFailures.length}</p>
                  {
                    this.state.databaseFailures.length === 0 ? null : (
                      <pre>
                        {JSON.stringify(this.state.databaseFailures)}
                      </pre>
                    )
                  }
                </div>
              ) : null
            }
          </div>
        </div>
      </div>
    );
  }
}

export default SpecialPhoenixEventAdmin;
