import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class SportsAndSocsRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      deleted: false,
      edited: false,
      name: this.props.record.name,
      description: this.props.record.description,
      email: this.props.record.email,
      facebook: this.props.record.facebook,
      instagram: this.props.record.instagram,
      discord: this.props.record.discord,
      type: this.props.record.type
    }
  }

  saveRow = async () => {
    this.setState({ disabled: true });

    const { name, description, email, facebook, instagram, discord, type } = this.state;

    if(name === undefined || name === null || name.length === 0) {
      alert("The name cannot be empty");
      this.setState({ disabled: false });
      return;
    }

    if(!(description !== undefined && description !== null && description.length !== 0)) {
      alert("The description cannot be empty");
      this.setState({ disabled: false });
      return;
    }

    if(!(email !== undefined && email !== null && email.length !== 0 && email.endsWith("@durham.ac.uk"))) {
      alert("Email must be set and must end with @durham.ac.uk");
      this.setState({ disabled: false });
      return;
    }

    if(!(type !== undefined && type !== null && type.length !== 0)) {
      alert("The type cannot be empty");
      this.setState({ disabled: false });
      return;
    }

    if(!(facebook === undefined || facebook === null || facebook.length === 0 || facebook.startsWith("https://"))) {
      alert("Facebook must be either empty or start with https://");
      this.setState({ disabled: false });
      return;
    }

    if(!(instagram === undefined || instagram === null || instagram.length === 0 || instagram.startsWith("https://"))) {
      alert("Instagram must be either empty or start with https://");
      this.setState({ disabled: false });
      return;
    }

    if(!(discord === undefined || discord === null || discord.length === 0 || discord.startsWith("https://"))) {
      alert("Discord must be either empty or start with https://");
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.post("/sportsandsocs/update", { id: this.props.record.id, name, description, email, facebook, instagram, discord, type });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ disabled: false, edited: false });
  }

  deleteRow = async () => {
    this.setState({ disabled: true });
    const confirmed = window.confirm("Are you sure you want to fully delete this sport/society?");

    if(!confirmed) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/sportsandsocs/${this.props.record.id}`);
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ deleted: true });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), edited: true })
  }

  render () {
    const { name, description, email, facebook, instagram, discord, type, edited, deleted, disabled } = this.state;

    if(deleted) {
      return null;
    }

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">
          <div className="flex flex-col items-start">
            <input
              type="text"
              name="name"
              value={name}
              className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={255}
            />
          </div>
        </td>
        <td className="p-2 border-r border-gray-400">
          <div className="flex flex-col items-start">
            <textarea
              type="text"
              name="description"
              value={description}
              className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400 h-32"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={20000}
            />
          </div>
        </td>
        <td className="p-2 border-r border-gray-400">
          <div className="flex flex-col items-start">
            <select
              name="type"
              value={type}
              className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
            >
              <option value="Sport">Sport</option>
              <option value="Society">Society</option>
              <option value="Committee">Committee</option>
            </select>
          </div>
        </td>
        <td className="p-2 border-r border-gray-400">
          <div className="flex flex-col items-start mb-1">
            <span className="text-left">Email: <span className="font-semibold">(must start with https://)</span></span>
            <input
              type="email"
              name="email"
              value={email}
              className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={255}
            />
          </div>
          <div className="flex flex-col items-start mb-1">
            <span className="text-left">Facebook: <span className="font-semibold">(must start with https://)</span></span>
            <input
              type="text"
              name="facebook"
              value={facebook}
              className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={255}
            />
          </div>
          <div className="flex flex-col items-start mb-1">
            <span className="text-left">Instagram: <span className="font-semibold">(must start with https://)</span></span>
            <input
              type="text"
              name="instagram"
              value={instagram}
              className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={255}
            />
          </div>
          <div className="flex flex-col items-start mb-1">
            <span className="text-left">Discord: <span className="font-semibold">(must start with https://)</span></span>
            <input
              type="text"
              name="discord"
              value={discord}
              className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={255}
            />
          </div>
        </td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.saveRow}
            className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={disabled || !edited}
          >Save</button>
        </td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.deleteRow}
            className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={disabled}
          >Delete</button>
        </td>
      </tr>
    )
  }
}

SportsAndSocsRow.propTypes = {
  record: PropTypes.object.isRequired
}

export default SportsAndSocsRow;
