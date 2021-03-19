import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../../utils/axiosConfig';

class NewFileForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      parent: "",
      file: "",
      disabled: false,
      inputFileRK: new Date()
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  onFileChange = e => {
    this.setState({ [e.target.name]: e.target.files[0] });
  }

  canSubmit = () => {
    const { name, file } = this.state;

    return (
      (name !== undefined && name !== null && name.length !== 0) &&
      (file !== undefined && file !== null && file !== "")
    );
  }

  createNewFile = async () => {
    this.setState({ disabled: true });
    const { name, description, parent, file } = this.state;

    let formData = new FormData();

    formData.append("name", name);
    formData.append("description", description);
    formData.append("parent", parent);
    formData.append("file", file);

    let res;

    try {
      res = await api.post("/jcr/file", formData, {
        headers: { "content-type": "multipart/form-data" }
      });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.props.onCreate(res.data.file);
    this.setState({ disabled: false, name: "", description: "", parent: "", file: "", inputFileRK: new Date() });
  }

  render () {
    return (
      <div>
        <h2 className="text-left font-semibold text-2xl">Create a New File</h2>
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
            <span className="flex flex-row justify-start text-sm mb-2">(Optional; {1500 - this.state.description.length} characters remaining)</span>
            <textarea
              name="description"
              value={this.state.description}
              onChange={this.onInputChange}
              className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              disabled={this.state.disabled}
              autoComplete=""
              maxLength={1500}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="parent" className="flex flex-row justify-start text-xl font-semibold">Parent Folder</label>
            <span className="flex flex-row justify-start text-sm mb-2">The folder this folder will be under</span>
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
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="file" className="flex flex-row justify-start text-xl font-semibold">File</label>
            <span className="flex flex-row justify-start text-sm mb-2">It's strongly advised that you upload PDFs as they can be viewed in the browser</span>
            <input
              type="file"
              name="file"
              onChange={this.onFileChange}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              disabled={this.state.disabled}
              accept="application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              key={this.state.inputFileRK}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <button
              className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled || !this.canSubmit()}
              onClick={this.createNewFile}
            >Create New File</button>
          </div>
        </fieldset>
      </div>
    )
  }
}

export default NewFileForm;
