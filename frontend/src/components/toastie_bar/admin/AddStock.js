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
    // Prevent refresh on button click and prevent resubmission
    e.preventDefault();
    this.setState({ disabled: true });

    const { name, type, price, available } = this.state;

    // Validation checks
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

    // Add it to the database

    try {
      await api.post("/toastie_bar/stock", { name, type, price, available });
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error, loaded: true });
      return;
    }

    // Update the data displayed once we do this
    this.props.updateStockListing();
    this.setState({ name: "", type: "filling", price: 0, available: true, disabled: false });
  }

  render () {
    return (
      <div>
        <form onSubmit={this.createNewItem}>
          <fieldset>
            <div className="mx-auto w-max pb-4 border-b-2">
              <label for="name" className="flex flex-row justify-start pb-2 text-lg font-semibold">Name</label>
              <input
                type="text"
                name="name"
                onChange={this.onInputChange}
                value={this.state.name}
                className="shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div className="mx-auto w-max pb-4 border-b-2">
              <label for="type" className="flex flex-row justify-start pb-2 text-lg font-semibold">Type</label>
              <select
                name="type"
                onChange={this.onInputChange}
                value={this.state.type}
                className="shadow w-64 border rounded p-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="filling">Filling</option>
                <option value="bread">Bread</option>
                <option value="chocolates">Chocolate</option>
                <option value="crisps">Crisps</option>
                <option value="drinks">Drink</option>
              </select>
            </div>
            <div className="mx-auto w-max pb-4 border-b-2">
              <label for="price" className="flex flex-row justify-start pb-2 text-lg font-semibold">Price (£)</label>
              <input
                type="number"
                name="price"
                onChange={this.onInputChange}
                value={this.state.price}
                min="0"
                max="100"
                step="0.01"
                className="shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div className="mx-auto w-64 pt-4">
              <input
                type="submit"
                value="Create New Item"
                disabled={this.state.disabled}
                className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div className="mx-auto pt-4">
              <span className="w-full">New items are automatically marked available</span>
            </div>
          </fieldset>
        </form>
      </div>
    )
  }
}

AddStock.propTypes = {
  updateStockListing: PropTypes.func.isRequired
};

export default AddStock;
