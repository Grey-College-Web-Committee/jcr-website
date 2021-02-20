import React from 'react';
import PropTypes from 'prop-types';

class CreateTicketCustomRow extends React.Component {
  constructor(props) {
    super(props);

    // Default comes from the parent as sometimes we refresh
    this.state = {
      name: this.props.data.name,
      required: this.props.data.required,
      type: this.props.data.type,
      dropdownValues: this.props.data.dropdownValues,
    };
  }

  onInputChange = e => {
    // Standard input updater, pass up to parent
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) }, () => {
      const { name, required, type, dropdownValues } = this.state;
      this.props.passUp(this.props.id, { name, required, type, dropdownValues });
    });
  }

  onDropdownValueChange = e => {
    // Update the individual dropdown value based on attributes
    // Also pass up to the parent
    const key = e.target.getAttribute("data-key");
    let { dropdownValues } = this.state;

    dropdownValues[`${key}`][e.target.name] = (e.target.type === "checkbox" ? e.target.checked : e.target.value);

    this.setState({ dropdownValues }, () => {
      const { name, required, type, dropdownValues } = this.state;
      this.props.passUp(this.props.id, { name, required, type, dropdownValues });
    });
  }

  onDropdownDefaultChange = e => {
    // Only 1 value can be the default
    const key = e.target.getAttribute("data-key");
    let { dropdownValues } = this.state;

    // If it was the only field, refuse to make the change
    if(Object.keys(dropdownValues).length === 1) {
      return;
    }

    // Can't remove the default, only assign it to another one
    if(dropdownValues[key].is_default) {
      return;
    }

    // Set all the others to non-defaults
    Object.keys(dropdownValues).forEach(id => {
      dropdownValues[id].is_default = false;
    });

    // Set this element to the default
    dropdownValues[`${key}`].is_default = e.target.checked;

    // Save the changes and update the parent
    this.setState({ dropdownValues }, () => {
      const { name, required, type, dropdownValues } = this.state;
      this.props.passUp(this.props.id, { name, required, type, dropdownValues });
    });
  }

  addDropdownValue = () => {
    // Create a new dropdown value
    const nextId = Object.keys(this.state.dropdownValues).length === 0 ? 0 : Math.max(...Object.keys(this.state.dropdownValues)) + 1;
    let { dropdownValues } = this.state;

    // Default values for the dropdown
    dropdownValues[`${nextId}`] = {
      value: "",
      is_default: Object.keys(this.state.dropdownValues).length === 0
    };

    // Update and pass up to the parent
    this.setState({ dropdownValues }, () => {
      const { name, required, type, dropdownValues } = this.state;
      this.props.passUp(this.props.id, { name, required, type, dropdownValues });
    });
  }

  removeDropdownValue = (id) => {
    // Deletes a value from the dropdown
    let { dropdownValues } = this.state;
    // We also need to check if it was the default so we can pass it to another
    const wasDefault = dropdownValues[id].is_default;
    delete dropdownValues[id];

    // If it was the default and there are still values left
    if(wasDefault && Object.keys(dropdownValues).length !== 0) {
      // Set the first one to be the default
      dropdownValues[Object.keys(dropdownValues)[0]].is_default = true;
    }

    // Update and pass up to the parent
    this.setState({ dropdownValues }, () => {
      const { name, required, type, dropdownValues } = this.state;
      this.props.passUp(this.props.id, { name, required, type, dropdownValues });
    });
  }

  render () {
    return (
      <div className="flex flex-col">
        <fieldset>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="name" className="flex flex-row justify-start text-lg font-semibold">Field Name</label>
            <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.name.length} characters remaining)</span>
            <input
              name="name"
              onChange={this.onInputChange}
              type="text"
              value={this.state.name}
              className="w-full border border-black rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              maxLength={255}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="required" className="flex flex-row justify-start text-lg font-semibold">Field Required?</label>
            <span className="flex flex-row justify-start text-sm mb-2">Forces the individual to fill in this field</span>
            <input
              name="required"
              onChange={this.onInputChange}
              type="checkbox"
              checked={this.state.required}
              className="w-full border border-black rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="type" className="flex flex-row justify-start text-lg font-semibold">Field Type</label>
            <div className="flex flex-row justify-start">
              <select
                name="type"
                onChange={this.onInputChange}
                value={this.state.type}
                className="w-auto border border-black rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              >
                <option value="dropdown">Dropdown</option>
                <option value="freetext">Free Text (max 1000 characters)</option>
                <option value="checkbox">Checkbox</option>
              </select>
              {
                this.state.type === "dropdown" ? (
                  <button
                    onClick={this.addDropdownValue}
                    className="ml-6 px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  >Add Dropdown Value</button>
                ) : null
              }
            </div>
          </div>
        </fieldset>
        {
          this.state.type === "dropdown" ? (
            <div className="border flex flex-col">
              <table className="mx-auto border-2 text-left border-red-900 w-full">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Value</th>
                    <th className="p-2 font-semibold">Is Default?</th>
                    <th className="p-2 font-semibold">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    Object.keys(this.state.dropdownValues).map(id => (
                      <tr className="text-center border-b border-gray-400" key={id}>
                        <td className="p-2 border-r border-gray-400">
                          <input
                            type="text"
                            onChange={this.onDropdownValueChange}
                            name="value"
                            data-key={id}
                            value={this.state.dropdownValues[id].value}
                            className="w-full border border-black rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-400">
                          <input
                            type="checkbox"
                            onChange={this.onDropdownDefaultChange}
                            name="is_default"
                            data-key={id}
                            checked={this.state.dropdownValues[id].is_default}
                            className="w-full border border-black rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-400">
                          <button
                            className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                            onClick={() => {
                              this.removeDropdownValue(id);
                            }}
                          >Remove</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          ) : null
        }
      </div>
    )
  }
}

CreateTicketCustomRow.propTypes = {
  id: PropTypes.string.isRequired,
  passUp: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired
}

export default CreateTicketCustomRow;
