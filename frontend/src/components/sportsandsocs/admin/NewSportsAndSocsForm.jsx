import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class NewSportsAndSocsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      email: "",
      facebook: "",
      instagram: "",
      discord: "",
      type: "",
      disabled: false
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  canSubmit = () => {
    const { name, description, email, facebook, instagram, discord, type } = this.state;

    return (
      (name !== undefined && name !== null && name.length !== 0) &&
      (description !== undefined && description !== null && description.length !== 0) &&
      (email !== undefined && email !== null && email.length !== 0 && email.endsWith("@durham.ac.uk")) &&
      (type !== undefined && type !== null && type.length !== 0) &&
      (facebook === undefined || facebook === null || facebook.length === 0 || facebook.startsWith("https://")) &&
      (instagram === undefined || instagram === null || instagram.length === 0 || instagram.startsWith("https://")) &&
      (discord === undefined || discord === null || discord.length === 0 || discord.startsWith("https://"))
    );
  }

  createNewSportOrSoc = async () => {
    this.setState({ disabled: true });
    const { name, description, email, facebook, instagram, discord, type } = this.state;

    let result;

    try {
      result = await api.post("/sportsandsocs/create", { name, description, email, facebook, instagram, discord, type });
    } catch (error) {
      this.setState({ disabled: false });
      alert(error.response.data.error);
      return;
    }

    this.props.onCreate(result.data.record);
    alert("Created successfully");
    this.setState({ disabled: false, name: "", description: "", email: "", facebook: "", instagram: "", discord: "", type: "" });
  }

  render () {
    return (
      <div>
        <h2 className="text-left font-semibold text-2xl">Create a New Sport/Soc</h2>
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
            <label htmlFor="description" className="flex flex-row justify-start text-xl font-semibold">Description</label>
            <span className="flex flex-row justify-start text-sm mb-2">({10000 - this.state.description.length} characters remaining)</span>
            <textarea
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              name="description"
              value={this.state.description}
              onChange={this.onInputChange}
              maxLength={10000}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="email" className="flex flex-row justify-start text-xl font-semibold">Email</label>
            <span className="flex flex-row justify-start text-sm mb-1">This must be a durham.ac.uk email address.</span>
            <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.email.length} characters remaining)</span>
            <input
              type="email"
              name="email"
              value={this.state.email}
              onChange={this.onInputChange}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              disabled={this.state.disabled}
              autoComplete=""
              maxLength={255}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="facebook" className="flex flex-row justify-start text-xl font-semibold">Facebook</label>
            <span className="flex flex-row justify-start text-sm mb-1">Must either be blank or start with https://</span>
            <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.facebook.length} characters remaining)</span>
            <input
              type="text"
              name="facebook"
              value={this.state.facebook}
              onChange={this.onInputChange}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              disabled={this.state.disabled}
              autoComplete=""
              maxLength={255}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="instagram" className="flex flex-row justify-start text-xl font-semibold">Instagram</label>
            <span className="flex flex-row justify-start text-sm mb-1">Must either be blank or start with https://</span>
            <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.instagram.length} characters remaining)</span>
            <input
              type="text"
              name="instagram"
              value={this.state.instagram}
              onChange={this.onInputChange}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              disabled={this.state.disabled}
              autoComplete=""
              maxLength={255}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="discord" className="flex flex-row justify-start text-xl font-semibold">Discord</label>
            <span className="flex flex-row justify-start text-sm mb-1">Must either be blank or start with https://</span>
            <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.discord.length} characters remaining)</span>
            <input
              type="text"
              name="discord"
              value={this.state.discord}
              onChange={this.onInputChange}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              disabled={this.state.disabled}
              autoComplete=""
              maxLength={255}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="type" className="flex flex-row justify-start text-xl font-semibold">Type</label>
            <select
              value={this.state.type}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400 mt-2"
              name="type"
              onChange={this.onInputChange}
            >
              <option value="" hidden={true} disabled={true}>Please select an option...</option>
              <option value="Sport">Sport</option>
              <option value="Society">Society</option>
              <option value="Committee">Committee</option>
            </select>
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <button
              className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled || !this.canSubmit()}
              onClick={this.createNewSportOrSoc}
            >Create New Sport/Soc</button>
          </div>
        </fieldset>
      </div>
    )
  }
}

NewSportsAndSocsForm.propTypes = {
  onCreate: PropTypes.func.isRequired
}

export default NewSportsAndSocsForm;
