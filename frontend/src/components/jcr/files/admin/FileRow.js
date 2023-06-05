import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../../utils/axiosConfig';

class FileRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      deleted: false,
      name: this.props.file.name,
      description: this.props.file.description,
      parent: this.props.file.parent,
      realFileName: this.props.file.realFileName,
      edited: false,
    }
  }

  view = async () => {
    window.open(`${window.location.origin}/uploads/jcr/${this.state.realFileName}/view`)
  }

  saveRow = async () => {
    this.setState({ disabled: true });

    const { name, description, parent } = this.state;

    try {
      await api.post("/jcr/file/update", { id: this.props.file.id, name, description, parent });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ disabled: false, edited: false });
  }

  deleteRow = async () => {
    this.setState({ disabled: true });
    const confirmed = window.confirm("Are you sure you want to fully delete this file?");

    if(!confirmed) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/jcr/file/${this.props.file.id}`);
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return
    }

    this.setState({ deleted: true });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), edited: true })
  }

  render () {
    if(this.state.deleted) {
      return null;
    }

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">
          <input
            type="text"
            name="name"
            value={this.state.name}
            className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            onChange={this.onInputChange}
            autoComplete=""
            maxLength={255}
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <textarea
            name="description"
            value={this.state.description}
            onChange={this.onInputChange}
            className="border w-auto rounded my-2 h-auto py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            disabled={this.state.disabled}
            autoComplete=""
            maxLength={1500}
          />
        </td>
        <td className="p-2 border-r border-gray-400">
        <button onClick={this.view}>View File</button>
        </td>
        <td className="p-2 border-r border-gray-400">
          <select
            onChange={this.onInputChange}
            name="parent"
            className="w-full h-8 border border-gray-400 disabled:opacity-50"
            value={this.state.parent}
            disabled={this.state.disabled}
          >
            <option value="">[Base]</option>
            {this.props.folders.map(folder => (
              <option key={folder.id} value={folder.id}>{folder.display}</option>
            ))}
          </select>
        </td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.saveRow}
            className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={this.state.disabled || !this.state.edited}
          >Save</button>
        </td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.deleteRow}
            className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={this.state.disabled}
          >Delete</button>
        </td>
      </tr>
    );
  }
}

FileRow.propTypes = {
  file: PropTypes.object.isRequired,
  folders: PropTypes.array.isRequired
}

export default FileRow;
