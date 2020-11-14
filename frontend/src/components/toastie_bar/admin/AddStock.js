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
    let query;

    try {
      query = await api.post("/toastie_bar/stock", { name, type, price, available });
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
      <React.Fragment>
        <form onSubmit={this.createNewItem}>
          <table className="stockTable">
            <tbody>
              <tr>
                <td>Name</td>
                <td>
                  <input
                    type="text"
                    name="name"
                    onChange={this.onInputChange}
                    value={this.state.name}
                  />
                </td>
              </tr>
              <tr>
                <td>Type</td>
                <td>
                  <select
                    name="type"
                    onChange={this.onInputChange}
                    value={this.state.type}
                  >
                    <option value="filling">Filling</option>
                    <option value="bread">Bread</option>
                    <option value="other">Other Item</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Price (£)</td>
                <td>
                  <input
                    type="number"
                    name="price"
                    onChange={this.onInputChange}
                    value={this.state.price}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </td>
              </tr>
              <tr>
                <td>Available</td>
                <td>
                  <input
                    type="checkbox"
                    name="available"
                    onChange={this.onInputChange}
                    checked={this.state.available}
                  />
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <input
                    type="submit"
                    value="Create New Item"
                    disabled={this.state.disabled}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </React.Fragment>
    )
  }
}

export default AddStock;
