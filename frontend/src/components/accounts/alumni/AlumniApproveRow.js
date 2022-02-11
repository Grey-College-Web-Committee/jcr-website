import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';
import dateFormat from 'dateformat';

class AlumniApproveRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      result: null
    };
  }

  approve = async () => {
    this.setState({ disabled: true });

    try {
      await api.post("/alumni/action", { id: this.props.record.id, approved: true });
    } catch (error) {
      alert("An error occurred approving the application");
      return;
    }

    this.setState({ result: "Approved" });
  }

  deny = async () => {
    this.setState({ disabled: true });
    const certain = window.confirm("Are you sure you want to deny this application?");

    if(!certain) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.post("/alumni/action", { id: this.props.record.id, approved: false });
    } catch (error) {
      alert("An error occurred denying the application");
      return;
    }

    this.setState({ result: "Denied" });
  }

  render () {
    const { id, username, email, updatedAt } = this.props.record;

    return (
      <tr className={`text-center border-b border-gray-400`}>
        <td className="p-2 border-r border-gray-400">{id}</td>
        <td className="p-2 border-r border-gray-400">{username}</td>
        <td className="p-2 border-r border-gray-400">{email}</td>
        <td className="p-2 border-r border-gray-400">{dateFormat(updatedAt, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">
          {
            this.state.result ? (
              <span className="font-semibold">{this.state.result}</span>
            ) : (
              <button
                className="px-4 py-1 rounded bg-green-700 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                onClick={this.approve}
                disabled={this.state.disabled}
              >Approve</button>
            )
          }
        </td>
        <td className="p-2 border-r border-gray-400">
          {
            this.state.result ? (
              <span className="font-semibold">{this.state.result}</span>
            ) : (
              <button
                className="px-4 py-1 rounded bg-red-700 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                onClick={this.deny}
                disabled={this.state.disabled}
              >Deny</button>
            )
          }
        </td>
      </tr>
    );
  }
}

export default AlumniApproveRow;
