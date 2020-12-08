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
      available: this.props.item.available,
      type: this.props.item.type,
      customisationAvailable: this.props.item.customisationAvailable,
      cusotmisationDescription: this.props.item.cusotmisationDescription,
      addedPriceForCusotmisation: this.props.item.addedPriceForCusotmisation,
      price: this.props.item.price,
      XS: this.props.sizesAvailable.XS,
      S: this.props.sizesAvailable.S,
      M: this.props.sizesAvailable.M,
      L: this.props.sizesAvailable.L,
      XL: this.props.sizesAvailable.XL,
      XXL: this.props.sizesAvailable.XXL,
      updatedAt: this.props.item.updatedAt,
      disabled: false,
      allowSave: false,
      coloursEdited: false,
      simpleView: this.props.simpleView
    }
    this.getAllFields=this.getAllFields.bind(this);
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), allowSave: true })
  }

  saveSelectedColours = async() =>{
    const productId = this.state.id;

    const coloursLength = this.props.colours.length;
    for (var i = 0; i < coloursLength; i++){
      const colourId = this.props.colours[i].id;
      
      const isSelected = this.props.selectedColours[colourId];

      if (isSelected){ // If colour is a selected colour
        // Add colour option to table on the server
        try {
          await api.post("/stash/itemColour", { productId, colourId });
        } catch (error) {
          alert("An error occurred adding this colour option");
          return;
        };
      }

      else{
        // Remove the colour option from the table on the server
        try {
          await api.delete(`/stash/itemColour/${productId}${colourId}`, { productId, colourId });
        } catch (error) {
          alert("An error occurred adding this colour option");
          return;
        };
      }

    }
    this.setState({ coloursEdited: false });
  }

  saveChanges = async (e) => {
    // Prevent resubmission
    e.preventDefault();
    this.setState({ disabled: true });

    if (this.state.coloursEdited===true){
      this.saveSelectedColours();
    }

    // Validate data
    const { name, available, type, customisationAvailable, cusotmisationDescription, addedPriceForCusotmisation, price, XS, S, M, L, XL, XXL } = this.state;

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

    if(customisationAvailable === null) {
      alert("You must set an availability for the item");
      this.setState({ disabled: false });
      return;
    }

    // Update the item on the server

    try {
      await api.put(`/stash/stock/${this.state.id}`, { name, available, type, customisationAvailable, cusotmisationDescription, addedPriceForCusotmisation, price, XS, S, M, L, XL, XXL });
    } catch (error) {
      alert("An error occurred updating this value");
      return;
    }

    // Update the row
    await this.updateSelfStock();
  }

  updateSelfStock = async () => {
    this.setState({ disabled: true });
    // Just a standard GET for the data
    let query;

    try {
      query = await api.get(`/stash/stock/${this.state.id}`);
    } catch (error) {
      this.setState({ disabled: false });
      return;
    }

    const { name, type, customisationAvailable, cusotmisationDescription, addedPriceForCusotmisation, price, available, updatedAt } = query.data.stockItem;
    this.setState({ disabled: false, name, type, customisationAvailable, cusotmisationDescription, addedPriceForCusotmisation, price, available, updatedAt, allowSave: false, coloursEdited: false });
  }

  editColours = async () => {
    if (this.state.coloursEdited){
      this.setState({coloursEdited:false});
      return;
    }
    this.props.updateItemColours(this.state.id);
    this.setState({ coloursEdited: true, allowSave: true });
  }

  selectColourstext(){
    if(this.state.coloursEdited){
      return "Cancel";
    }
    return "Edit Colours";
  }

  getAllFields(){
    if(!this.props.simpleView)
    {
      return(
        <React.Fragment>
        <td className="hidden sm:table-cell w-40 p-2 border-r border-gray-400">
          <input
            type="text"
            value={this.state.cusotmisationDescription}
            onChange={this.onInputChange}
            disabled={this.state.disabled||!this.state.customisationAvailable}
            name="cusotmisationDescription"
            className="w-full border border-gray-400 px-2 disabled:opacity-50"
          />
        </td>
        <td className="hidden sm:table-cell w-40 p-2 border-r border-gray-400">
          <input
            type="number"
            name="addedPriceForCusotmisation"
            value={this.state.addedPriceForCusotmisation}
            onChange={this.onInputChange}
            disabled={this.state.disabled||!this.state.customisationAvailable}
            min="0"
            max="100"
            step="0.01"
            className="w-full border border-gray-400 pl-2"
          />
        </td>
        <td className="hidden sm:table-cell w-40 p-2 border-r border-gray-400">
        <table className="text-center focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50">
          <thead><tr><th>XS</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>XXL</th></tr></thead>
          <tbody>
            <tr>
              <td><input type="checkbox" name="XS" onChange={this.onInputChange} checked={this.state.XS} disabled={this.state.disabled}/></td>
              <td><input type="checkbox" name="S" onChange={this.onInputChange} checked={this.state.S} disabled={this.state.disabled}/></td>
              <td><input type="checkbox" name="M" onChange={this.onInputChange} checked={this.state.M} disabled={this.state.disabled}/></td>
              <td><input type="checkbox" name="L" onChange={this.onInputChange} checked={this.state.L} disabled={this.state.disabled}/></td>
              <td><input type="checkbox" name="XL" onChange={this.onInputChange} checked={this.state.XL} disabled={this.state.disabled}/></td>
              <td><input type="checkbox" name="XXL" onChange={this.onInputChange} checked={this.state.XXL} disabled={this.state.disabled}/></td>
            </tr>
          </tbody>
        </table>
        </td>
        <td className="hidden sm:table-cell w-40 p-2 border-r border-gray-400">
          <button
            onClick={this.editColours}
            disabled={this.state.disabled}
            className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >{this.selectColourstext()}</button>
        </td>
        <td className="hidden sm:table-cell w-48 p-2 border-r border-gray-400 text-center">{dateFormat(this.state.updatedAt, "dd/mm/yyyy HH:MM:ss")}</td>
        </React.Fragment>
      )
    }
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
            className="w-full border border-gray-400 px-2 disabled:opacity-50"
          />
        </td>
        <td className="w-64 p-2 border-r border-gray-400">
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
        <td className="hidden sm:table-cell w-40 p-2 border-r border-gray-400">
          <select
            name="type"
            onChange={this.onInputChange}
            value={this.state.type}
            disabled={this.state.disabled}
            className="w-full border shadow border-gray-400 disabled:opacity-50"
          >
            <option value="clothing">Clothing</option>
            <option value="accessory">Accessory</option>
            <option value="other">Other</option>
          </select>
        </td>
        <td className="hidden sm:table-cell p-2 border-r border-gray-400">
          <input
            type="checkbox"
            name="customisationAvailable"
            onChange={this.onInputChange}
            checked={this.state.customisationAvailable}
            disabled={this.state.disabled}
            className="w-full border border-gray-400 px-2 text-center mx-auto disabled:opacity-50"
          />
        </td>
        {this.getAllFields()}
        <td className="p-2 border-r border-gray-400">
          <input
            type="checkbox"
            name="available"
            onChange={this.onInputChange}
            checked={this.state.available}
            disabled={this.state.disabled}
            className="w-full border border-gray-400 px-2 text-center mx-auto disabled:opacity-50"
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.saveChanges}
            disabled={this.state.disabled || !this.state.allowSave}
            className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >Save Changes</button>
        </td>
      </tr>
    )
  }
}

StockRow.propTypes = {
  item: PropTypes.object.isRequired,
  simpleView: PropTypes.bool.isRequired,
  updateItemColours: PropTypes.func.isRequired,
  sizesAvailable: PropTypes.object.isRequired,
  selectedColours: PropTypes.object.isRequired,
  colours: PropTypes.array.isRequired,
  key: PropTypes.number
};

export default StockRow;
