import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../../utils/axiosConfig';

class CommitteeRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      deleted: false,
      edited: false,
      name: this.props.committee.name,
      description: this.props.committee.description
    }
  }

  saveRow = async () => {
    this.setState({ disabled: true });

    const { name, description } = this.state;

    try {
      await api.post("/jcr/committee/update", { id: this.props.committee.id, name, description });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ disabled: false, edited: false });
  }

  deleteRow = async () => {
    this.setState({ disabled: true });
    const confirmed = window.confirm("Are you sure you want to fully delete this committee?");

    if(!confirmed) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/jcr/committee/${this.props.committee.id}`);
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return
    }

    this.setState({ deleted: true });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), edited: true })
  }

  render () {
    if(this.state.deleted) {
      return null;
    }

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">
          <input
            type="text"
            name="name"
            value={this.state.name}
            className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            onChange={this.onInputChange}
            autoComplete=""
            maxLength={255}
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <textarea
            name="description"
            value={this.state.description}
            onChange={this.onInputChange}
            className="border w-full rounded my-2 h-auto py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            disabled={this.state.disabled}
            autoComplete=""
            maxLength={1500}
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.saveRow}
            className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={this.state.disabled || !this.state.edited}
          >Save</button>
        </td>
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

export default CommitteeRow;
