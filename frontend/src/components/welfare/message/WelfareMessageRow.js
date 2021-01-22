import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';

class WelfareMessageRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false
    }
  }

  deleteThread = async () => {
    this.setState({ disabled: true });
    const confirmed = window.confirm("Are you sure you want to permanently delete this thread?");

    if(!confirmed) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/welfare/messages/thread/${this.props.thread.id}`);
    } catch (error) {
      alert("Unable to delete the thread");
    }

    this.props.onDelete(this.props.thread.id);
  }

  render () {
    return (
      <tr>
        <td>{this.props.thread.title}</td>
        <td>TODO</td>
        <td>
          <Link to={`/welfare/message/thread/${this.props.thread.id}`}>
            <button
            >View</button>
          </Link>
        </td>
        <td>
          <button
            onClick={this.deleteThread}
            disabled={this.state.disabled}
          >Delete</button>
        </td>
      </tr>
    );
  }
}

export default WelfareMessageRow;
