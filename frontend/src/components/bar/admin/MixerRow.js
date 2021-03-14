import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class MixerRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      available: this.props.mixer.available,
      disabled: false,
      deleted: false
    };
  }

  toggleAvailable = async () => {
    this.setState({ disabled: true });
    const newAvailable = !this.state.available;

    try {
      await api.post("/bar/mixer/update/available", { id: this.props.mixer.id, available: newAvailable });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return
    }

    this.setState({ disabled: false, available: newAvailable });
  }

  deleteRow = async () => {
    this.setState({ disabled: true });
    const confirmed = window.confirm("Are you sure you want to fully delete this mixer and any corresponding orders?");

    if(!confirmed) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/bar/mixer/${this.props.mixer.id}`);
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return
    }

    this.setState({ deleted: true });
  }

  render () {
    const { mixer } = this.props;

    if(this.state.deleted) {
      return null;
    }

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{mixer.name}</td>
        <td className="p-2 border-r border-gray-400">
          <div>
            <p>Available: { this.state.available ? "Yes" : "No" }</p>
            <button
              className="px-4 py-1 rounded bg-blue-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled}
              onClick={this.toggleAvailable}
            >Toggle</button>
          </div>
        </td>
        <td className="p-2 border-r border-gray-400">£{Number(mixer.price).toFixed(2)}</td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.deleteRow}
            className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={this.state.disabled}
          >Delete</button>
        </td>
      </tr>
    );
  }
}

export default MixerRow;
