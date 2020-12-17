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
      manufacturerCode: this.props.item.manufacturerCode,
      description: this.props.item.description,
      available: this.props.item.available,
      type: this.props.item.type,
      customisationsAvailable: [],
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
  resetAll(){
    this.setState({
      id: this.props.item.id,
      name: this.props.item.name,
      manufacturerCode: this.props.item.manufacturerCode,
      description: this.props.item.description,
      available: this.props.item.available,
      type: this.props.item.type,
      customisationsAvailable: [],
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
     })
  }

  componentDidMount = async () => {
    this.getAllCustomisations();
  }

  getAllCustomisations= async()=>{
	  let query;
	  try {
	    let itemId = this.state.id;
	    query = await api.get(`/stash/allCustomisations/${itemId}`);
	  } catch (error) {
	    alert("An error occurred getting customisations");
	    return;
	  };
    const customisations = query.data.customisations;
    let length = customisations.length;
    for (var i = 0; i < length; i ++){
      customisations[i].uploaded = true;
    }
    this.setState({ customisationsAvailable: customisations })
  }

  deleteItem = async(e)=>{
    // Prevent resubmission
    e.preventDefault();
    this.setState({ disabled: true });

    try {
      await api.delete(`/stash/stock/${this.state.id}`);
    } catch (error) {
      alert("An error occurred deleting this item");
      return;
    }
    await this.props.updateAll();
    this.resetAll();
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
    const { name, manufacturerCode, description, available, type, price, XS, S, M, L, XL, XXL } = this.state;

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
      await api.put(`/stash/stock/${this.state.id}`, { name, manufacturerCode, description, available, type, price, XS, S, M, L, XL, XXL });
    } catch (error) {
      alert("An error occurred updating this value");
      return;
    }

    this.saveCustomisations();

    // Update the row
    await this.updateSelfStock();
  }

  saveCustomisations = async () => {
    const productId = this.state.id;
	  let length = this.state.customisationsAvailable.length;
	  for (var i = 0; i < length; i++){
      const { id, customisationChoice, addedPriceForCustomisation } = this.state.customisationsAvailable[i];
      if (this.state.customisationsAvailable[i].uploaded){
        try {
          await api.put(`/stash/customisation/${productId}/${id}`, { customisationChoice:customisationChoice, addedPriceForCustomisation:addedPriceForCustomisation });
        } catch (error) {
          alert("Error updating customisation option")
          return;
        }
      }
      else{
        try {
          await api.post(`/stash/customisation/${productId}`, { customisationChoice:customisationChoice, addedPriceForCustomisation:addedPriceForCustomisation });
        } catch (error) {
          alert("Error adding customisation option")
          return;
        }
      }
    }
    this.setState({ customisationsAvailable: [] })
    this.getAllCustomisations();
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

  changeCustValues = e => {
    let data = this.state.customisationsAvailable;
    let targets = e.target.name.split(',')
    if (targets[1] === "addedPriceForCustomisation"){ data[targets[0]].addedPriceForCustomisation=e.target.value; }
    else if (targets[1] === "customisationChoice"){ data[targets[0]].customisationChoice=e.target.value; }
    else if (targets[1] === "name"){ data[targets[0]].name=e.target.value; }

    this.setState({ customisationsAvailable: data, allowSave: true });
  }

  showCustomisation(field){
    let codeSnippet = [];
    const customisationValidChoices = [
      "Back/Leg Print: Grey College or Durham University",
      "Back Embroidery: Grey College or Durham University",
      "Back Embroidery Personalised",
      "Right Breast/Small Item Personalisation"
    ];
    if (this.state.customisationsAvailable.length > 0){
      const length = this.state.customisationsAvailable.length;
      for (var i = 0; i<length; i++){
        let value;
        let classNme = "w-32 shadow border rounded py-1 px-1 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50";
        if (field === "name"){ value = this.state.customisationsAvailable[i].name; }
        else if (field === "customisationChoice"){ value = customisationValidChoices[this.state.customisationsAvailable[i].customisationChoice]; }
        else if (field === "addedPriceForCustomisation"){
          value = this.state.customisationsAvailable[i].addedPriceForCustomisation;
          classNme = "w-16 shadow border rounded py-1 px-1 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50";
        }

        codeSnippet.push(
          <input
              type={field==="addedPriceForCustomisation" ? "number":"text"}
              name={[i,field]}
              onChange={this.changeCustValues}
              value={value}
              className={classNme}
              disabled={this.state.disabled || field === "customisationChoice"}
            />
        );
        if (field === "addedPriceForCustomisation") {
          codeSnippet.push(
            this.getRemovalButtonCode(i)
          )
        }
      }

    }
    if (field === "addedPriceForCustomisation") {
      codeSnippet.push(
        <input
          type="button"
          value="addNewCustomisation"
          disabled={this.state.disabled}
          onClick={() => this.addCustomisationOption()}
          className="px-1 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        ></input>
      )
    }
    else{ codeSnippet.push(<div className="px-4 py-1" style={{ height: "2rem" }}></div>) }
    return codeSnippet;
  }

  getRemovalButtonCode(i){
    return(
      <button
        value={i}
        onClick={this.onRemove}
        disabled={this.state.disabled}
        className="px-1 py-1 rounded bg-red-900 text-white w-16 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
      >{(this.state.customisationsAvailable[i].uploaded) ? "Delete":"Cancel"}</button>
	  )
  }

  onRemove = async (e) => {
    const CustomisationToDelete = this.state.customisationsAvailable[e.target.value];
    this.state.customisationsAvailable.splice(e.target.value);
    if (CustomisationToDelete.uploaded === true){
      try {
        let custChoice = CustomisationToDelete.customisationChoice;
        let productId = this.state.id;
        await api.delete(`/stash/customisation/${custChoice}/${productId}`)
        .then((response) => {
        this.getAllCustomisations();
        });
      } catch (error) {
        alert("An error occurred removing this customisation option.");
        return null;
      };
    }
    else{
      this.getAllCustomisations();
    }
  }


  addCustomisationOption(){
    //const customisations = this.state.customisationsAvailable;
    //customisations.push({ uploaded:false, description: "", addedPrice: 0.00 });
    //this.setState({ customisationsAvailable: customisations, allowSave: true });
  }

  onCancel(){
    console.log("Cancel")
  }

  getAllFields(){
    if(!this.props.simpleView)
    {
      return(
        <React.Fragment>
          <td className="w-20 hidden lg:table-cell p-1 border-r border-gray-400">
            {this.showCustomisation("customisationChoice")}
          </td>
          <td className="hidden w-36 lg:table-cell p-1 border-r border-gray-400">
            {this.showCustomisation("addedPriceForCustomisation")}
          </td>
          <td className="hidden sm:table-cell p-1 border-r border-gray-400">
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
            <button
              onClick={this.editColours}
              disabled={this.state.disabled}
              className="px-1 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >{this.selectColourstext()}</button>
          </td>
          <td className="hidden lg:table-cell w-20 p-1 border-r border-gray-400 text-center">{dateFormat(this.state.updatedAt, "dd/mm/yyyy HH:MM:ss")}</td>
        </React.Fragment>
      )
    }
  }

  render () {
    return (
      <tr className="border-b border-red-900">
        <td className="w-auto p-1 border-r border-gray-400">
          <input
            type="text"
            value={this.state.name}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            name="name"
            className="w-full border border-gray-400 px-1 my-1 disabled:opacity-50"
          />
          <input
            type="text"
            value={this.state.manufacturerCode}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            name="manufacturerCode"
            className="w-20 border border-gray-400 px-1 my-1 disabled:opacity-50"
          />
        </td>
        <td className="hidden md:table-cell w-auto p-1 border-r border-gray-400">
          <textarea
            value={this.state.description}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            name="description"
            className="w-full border border-gray-400 px-1 my-1 disabled:opacity-50"
          />
        </td>
        <td className="w-20 p-1 border-r border-gray-400">
          <input
            type="number"
            name="price"
            value={this.state.price}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            min="0"
            max="100"
            step="0.01"
            className="w-full border border-gray-400 pl-1"
          />
        </td>
        <td className="hidden sm:table-cell w-auto p-1 border-r border-gray-400">
          <select
            name="type"
            onChange={this.onInputChange}
            value={this.state.type}
            disabled={this.state.disabled}
            className="w-full border shadow border-gray-400 disabled:opacity-50"
          >
            <option value="hoodiesAndLoungewear">Hoodies & Loungewear</option>
            <option value="jackets">Jackets</option>
            <option value="jumpersAndFleeces">Jumpers/Fleeces</option>
            <option value="sports">Sports</option>
            <option value="tShirts">T-Shirts</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>
        </td>
        {this.getAllFields()}
        <td className="p-1 border-r border-gray-400">
          <input
            type="checkbox"
            name="available"
            onChange={this.onInputChange}
            checked={this.state.available}
            disabled={this.state.disabled}
            className="w-full border border-gray-400 px-2 text-center mx-auto disabled:opacity-50"
          />
        </td>
        <td className="p-1 border-r border-gray-400">
          <button
            onClick={this.saveChanges}
            disabled={this.state.disabled || !this.state.allowSave}
            className="px-1 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >Save Changes</button>
          <button
            onClick={(e) => (window.confirm('Are you sure you wish to delete this item?')) ? this.deleteItem(e) : this.onCancel("cancel")}
            disabled={this.state.disabled}
            className="my-1 px-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >Delete Item</button>
        </td>
      </tr>
    )
  }
}

StockRow.propTypes = {
  item: PropTypes.object.isRequired,
  simpleView: PropTypes.bool.isRequired,
  updateItemColours: PropTypes.func.isRequired,
  updateAll: PropTypes.func.isRequired,
  sizesAvailable: PropTypes.object.isRequired,
  selectedColours: PropTypes.object.isRequired,
  colours: PropTypes.array.isRequired,
  key: PropTypes.number
};

export default StockRow;
