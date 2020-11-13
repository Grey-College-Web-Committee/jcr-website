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
    let query;

    try {
      query = await api.put(`/toastie_bar/stock/${this.state.id}`, { name, type, price, available });
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
      console.log(error);
      this.setState({ disabled: false });
      return;
    }

    const { name, type, price, available, updatedAt } = query.data.stockItem;
    this.setState({ disabled: false, name, type, price, available, updatedAt, allowSave: false });
  }

  render () {
    return (
      <tr>
        <td>
          <input
            type="text"
            value={this.state.name}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            name="name"
          />
        </td>
        <td>
          <select
            name="type"
            onChange={this.onInputChange}
            value={this.state.type}
            disabled={this.state.disabled}
          >
            <option value="filling">Filling</option>
            <option value="bread">Bread</option>
            <option value="other">Other Item</option>
          </select>
        </td>
        <td>
          <input
            type="number"
            name="price"
            value={this.state.price}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            min="0"
            max="100"
            step="0.01"
          />
        </td>
        <td>
          <input
            type="checkbox"
            name="available"
            onChange={this.onInputChange}
            checked={this.state.available}
            disabled={this.state.disabled}
          />
        </td>
        <td>{dateFormat(this.state.updatedAt, "dd/mm/yyyy hh:mm:ss")}</td>
        <td>
          <button
            onClick={this.saveChanges}
            disabled={this.state.disabled || !this.state.allowSave}
          >Save Changes</button>
        </td>
      </tr>
    )
  }
}

export default StockRow;
