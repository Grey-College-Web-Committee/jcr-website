import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import SizeRow from './SizeRow';

class BarAdminManageSizes extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      sizes: [],
      name: "",
      disabled: false
    };

    // Change this to your permission
    this.requiredPermission = "bar.manage";
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

    let content;

    try {
      content = await api.get("/bar/admin/sizes");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    // Load any required data for the page here

    this.setState({ loaded: true, sizes: content.data.sizes });
  }

  createNewSize = async () => {
    if(!this.canSubmit()) {
      alert("You must fill in the name first");
      return;
    }

    this.setState({ disabled: true });

    const { name } = this.state;

    let result;

    try {
      result = await api.post("/bar/admin/size", {
        name
      });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    let { sizes } = this.state;
    sizes.push(result.data.size);

    this.setState({ disabled: false, name: "", sizes });
  }

  canSubmit = () => {
    return (
      (this.state.name !== undefined && this.state.name !== null && this.state.name.length !== 0)
    );
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
        <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
          <h1 className="font-semibold text-5xl pb-4">Manage Sizes</h1>
          <div>
            <div className="mb-2 flex flex-row justify-start">
              <Link to="/bar/admin/overview">
                <button
                  className="px-4 py-2 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >← Back to the overview</button>
              </Link>
            </div>
            <h2 className="font-semibold text-2xl pb-2 text-left">Create New Size</h2>
            <fieldset>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Size Name</label>
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
                  onClick={this.createNewSize}
                >Create New Size</button>
              </div>
            </fieldset>
          </div>
          <div className="mt-4 text-left">
            <h2 className="font-semibold text-2xl pb-2 text-left">Existing Types</h2>
            <p>These can't be deleted as they may be used for some of the existing drinks. They can be edited though and if you need to remove one you can unassign it from every drink using it and then it will no longer appear on the ordering page.</p>
            <table className="mx-auto border-2 text-left border-red-900 w-full mt-4">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Save</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.sizes.map((size, id) => (
                    <SizeRow
                      key={id}
                      size={size}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default BarAdminManageSizes;
