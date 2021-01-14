import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class CandidateRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false
    };
  }

  removeSelf = async () => {
    this.setState({ disabled: true });

    try {
      await api.delete(`/elections/candidate/${this.props.candidate.id}`);
    } catch (error) {
      console.log(error);
      alert("Unable to delete candidate");
      return;
    }

    this.props.removeCandidate(this.props.candidate.id);
  }

  render () {
    return (
      <tr>
        <td>{this.props.candidate.name}</td>
        <td><a href={`/elections/manifesto/${this.props.candidate.manifestoLink}`}>View Manifesto</a></td>
        <td>
          <button
            onClick={this.removeSelf}
            disabled={this.state.disabled}
          >Remove</button>
        </td>
      </tr>
    );
  }
}

export default CandidateRow;
