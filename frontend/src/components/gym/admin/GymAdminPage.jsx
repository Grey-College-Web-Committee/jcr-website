import React from 'react';
import { Redirect, Prompt } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

class GymAdminPage extends React.Component {
  constructor(props) {
    super(props);

    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      startDate: "",
      endDate: dateFormat(tomorrow, "yyyy-mm-dd"),
      expiredOnly: false,
      disabled: false,
      pageState: 0,
      fileLocation: null
    };

    // Change this to your permission
    this.requiredPermission = "gym.export";
  }

  // Basic function to change the state for any text-based input
  onInputChange = e => {
    this.setState({ [e.target.name]: e.target.value, usernameError: false, passwordError: false });
  }

  processDownload = async e => {
    e.preventDefault();
    this.setState({ disabled: true });

    if(this.state.startDate.length === 0) {
      alert("You must set a start date!");
      this.setState({ disabled: false });
      return;
    }

    if(this.state.endDate.length === 0) {
      alert("You must set an end date!");
      this.setState({ disabled: false });
      return;
    }

    const startDate = new Date(this.state.startDate);
    const endDate = new Date(this.state.endDate);

    if(startDate >= endDate) {
      alert("The end date must be at least one day in the future of the start date!");
      this.setState({ disabled: false });
      return;
    }

    let exportResponse;

    const { expiredOnly } = this.state;

    try {
      exportResponse = await api.post("/gym/export", { startDate, endDate, expiredOnly });
    } catch (error) {
      console.log({ error });
      alert("An error occurred downloading the stash order");
      return;
    }

    const { fileLocation } = exportResponse.data;
    this.setState({ pageState: 1, disabled: false, fileLocation })
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

    switch(this.state.pageState) {
      case 0:
        return (
          <div className="flex flex-col justify-start">
            <Prompt
              when={this.state.disabled}
              message="Your download is still processing!"
            />
            <div className="container mx-auto text-center p-4">
              <h1 className="font-semibold text-5xl pb-4">Export Gym Memberships</h1>
              <div className="flex flex-col">
                <p className="text-lg font-semibold">This process will take a little while to complete. Please do not leave the page once you set it going!</p>
                <div>
                  <form onSubmit={this.processDownload}>
                    <fieldset>
                      <div className="mx-auto w-max pb-4 border-b-2">
                        <label htmlFor="startDate" className="flex flex-row justify-start pb-2 text-lg font-semibold">Membership Purchase Date (Start of Range, inclusive)</label>
                        <input
                          type="date"
                          name="startDate"
                          value={this.state.startDate}
                          onChange={this.onInputChange}
                          className={`shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400`}
                          disabled={this.state.disabled}
                        />
                      </div>
                      <div className="mx-auto w-max pb-4 border-b-2">
                        <label htmlFor="endDate" className="flex flex-row justify-start pb-2 text-lg font-semibold">Membership Purchase Date (End of Range, inclusive)</label>
                        <input
                          type="date"
                          name="endDate"
                          value={this.state.endDate}
                          onChange={this.onInputChange}
                          className={`shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400`}
                          disabled={this.state.disabled}
                        />
                      </div>
                      <div className="mx-auto w-max pb-4">
                        <label htmlFor="expiredOnly" className="flex flex-row justify-start pb-2 text-lg font-semibold">Expired Only?</label>
                        <input
                          type="checkbox"
                          name="expiredOnly"
                          checked={this.state.expiredOnly}
                          onChange={this.onInputChange}
                          className={`shadow w-8 h-8 border rounded focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400`}
                          disabled={this.state.disabled}
                        />
                      </div>
                      <div className="mx-auto w-64 pb-4 pt-4 border-t-2">
                        <input
                          type="submit"
                          value="Process"
                          className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                          disabled={this.state.disabled}
                        />
                      </div>
                    </fieldset>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col justify-start">
            <div className="container mx-auto text-center p-4">
              <h1 className="font-semibold text-5xl pb-4">Export Stash Orders</h1>
              <div className="flex flex-col justify-center">
                <p>Your download is ready!</p>
                <a href={`/api/gym/download/${this.state.expiredOnly ? "expired" : "all"}/${this.state.fileLocation}`} download target="_self">
                  <button
                    className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 mt-4"
                  >
                    Gym Membership Download ({this.state.expiredOnly ? "Expired Only" : "All"})
                  </button>
                </a>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}

export default GymAdminPage;
