import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class AddStock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      type: "filling",
      price: 0,
      available: true,
      disabled: false
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  createNewItem = async e => {
    e.preventDefault();
    this.setState({ disabled: true });

    const { name, type, price, available } = this.state;

    if(name.length === 0) {
      alert("You must set a name for the new item.");
      this.setState({ disabled: false });
      return;
    }

    if(type.length === 0) {
      alert("You must set a type for the new item.");
      this.setState({ disabled: false });
      return;
    }

    let query;

    try {
      query = await api.post("/toastie_bar/stock", { name, type, price, available });
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error, loaded: true });
      return;
    }

    this.props.updateStockListing();
    this.setState({ name: "", type: "filling", price: 0, available: true, disabled: false });
  }

  render () {
    return (
      <React.Fragment>
        <form onSubmit={this.createNewItem}>
          <label>Name</label>
          <input
            type="text"
            name="name"
            onChange={this.onInputChange}
            value={this.state.name}
          />
          <br/>
          <label>Type</label>
          <select
            name="type"
            onChange={this.onInputChange}
            value={this.state.type}
          >
            <option value="filling">Filling</option>
            <option value="bread">Bread</option>
          </select>
          <br />
            <label>Price (£)</label>
            <input
              type="number"
              name="price"
              onChange={this.onInputChange}
              value={this.state.price}
              min="0"
              max="100"
              step="0.01"
            />
            <br/>
          <label>Available</label>
          <input
            type="checkbox"
            name="available"
            onChange={this.onInputChange}
            checked={this.state.available}
          />
          <br />
          <input
            type="submit"
            value="Create New Item"
            disabled={this.state.disabled}
          />
        </form>
      </React.Fragment>
    )
  }
}

export default AddStock;
