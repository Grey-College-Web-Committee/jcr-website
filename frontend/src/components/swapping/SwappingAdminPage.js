import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import LoadingHolder from '../common/LoadingHolder';

class SwappingAdminPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      initialUpload: null,
      inData: "",
      refresh: new Date()
    };

    // Change this to your permission
    this.requiredPermission = "events.swapping";
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
    if(adminCheck.data.user.permissions) {
      if(adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if(!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    // Load any required data for the page here

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
      const lines = bomRemoved.split("\r\n");

      let uploadableObject = [];
      let failed = false;

      for(const line of lines) {
        if(line.trim().length === 0) break;

        const split = line.split(",");

        if(split.length !== 2) {
          alert("Each line should contain two entries only");
          failed = true;
          break;
        }

        uploadableObject.push({
          first: split[0],
          second: split[1]
        });
      }

      if(failed) return;

      this.uploadInitialPairs(uploadableObject);
    }

    reader.readAsBinaryString(this.state.initialUpload)
  }

  uploadInitialPairs = async (arr) => {
    let result;

    try {
      await api.post("/swapping/initial", { initialPairs: arr });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ disabled: false, initialUpload: null, initialUploadSuccess: true, refresh: new Date() });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Swapping Admin</h1>
          <div className="border p-2 text-left my-1">
            <h2 className="font-semibold text-2xl">Download Final Pairings</h2>
            <p>This will allow you to download the final positions of the pairs.</p>
          </div>
          <div className="border p-2 text-left my-1 flex flex-col">
            <h2 className="font-semibold text-2xl">Upload Initial Pairs</h2>
            <p>Upload the initial sets of pairs. The website will automatically allocate them to tables in the order of the rows in the CSV file uploaded. You can only do this if you have cleared the existing pairs.</p>
            <input
              type="file"
              name="initialUpload"
              onChange={this.onFileChange}
              accept=".csv"
              className="border p-1 my-2"
              key={this.state.refresh}
            />
            <button
              className="bg-grey-900 p-1 text-white w-auto disabled:opacity-50"
              disabled={this.state.disabled || !this.state.initialUpload}
              onClick={this.prepareInitialPairs}
            >Upload Initial Pairs</button>
            {
              this.state.initialUploadSuccess ? (
                <p className="mt-1">Upload successful. Pairs have been setup.</p>
              ) : null
            }
          </div>
          <div className="border p-2 text-left my-1">
            <h2 className="font-semibold text-2xl">Clear Existing</h2>
            <p>This will clear all of the existing pairs and swaps that have taken place. It will also clear all of the credit accumulated by users.</p>
          </div>
        </div>
      </div>
    );
  }
}

export default SwappingAdminPage;
