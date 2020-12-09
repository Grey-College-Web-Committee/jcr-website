import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import api from '../../../utils/axiosConfig.js';

class ColoursRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.item.id,
      name: this.props.item.name,
      colour: this.props.item.colour,
      secondaryColour: this.props.item.secondaryColour,
      twoTone: this.props.item.twoTone,
      updatedAt: this.props.item.updatedAt,
      disabled: false,
      selected: this.props.selectedColours[this.props.item.id],
      allowSave: false,
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
    const { name, colour, twoTone, secondaryColour } = this.state;

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

    // Update the colour on the server
    try {
      await api.put(`/stash/stockColours/${this.state.id}`, { name, colour, twoTone, secondaryColour });
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
      query = await api.get(`/stash/stockColours/${this.state.id}`);
    } catch (error) {
      alert("An error occurred retrieving this value");
      this.setState({ disabled: false });
      return;
    }
    this.setState({ disabled: false });
    const { name, colour, updatedAt } = query.data.colourItem;
    this.setState({ disabled: false, name, colour, updatedAt, allowSave: false });
  }

  onColourChange = e => {
    this.setState({ [e.target.name]: e.target.value.toString(), allowSave: true })
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

  click = () => {
    this.props.itemColourChanged(this.state.id);
  }

  render () {
    const colour = this.props.id % 2 === 0 ? "bg-red-100" : "bg-white";
    return (
      <tr className={`${colour}`}>
        <td className="w-auto p-2 border-r border-gray-400">
          <input
            type="checkbox"
            value="selected"
            onChange={this.click}
            checked={this.props.selectedColours[this.state.id]}
            disabled={this.state.disabled}
            className="w-full border border-gray-400 px-2 text-center mx-auto disabled:opacity-50"
          />
          <button className="rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" onClick={this.click}>Select</button>
        </td>
        <td className="w-64 sm:w-40 p-2 border-r border-gray-400">
          <input
            type="text"
            value={this.state.name}
            onChange={this.onInputChange}
            disabled={this.state.disabled}
            name="name"
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
        <td className="w-40 p-2 border-r border-gray-400">
          {this.twoToneTrue()}
        </td>
        <td className="hidden sm:table-cell p-2 border-r border-gray-400 text-center">
          {dateFormat(this.state.updatedAt, "dd/mm/yyyy HH:MM:ss")}
        </td>
        <td className="w-auto p-2 font-semibold border-r border-gray-400">
          <button
            onClick={this.saveChanges}
            disabled={this.state.disabled || !this.state.allowSave}
            className="px-1 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >Save Changes</button>
        </td>
      </tr>
    )
  }
}

ColoursRow.propTypes = {
  item: PropTypes.object.isRequired,
  selectedColours: PropTypes.object.isRequired,
  itemColourChanged: PropTypes.func.isRequired,
  key: PropTypes.number
};

export default ColoursRow;