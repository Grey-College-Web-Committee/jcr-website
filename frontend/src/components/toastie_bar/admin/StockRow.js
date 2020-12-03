import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import api from '../../../utils/axiosConfig.js';

class StockRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.item.id,
      name: this.props.item.name,
      type: this.props.item.type,
      price: this.props.item.price,
      available: this.props.item.available,
      updatedAt: this.props.item.updatedAt,
      disabled: false,
      allowSave: false
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), allowSave: true })
  }

  saveChanges = async (e) => {
    // Prevent resubmission
    e.preventDefault();
    this.setState({ disabled: true });

    // Validate data
    const { name, type, price, available } = this.state;

    if(name === null || name.length === 0) {
      alert("You must set a name for the item");
      this.setState({ disabled: false });
      return;
    }

    if(type === null || type.length === 0) {
      alert("You must set a type for the item");
      this.setState({ disabled: false });
      return;
    }

    if(price === null || price < 0) {
      alert("You must set a non-negative price for the item");
      this.setState({ disabled: false });
      return;
    }

    if(available === null) {
      alert("You must set an availability for the item");
      this.setState({ disabled: false });
      return;
    }

    // Update the item on the server

    try {
      await api.put(`/toastie_bar/stock/${this.state.id}`, { name, type, price, available });
    } catch (error) {
      alert("An error occurred updating this value");
      return;
    }

    // Update the row
    await this.updateSelf();
  }

  updateSelf = async () => {
    this.setState({ disabled: true });
    // Just a standard GET for the data
    let query;

    try {
      query = await api.get(`/toastie_bar/stock/${this.state.id}`);
    } catch (error) {
      this.setState({ disabled: false });
      return;
    }

    const { name, type, price, available, updatedAt } = query.data.stockItem;
    this.setState({ disabled: false, name, type, price, available, updatedAt, allowSave: false });
  }

  render () {
    const colour = this.props.rowId % 2 === 0 ? "bg-red-100" : "bg-white";

    return (
      <tr className={`${colour}`}>
        <td className="w-64 p-2 border-r border-gray-400">
          <input
            type="text"
            value={this.state.name}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            name="name"
            className="w-full border border-gray-400 px-2"
          />
        </td>
        <td className="hidden sm:table-cell w-40 p-2 border-r border-gray-400">
          <select
            name="type"
            onChange={this.onInputChange}
            value={this.state.type}
            disabled={this.state.disabled}
            className="w-full border shadow border-gray-400"
          >
            <option value="filling">Filling</option>
            <option value="bread">Bread</option>
            <option value="chocolates">Chocolate</option>
            <option value="crisps">Crisps</option>
            <option value="drinks">Drink</option>
          </select>
        </td>
        <td className="hidden sm:table-cell w-40 p-2 border-r border-gray-400">
          <input
            type="number"
            name="price"
            value={this.state.price}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            min="0"
            max="100"
            step="0.01"
            className="w-full border border-gray-400 pl-2"
          />
        </td>
        <td className="w-auto sm:w-40 p-2 border-r border-gray-400">
          <input
            type="checkbox"
            name="available"
            onChange={this.onInputChange}
            checked={this.state.available}
            disabled={this.state.disabled}
            className="w-full border border-gray-400 px-2 text-center mx-auto"
          />
        </td>
        <td className="hidden sm:table-cell w-48 p-2 border-r border-gray-400 text-center">
          {dateFormat(this.state.updatedAt, "dd/mm/yyyy HH:MM:ss")}
        </td>
        <td className="w-auto sm:w-40 p-2 font-semibold border-r border-gray-400">
          <button
            onClick={this.saveChanges}
            disabled={this.state.disabled || !this.state.allowSave}
            className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400  disabled:opacity-25"
          >Save</button>
        </td>
      </tr>
    )
  }
}

StockRow.propTypes = {
  item: PropTypes.object.isRequired,
  key: PropTypes.number
};

export default StockRow;
