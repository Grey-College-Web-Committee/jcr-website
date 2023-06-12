import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import CordialRow from './CordialRow';

class BarAdminManageCordial extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      cordials: [],
      name: "",
      price: 0,
      available: true,
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
      content = await api.get("/bar/admin/cordials");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    // Load any required data for the page here

    this.setState({ loaded: true, cordials: content.data.cordials });
  }

  createNewCordial = async () => {
    if(!this.canSubmit()) {
      alert("You must fill in the name first");
      return;
    }

    this.setState({ disabled: true });

    const { name, available, price } = this.state;

    let result;

    try {
      result = await api.post("/bar/admin/cordial", {
        name, available, price
      });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    let { cordials } = this.state;
    cordials.push(result.data.cordial);

    this.setState({ disabled: false, name: "", available: true, price: 0, cordials });
  }

  canSubmit = () => {
    return (
      (this.state.name !== undefined && this.state.name !== null && this.state.name.length !== 0) &&
      (this.state.price !== undefined && this.state.price !== null && Number(this.state.price) > 0) &&
      (this.state.available !== undefined && this.state.available !== null)
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
          <h1 className="font-semibold text-5xl pb-4">Manage Cordials</h1>
          <div>
            <div className="mb-2 flex flex-row justify-start">
              <Link to="/bar/admin/overview">
                <button
                  className="px-4 py-2 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >← Back to the overview</button>
              </Link>
            </div>
            <h2 className="font-semibold text-2xl pb-2 text-left">Create New Cordial</h2>
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
                <label htmlFor="price" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">Price</label>
                <span className="flex flex-row justify-start text-sm mb-2">Minimum of £0.01</span>
                <input
                  type="number"
                  name="price"
                  value={this.state.price}
                  onChange={this.onInputChange}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
                <label htmlFor="available" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">Available?</label>
                <div className="flex flex-col items-center justify-center ml-2">
                  <input
                    type="checkbox"
                    name="available"
                    checked={this.state.available}
                    onChange={this.onInputChange}
                    className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.props.disabled}
                    autoComplete=""
                  />
                </div>
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <button
                  className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled || !this.canSubmit()}
                  onClick={this.createNewCordial}
                >Create New Cordial</button>
              </div>
            </fieldset>
          </div>
          <div className="mt-4 text-left">
            <h2 className="font-semibold text-2xl pb-2 text-left">Existing Types</h2>
            <p>These can't be deleted as they may be used for some of the existing drinks. They can be edited though and if you need to effectively remove one you can unassign it from every drink using it and then it will no longer appear on the ordering page.</p>
            <table className="mx-auto border-2 text-left border-red-900 w-full mt-4">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Available</th>
                  <th className="p-2 font-semibold">Price (£)</th>
                  <th className="p-2 font-semibold">Save</th>
                  <th className="p-2 font-semibold">Delete</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.cordials.map((cordial, id) => (
                    <CordialRow
                      key={id}
                      cordial={cordial}
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

export default BarAdminManageCordial;
