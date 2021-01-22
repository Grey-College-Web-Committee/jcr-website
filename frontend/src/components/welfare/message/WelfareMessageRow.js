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
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{this.props.thread.title}</td>
        <td className="p-2 border-r border-gray-400">TODO</td>
        <td className="p-2 border-r border-gray-400">
          <Link to={`/welfare/message/thread/${this.props.thread.id}`}>
            <button
              className="px-4 py-1 rounded bg-green-700 text-white w-full md:w-48 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >View</button>
          </Link>
        </td>
        <td className="p-2 border-r border-gray-400">
          <button
            className="px-4 py-1 rounded bg-red-700 text-white w-full md:w-48 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            onClick={this.deleteThread}
            disabled={this.state.disabled}
          >Delete</button>
        </td>
      </tr>
    );
  }
}

export default WelfareMessageRow;
