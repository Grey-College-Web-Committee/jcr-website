import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';
import dateFormat from 'dateformat';

class ElectionDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      manifestoReleaseTime: undefined,
      votingOpenTime: undefined,
      votingCloseTime: undefined
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  }

  createElection = async e => {
    e.preventDefault();
    this.setState({ disabled: true });

    const { name, manifestoReleaseTime, votingOpenTime, votingCloseTime } = this.state;

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

    let result;

    try {
      result = await api.post("/elections/create", { name, manifestoReleaseTime: new Date(manifestoReleaseTime), votingOpenTime: new Date(votingOpenTime), votingCloseTime: new Date(votingCloseTime) });
    } catch (error) {
      alert("Unable to create the election.");
      return;
    }

    this.props.onElectionCreated(result.data);
  }

  getInputDiv = () => {
    return (
      <div className="w-full">
        <p>Important: You must <a className="underline font-semibold" href="https://support.google.com/chrome/answer/95346?co=GENIE.Platform%3DDesktop&hl=en" rel="noopener noreferrer" target="_blank">use Google Chrome</a> or <a className="underline font-semibold" href="https://www.microsoft.com/en-us/edge" rel="noopener noreferrer" target="_blank">Microsoft Edge</a> otherwise the date and time selector will not show up. This is unfortunately caused by other browsers not supporting the feature (support is coming in the next major update to Safari on macOS).</p>
        <form onSubmit={this.createElection}>
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
                  disabled={this.state.disabled || this.props.confirmed}
                />
              </div>
              <div className="mx-auto w-full pb-4 border-b-2 mt-2">
                <label htmlFor="manifestoReleaseTime" className="flex flex-row justify-start pb-2 text-lg font-semibold">Manifesto Release</label>
                <input
                  type="datetime-local"
                  name="manifestoReleaseTime"
                  value={this.state.manifestoReleaseTime}
                  onChange={this.onInputChange}
                  className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled || this.props.confirmed}
                />
              </div>
              <div className="mx-auto w-full pb-4 border-b-2 mt-2">
                <label htmlFor="votingOpenTime" className="flex flex-row justify-start pb-2 text-lg font-semibold">Voting Opens</label>
                <input
                  type="datetime-local"
                  name="votingOpenTime"
                  value={this.state.votingOpenTime}
                  onChange={this.onInputChange}
                  className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled || this.props.confirmed}
                />
              </div>
              <div className="mx-auto w-full pb-4 border-b-2 mt-2">
                <label htmlFor="voting" className="flex flex-row justify-start pb-2 text-lg font-semibold">Voting Closes</label>
                <input
                  type="datetime-local"
                  name="votingCloseTime"
                  value={this.state.votingCloseTime}
                  onChange={this.onInputChange}
                  className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled || this.props.confirmed}
                />
              </div>
              <div className="mx-auto w-full my-2 border-b-2">
                <input
                  type="submit"
                  className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled || this.props.confirmed}
                  value="Create Election"
                />
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    );
  }

  getConfirmedDiv = () => {
    return (
      <div>
        <table className="mx-auto border-2 text-left border-red-900 w-full">
          <tbody>
            <tr className="text-center border-b border-gray-400">
              <td className="p-2 border-r border-gray-400 font-semibold">Election Name</td>
              <td className="p-2 border-r border-gray-400">{this.props.electionDetails.name}</td></tr>
            <tr className="text-center border-b border-gray-400">
              <td className="p-2 border-r border-gray-400 font-semibold">Manifesto Releases</td>
              <td className="p-2 border-r border-gray-400">{dateFormat(this.props.electionDetails.manifestoReleaseTime, "dd/mm/yyyy HH:MM:ss")}</td>
            </tr>
            <tr className="text-center border-b border-gray-400">
              <td className="p-2 border-r border-gray-400 font-semibold">Voting Opens</td>
              <td className="p-2 border-r border-gray-400">{dateFormat(this.props.electionDetails.votingOpenTime, "dd/mm/yyyy HH:MM:ss")}</td>
            </tr>
            <tr className="text-center border-b border-gray-400">
              <td className="p-2 border-r border-gray-400 font-semibold">Voting Closes</td>
              <td className="p-2 border-r border-gray-400">{dateFormat(this.props.electionDetails.votingCloseTime, "dd/mm/yyyy HH:MM:ss")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  render () {
    return (
      <React.Fragment>
        { this.props.confirmed ? this.getConfirmedDiv() : this.getInputDiv() }
      </React.Fragment>
    )
  }
}

ElectionDetails.propTypes = {
  confirmed: PropTypes.bool.isRequired,
  onElectionCreated: PropTypes.func.isRequired,
  electionDetails: PropTypes.object.isRequired
}

export default ElectionDetails;
