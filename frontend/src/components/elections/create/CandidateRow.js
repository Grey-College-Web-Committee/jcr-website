import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class CandidateRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      candidate: this.props.candidate,
      deleted: false,
    };
  }

  removeSelf = async () => {
    this.setState({ disabled: true });

    try {
      await api.delete(`/elections/candidate/${this.state.candidate.id}`);
    } catch (error) {
      alert("Unable to delete candidate");
      return;
    }

    this.setState({ deleted: true });
  }

  render () {
    if(this.state.deleted) {
      return null;
    }

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{this.state.candidate.name}</td>
        <td className="p-2 border-r border-gray-400 underline"><a target="_blank" href={`/elections/manifesto/${this.state.candidate.manifestoLink}`}>View Manifesto</a></td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.removeSelf}
            className="px-4 py-1 rounded bg-red-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={this.state.disabled}
          >Remove</button>
        </td>
      </tr>
    );
  }
}

export default CandidateRow;
