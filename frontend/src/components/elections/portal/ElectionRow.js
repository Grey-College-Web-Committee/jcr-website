import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import api from '../../../utils/axiosConfig';
import { Link } from 'react-router-dom';

class ElectionRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      deleted: false,
      manifestoReleaseTime: this.props.election.manifestoReleaseTime,
      votingOpenTime: this.props.election.votingOpenTime,
      votingCloseTime: this.props.election.votingCloseTime,
      name: this.props.election.name,
      election: this.props.election,
      published: this.props.election.published
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: e.target.value, canSave: true });
  }

  canEdit = () => {
    return this.state.election.winner === null && !this.state.disabled;
  }

  publishResults = async (e) => {
    e.preventDefault();
    this.setState({ disabled: true });

    try {
      await api.post("/elections/election/publish", { id: this.state.election.id });
    } catch (error) {
      alert("Unable to publish the results");
      return;
    }

    this.setState({ disabled: false, published: true });
  }

  render () {
    if(this.state.deleted) {
      return null;
    }

    const { election } = this.props;

    let status = "Unknown";
    let canGenerateResults = false;

    const now = new Date();

    if(now < new Date(this.state.manifestoReleaseTime)) {
      status = "Awaiting Manifesto Release";
    } else if (now < new Date(this.state.votingOpenTime)) {
      status = "Manifestos Released";
    } else if (now < new Date(this.state.votingCloseTime)) {
      status = "Voting In Progress";
    } else {
      status = "Voting Closed";
      canGenerateResults = true;
    }

    const generateButton = (
      <Link to={`/elections/results/${election.id}`}>
        <button
          className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          disabled={this.state.disabled}
        >Generate Results</button>
      </Link>
    );

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{election.name}</td>
        <td className="p-2 border-r border-gray-400">
          <ul>
            {
              election.ElectionCandidates.sort((a, b) => {
                return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)
              }).map((candidate, i) => (
                <li key={i} className="underline font-semibold">
                  <Link to={`/elections/manifesto/${candidate.manifestoLink}`}>{candidate.name}</Link>
                </li>
              ))
            }
          </ul>
        </td>
        <td className="p-2 border-r border-gray-400">{status}</td>
        <td className="p-2 border-r border-gray-400">{dateFormat(this.state.manifestoReleaseTime, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">{dateFormat(this.state.votingOpenTime, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">{dateFormat(this.state.votingCloseTime, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">{canGenerateResults ? (election.winner === null ? generateButton : election.winner) : "Voting Not Closed"}</td>
        <td className="p-2 border-r border-gray-400">{canGenerateResults ? (election.winner === null ? generateButton :
          <Link to={`/elections/results/${election.id}`}>
            <button
              className="px-4 py-1 rounded bg-blue-700 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled}
            >View Results</button>
          </Link>
        ) : "Voting Not Closed"}
        </td>
        <td className="p-2 border-r border-gray-400">
          {election.winner === null ? <p>Generate results first</p> : (this.state.published ? (<p>Published</p>) : (
            <button
              className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled}
              onClick={this.publishResults}
            >Publish</button>
          ))}
        </td>
        <td className="p-2 border-r border-gray-400">
          {
            this.canEdit() ?
            (
              <Link to={`/elections/edit/${election.id}`}>
                <button
                  className="px-4 py-1 rounded bg-blue-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled}
                >Edit</button>
              </Link>
            ) : (<p>N/A</p>)
          }
        </td>
      </tr>
    )
  }
}

ElectionRow.propTypes = {
  election: PropTypes.object.isRequired
}

export default ElectionRow;
