import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Link } from 'react-router-dom';

class ElectionRow extends React.Component {
  deleteSelf = () => {
    
  }

  render () {
    const { election } = this.props;

    let status = "Unknown";
    let canGenerateResults = false;
    let canDelete = false;

    const now = new Date();

    if(now < new Date(election.manifestoReleaseTime)) {
      status = "Awaiting Manifesto Release";
      canDelete = true;
    } else if (now < new Date(election.votingOpenTime)) {
      status = "Manifestos Released";
      canDelete = true;
    } else if (now < new Date(election.votingCloseTime)) {
      status = "Voting In Progress";
    } else {
      status = "Voting Closed";
      canGenerateResults = true;
    }

    const generateButton = (
      <Link to={`/elections/results/${election.id}`}>
        <button
          className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
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
        <td className="p-2 border-r border-gray-400">{dateFormat(election.manifestoReleaseTime, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">{dateFormat(election.votingOpenTime, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">{dateFormat(election.votingCloseTime, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">{canGenerateResults ? (election.winner === null ? generateButton : election.winner) : "Voting Not Closed"}</td>
        <td className="p-2 border-r border-gray-400">{canGenerateResults ? (election.winner === null ? generateButton :
          <Link to={`/elections/results/${election.id}`}>
            <button
              className="px-4 py-1 rounded bg-blue-700 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >View Results</button>
          </Link>
        ) : "Voting Not Closed"}
        </td>
        <td className="p-2 border-r border-gray-400">
          {canDelete ?
            <button
              onClick={this.deleteSelf}
              className="px-4 py-1 rounded bg-red-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >Delete</button>
          : "Voting Started"}
        </td>
      </tr>
    )
  }
}

export default ElectionRow;
