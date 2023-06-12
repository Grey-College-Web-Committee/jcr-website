import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

class NewFormal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      initialUpload: null,
      uploadableObject: [],
      name: '',
      disabled: false,
      date: '',
      success: false
    };

    // Change this to your permission
    this.requiredPermission = "formals.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Load the data once the element is ready
  componentDidMount = async () => {
    let adminCheck;

    try {
      adminCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify admin status" });
      return;
    }

    // Ensure they are an admin
    if (adminCheck.data.user.permissions) {
      if (adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if (!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    this.setState({ loaded: true });
  }

  onFileChange = (e) => {
    this.setState({ [e.target.name]: e.target.files[0] });
  }

  prepareInitialPairs = (e) => {
    this.setState({ disabled: true });

    const reader = new FileReader();

    reader.onload = () => {
      const { result } = reader;
      // Remove BOM from Excel
      const bomRemoved = result.substr(0, 3) === "ï»¿" ? result.replace(/ï»¿/, '') : result;
      let lines
      if (bomRemoved.includes("\r\n")) {
        lines = bomRemoved.split("\r\n");
      } else {
        lines = bomRemoved.split("\n");
      }

      let uploadableObject = [];
      let failed = false;

      for (const line of lines) {
        if (line.trim().length === 0) break;

        const split = line.split(",");
        if (split.length !== 5) {
          alert("Each line should contain five entries only");
          failed = true;
          break;
        }

        uploadableObject.push({
          firstNames: split[0],
          surname: split[1],
          email: split[4]
        });
      }

      if (failed) return;
      this.setState({ disabled: false, initialUploadSuccess: true, uploadableObject });
    }

    reader.readAsBinaryString(this.state.initialUpload)
  }

  createFormal = async () => {
    const { uploadableObject, name, date } = this.state
    if (uploadableObject.length === 0 || name === '' || date === '') return alert('Please ensure that the CSV contains attendees and that you have filled in the name and close date.')
    this.setState({ disabled: true })
    try {
      await api.post("/formals", { attendees: uploadableObject, name, closeDate: (new Date(date)).toJSON() })
    } catch {
      alert("Database error!")
      return this.setState({ disabled: false })
    }
    this.setState({ disabled: false, success: true })
  }

  render() {
    if (!this.state.loaded) {
      if (this.state.status !== 200 && this.state.status !== 0) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <LoadingHolder />
      );
    }

    if (this.state.success) {
      return (
        <Redirect to={`/formals/admin`} />
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">New Formal</h1>
          <div className="border p-2 text-left my-1 flex flex-col">
            <h2 className="font-semibold text-2xl">Upload CSV</h2>
            <p>Upload the CSV from the Durham booking system.</p>
            <input
              type="file"
              name="initialUpload"
              onChange={this.onFileChange}
              accept=".csv"
              className="border p-1 my-2"
              key={this.state.refresh}
              disabled={this.state.disabled || this.state.initialUploadSuccess}
            />
            <button
              className="bg-grey-900 p-1 text-white w-auto disabled:opacity-50"
              disabled={this.state.disabled || !this.state.initialUpload || this.state.initialUploadSuccess}
              onClick={this.prepareInitialPairs}
            >Upload Formal Attendees</button>
            {
              this.state.initialUploadSuccess ? (
                <p className="mt-1 text-green-900">Upload successful. Attendees have been setup.</p>
              ) : null
            }
          </div>
          <div className="border p-2 text-left my-1 flex flex-col">
            <div className="pb-2">
              <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Formal Name</label>
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
            <div className='pb-2'>
              <label htmlFor="date" className="flex flex-row justify-start text-xl font-semibold">Close Date</label>
              <span className="flex flex-row justify-start text-sm mb-2">This is the date after which no more groups can be formed.</span>
              <input
                type="datetime-local"
                name="date"
                value={this.state.date}
                className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                onChange={this.onInputChange}
                disabled={this.state.disabled}
                autoComplete=""
              />
            </div>
            <button
              className="bg-grey-900 p-1 text-white w-auto disabled:opacity-50"
              disabled={this.state.disabled || !this.state.initialUploadSuccess}
              onClick={this.createFormal}
            >Create Formal</button>
          </div>
        </div>
      </div>
    );
  }
}

export default NewFormal;
