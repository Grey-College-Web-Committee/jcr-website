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
      result = await api.post("/elections/create", { name, manifestoReleaseTime, votingOpenTime, votingCloseTime });
    } catch (error) {
      alert("Unable to create the election.");
      return;
    }

    this.props.onElectionCreated(result.data);
  }

  getInputDiv = () => {
    return (
      <div className="w-full">
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
        <table>
          <tbody>
            <tr><td>Election Name</td><td>{this.props.electionDetails.name}</td></tr>
            <tr><td>Manifesto Releases</td><td>{dateFormat(this.props.electionDetails.manifestoReleaseTime, "dd/mm/yyyy HH:MM:ss")}</td></tr>
            <tr><td>Voting Opens</td><td>{dateFormat(this.props.electionDetails.votingOpenTime, "dd/mm/yyyy HH:MM:ss")}</td></tr>
            <tr><td>Voting Closes</td><td>{dateFormat(this.props.electionDetails.votingCloseTime, "dd/mm/yyyy HH:MM:ss")}</td></tr>
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

export default ElectionDetails;
