import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

class BarAdminOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
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

    // Load any required data for the page here

    this.setState({ loaded: true });
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
          <h1 className="font-semibold text-5xl pb-4">Manage Bar</h1>
          <div className="flex flex-col items-start mb-4">
            <h2 className="font-semibold text-3xl pb-1">Live Orders</h2>
            <p className="pb-1">This page will show you orders as they come in so that they can be processed.</p>
            <Link to="/bar/admin/live">
              <button
                className="px-4 py-1 rounded bg-grey-500 text-white md:w-80 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >View Live Orders</button>
            </Link>
          </div>
          <div className="flex flex-col items-start mb-4">
            <h2 className="font-semibold text-3xl pb-1">Open/Close Ordering</h2>
            <p>Current Status: TODO OPEN/CLOSED</p>
            <p>Put a button here to toggle it</p>
          </div>
          <div>
            <h2 className="font-semibold text-3xl pb-1 text-left">Manage Drinks</h2>
            <table className="mx-auto border-2 text-left border-red-900 w-full">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Description</th>
                  <th className="p-2 font-semibold">Manage</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center border-b border-gray-400">
                  <td className="p-2 border-r border-gray-400">Manage the drinks that are on offer including adding new drinks and changing their availability</td>
                  <td className="p-2 border-r border-gray-400">
                    <Link to="/bar/admin/drinks">
                      <button
                        className="px-4 py-1 rounded bg-red-900 text-white md:w-80 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      >Manage Drinks</button>
                    </Link>
                  </td>
                </tr>
                <tr className="text-center border-b border-gray-400">
                  <td className="p-2 border-r border-gray-400">Manage the mixers that are on offer including their availability</td>
                  <td className="p-2 border-r border-gray-400">
                    <Link to="/bar/admin/mixers">
                      <button
                        className="px-4 py-1 rounded bg-red-900 text-white md:w-80 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      >Manage Mixers</button>
                    </Link>
                  </td>
                </tr>
                <tr className="text-center border-b border-gray-400">
                  <td className="p-2 border-r border-gray-400">Manage the general types of drinks (e.g. spirits, beer, wine, etc.)</td>
                  <td className="p-2 border-r border-gray-400">
                    <Link to="/bar/admin/types">
                      <button
                        className="px-4 py-1 rounded bg-red-900 text-white md:w-80 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      >Manage Types</button>
                    </Link>
                  </td>
                </tr>
                <tr className="text-center border-b border-gray-400">
                  <td className="p-2 border-r border-gray-400">Manage the general sizes of drinks which can then be assigned in the drinks management</td>
                  <td className="p-2 border-r border-gray-400">
                    <Link to="/bar/admin/sizes">
                      <button
                        className="px-4 py-1 rounded bg-red-900 text-white md:w-80 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      >Manage Sizes</button>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default BarAdminOverview;
