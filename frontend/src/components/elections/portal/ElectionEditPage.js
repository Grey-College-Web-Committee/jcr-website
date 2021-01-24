import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

class ElectionEditPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      election: {},
      id: this.props.match.params.id,
      manifestoReleaseTime: undefined,
      votingOpenTime: undefined,
      votingCloseTime: undefined,
      name: "",
      reason: "",
      disabled: false,
      canSave: false,
      deleted: false
    };

    // Change this to your permission
    this.requiredPermission = "elections.manage";
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

    let result;

    try {
      result = await api.get(`/elections/election/admin/${this.state.id}`);
    } catch (error) {
      alert("Unable to load the election data");
      this.setState({ status: error.response.status });
      return;
    }

    // Load any required data for the page here

    const { id, name, manifestoReleaseTime, votingOpenTime, votingCloseTime } = result.data.election;
    let editLog = result.data.editLog;

    editLog = editLog.sort((a, b) => {
      return -(a.id < b.id ? -1 : (a.id > b.id ? 1 : 0))
    })

    this.setState({ loaded: true, status: 200, election: result.data.election, name, manifestoReleaseTime, votingOpenTime, votingCloseTime, id, editLog });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: e.target.value, canSave: e.target.name === "reason" ? this.state.canSave : true });
  }

  saveChanges = async (e) => {
    e.preventDefault();
    this.setState({ disabled: true });

    const { id, reason, name, manifestoReleaseTime, votingOpenTime, votingCloseTime } = this.state;

    if(reason.length === 0) {
      alert("You must set a reason for your change!");
      this.setState({ disabled: false });
      return;
    }

    if(name.length === 0) {
      alert("You must set a name for the election!");
      this.setState({ disabled: false });
      return;
    }

    if(manifestoReleaseTime === undefined) {
      alert("You must set a release time for the manifestos!");
      this.setState({ disabled: false });
      return;
    }

    if(votingOpenTime === undefined) {
      alert("You must set an opening time for the voting!");
      this.setState({ disabled: false });
      return;
    }

    if(votingOpenTime < manifestoReleaseTime) {
      alert("The voting must open after the manifestos release!");
      this.setState({ disabled: false });
      return;
    }

    if(votingCloseTime === undefined) {
      alert("You must set a closing time for the voting!");
      this.setState({ disabled: false });
      return;
    }

    if(votingCloseTime < votingOpenTime) {
      alert("The voting must close after the vote opens!");
      this.setState({ disabled: false });
      return;
    }

    let errored = false;

    try {
      await api.post("/elections/edit/", { id, reason, name, manifestoReleaseTime, votingOpenTime, votingCloseTime });
    } catch (error) {
      errored = true;
      alert(error.response.data.error);
    }

    if(!errored) {
      alert("Changes made successfully");
    }

    this.setState({ disabled: false, canSave: false, reason: "" });
  }

  deleteSelf = async (e) => {
    this.setState({ disabled: true });
    const confirmedDeletion = window.confirm("Are you sure you want to delete this election and all of its votes? This will be recorded.");

    if(!confirmedDeletion) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/elections/${this.state.id}`);
    } catch (error) {
      alert("Unable to delete the election");
      return;
    }

    alert("Election deleted");
    this.setState({ deleted: true });
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

    if(this.state.deleted) {
      return (
        <Redirect to="/elections/admin" />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Editing: {this.state.name}</h1>
          <div className="flex flex-row">
            <div className="w-2/3 p-2">
              <p>Important: You must <a className="underline font-semibold" href="https://support.google.com/chrome/answer/95346?co=GENIE.Platform%3DDesktop&hl=en" rel="noopener noreferrer" target="_blank">use Google Chrome</a> or <a className="underline font-semibold" href="https://www.microsoft.com/en-us/edge" rel="noopener noreferrer" target="_blank">Microsoft Edge</a> otherwise the date and time selector will not show up. This is unfortunately caused by other browsers not supporting the feature (support is coming in the next major update to Safari on macOS).</p>
              <fieldset>
                <div className="mx-auto">
                  <div className="mx-auto w-full pb-4 border-b-2">
                    <label htmlFor="name" className="flex flex-row justify-start pb-2 text-lg font-semibold">Election Name</label>
                    <input
                      type="text"
                      name="name"
                      value={this.state.name}
                      onChange={this.onInputChange}
                      className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                      placeholder="Election name..."
                      disabled={this.state.disabled}
                    />
                  </div>
                  <div className="mx-auto w-full pb-4 border-b-2 mt-2">
                    <label htmlFor="manifestoReleaseTime" className="flex flex-row justify-start pb-2 text-lg font-semibold">Manifesto Release</label>
                    <input
                      type="datetime-local"
                      name="manifestoReleaseTime"
                      value={`${dateFormat(this.state.manifestoReleaseTime, "yyyy-mm-dd")}T${dateFormat(this.state.manifestoReleaseTime, "HH:MM")}`}
                      onChange={this.onInputChange}
                      className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                      disabled={this.state.disabled}
                    />
                  </div>
                  <div className="mx-auto w-full pb-4 border-b-2 mt-2">
                    <label htmlFor="votingOpenTime" className="flex flex-row justify-start pb-2 text-lg font-semibold">Voting Opens</label>
                    <input
                      type="datetime-local"
                      name="votingOpenTime"
                      value={`${dateFormat(this.state.votingOpenTime, "yyyy-mm-dd")}T${dateFormat(this.state.votingOpenTime, "HH:MM")}`}
                      onChange={this.onInputChange}
                      className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                      disabled={this.state.disabled}
                    />
                  </div>
                  <div className="mx-auto w-full pb-4 border-b-2 mt-2">
                    <label htmlFor="voting" className="flex flex-row justify-start pb-2 text-lg font-semibold">Voting Closes</label>
                    <input
                      type="datetime-local"
                      name="votingCloseTime"
                      value={`${dateFormat(this.state.votingCloseTime, "yyyy-mm-dd")}T${dateFormat(this.state.votingCloseTime, "HH:MM")}`}
                      onChange={this.onInputChange}
                      className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                      disabled={this.state.disabled}
                    />
                  </div>
                  <div className="mx-auto w-full pb-4 border-b-2 mt-2">
                    <label htmlFor="voting" className="flex flex-row justify-start pb-2 text-lg font-semibold">*Reason</label>
                    <input
                      type="text"
                      name="reason"
                      value={this.state.reason}
                      onChange={this.onInputChange}
                      className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                      disabled={this.state.disabled}
                    />
                  </div>
                  <div className="mx-auto w-full pb-4 border-b-2 mt-2">
                    <button
                      className="px-4 py-1 rounded bg-green-700 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      disabled={this.state.disabled || !this.state.canSave || this.state.reason.length === 0}
                      onClick={this.saveChanges}
                    >Save Changes</button>
                  </div>
                  <div className="text-left w-full pb-4 border-b-2 mt-2">
                    <button
                      className="px-4 py-1 rounded bg-red-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      disabled={this.state.disabled}
                      onClick={this.deleteSelf}
                    >Delete Election</button>
                  </div>
                </div>
              </fieldset>
            </div>
            <div className="w-1/3 text-left p-2">
              <h2 className="font-semibold text-2xl pb-4">Edit Log</h2>
              <div className="flex flex-col text-sm">
              {
                this.state.editLog.map((item, i) => (
                  <div key={i} className="border my-2 px-2">
                    <p>Reason: {item.reason}</p>
                    <p>Changes:</p>
                    <ul className="list-inside list-disc">
                      {item.action.split(";").map((action, j) => (
                        <li key={i} className="">
                          {action}
                        </li>
                      ))}
                    </ul>
                    <p>Edited By: {item.User.username} ({item.User.firstNames} {item.User.surname})</p>
                    <p>Edited At: {dateFormat(item.createdAt, "dd/mm/yyyy HH:MM:ss")}</p>
                  </div>
                ))
              }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ElectionEditPage;
