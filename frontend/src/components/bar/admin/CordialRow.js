import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class CordialRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      available: this.props.cordial.available,
      name: this.props.cordial.name,
      price: this.props.cordial.price,
      disabled: false,
      deleted: false,
      edited: false
    };
  }

  deleteRow = async () => {
    this.setState({ disabled: true });
    const confirmed = window.confirm("Are you sure you want to fully delete this cordial?");

    if(!confirmed) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/bar/cordial/${this.props.cordial.id}`);
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ deleted: true });
  }

  saveRow = async () => {
    this.setState({ disabled: true });

    const { name, available, price } = this.state;

    try {
      await api.post("/bar/cordial/update", {
        id: this.props.cordial.id,
        name,
        available,
        price
      });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ disabled: false, edited: false });
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
          <input
            type="checkbox"
            name="available"
            checked={this.state.available}
            onChange={this.onInputChange}
            className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <input
            type="number"
            min={0.01}
            step={0.01}
            name="price"
            value={this.state.price}
            className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            onChange={this.onInputChange}
            autoComplete=""
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

CordialRow.propTypes = {
  cordial: PropTypes.object.isRequired
}

export default CordialRow;
