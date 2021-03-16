import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../../utils/axiosConfig';

class NewRowForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      disabled: false
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  canSubmit = () => {
    const { name } = this.state;

    return (
      (name !== undefined && name !== null && name.length !== 0)
    );
  }

  createNewRole = async () => {
    this.setState({ disabled: true });
    const { name } = this.state;

    let result;

    try {
      result = await api.post("/jcr/role", { name });
    } catch (error) {
      this.setState({ disabled: false });
      alert(error.response.data.error);
      return;
    }

    this.props.onCreate(result.data.role);
    this.setState({ disabled: false, name: "" });
  }

  render () {
    return (
      <div>
        <h2 className="text-left font-semibold text-2xl">Create a New Role</h2>
        <fieldset>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Name</label>
            <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.name.length} characters remaining)</span>
            <input
              type="text"
              name="name"
              value={this.state.name}
              onChange={this.onInputChange}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              disabled={this.state.disabled}
              autoComplete=""
              maxLength={255}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <button
              className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled || !this.canSubmit()}
              onClick={this.createNewRole}
            >Create New Role</button>
          </div>
        </fieldset>
      </div>
    )
  }
}

export default NewRowForm;
