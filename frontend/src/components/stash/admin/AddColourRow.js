import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig.js';

class AddColourRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "Add New",
      colour: '#BE2B2E',
      secondaryColour: '#BE2B2E',
      twoTone: false,
      disabled: false
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), allowSave: true })
  }

  createNewItem = async e => {
    // Prevent refresh on button click and prevent resubmission
    e.preventDefault();
    this.setState({ disabled: true });

    const { name, colour, twoTone, secondaryColour } = this.state;

    // Validation checks
    if(name === null || name.length === 0) {
      alert("You must set a name for the colour");
      this.setState({ disabled: false });
      return;
    }

    if(colour === null || colour.length === 0) {
      alert("You must set a colour value for the colour");
      this.setState({ disabled: false });
      return;
    }

    if(twoTone === null || twoTone.length === 0) {
      alert("You must set a type for the colour");
      this.setState({ disabled: false });
      return;
    }

    // Add it to the database

    try {
      await api.post("/stash/stockColour", { name, colour, twoTone, secondaryColour });
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error, loaded: true });
      return;
    }

    // Update the data displayed once we do this
    this.props.updateColoursListing();
    this.setState({ name: "Add New", colour:"#BE2B2E", twoTone: false, secondaryColour: "#BE2B2E",disabled: false });
  }

  onColourChange = e => {
    this.setState({ [e.target.name]: e.target.value.toString() })
  }

  twoToneTrue(){
    if (this.state.twoTone){
      return(
      <React.Fragment>
        <input 
          type="color"
          name="colour"
          onChange={this.onColourChange}
          value={this.state.colour}
          disabled={this.state.disabled}
          className="w-full border border-gray-400 px-2 text-center mx-auto disabled:opacity-50"
        />
        <input 
          type="color"
          name="secondaryColour"
          onChange={this.onColourChange}
          value={this.state.secondaryColour}
          disabled={this.state.disabled}
          className="w-full border border-gray-400 px-2 text-center mx-auto disabled:opacity-50"
        />
      </React.Fragment>
      )
    }
    else{
      return(<React.Fragment>
        <input 
          type="color"
          name="colour"
          onChange={this.onColourChange}
          value={this.state.colour}
          disabled={this.state.disabled}
          className="w-full border border-gray-400 px-2 text-center mx-auto disabled:opacity-50"
        />
      </React.Fragment>)
    }
  }

  render () {
    return (
      <tr>
        <td className="p-2 border-r border-gray-400 text-center">-</td>
        <td className="w-auto sm:w-40 p-2 border-r border-gray-400">
          <input
            type="text"
            value={this.state.name}
            onChange={this.onInputChange}
            name="name"
            disabled={this.state.disabled}
            className="w-full border border-gray-400 px-2 disabled:opacity-50"
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <input
            type="checkbox"
            name="twoTone"
            onChange={this.onInputChange}
            checked={this.state.twoTone}
            disabled={this.state.disabled}
            className="w-full border border-gray-400 px-2 text-center mx-auto disabled:opacity-50"
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          {this.twoToneTrue()}
        </td>
        <td colSpan="2" className="w-20 p-2 font-semibold border-r border-gray-400">
          <input
            type="submit"
            onClick={this.createNewItem}
            value="Create New"
            disabled={this.state.disabled}
            className="px-1 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          />
        </td>
      </tr>
    )
  }
}

AddColourRow.propTypes = {
  updateColoursListing: PropTypes.func.isRequired
};

export default AddColourRow;
