import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import MemberRow from './MemberRow';

class ManageMembershipsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      ids: [],
      username: "",
      firstNames: "",
      surname: "",
      membership: "any"
    };

    // Change this to your permission
    this.requiredPermission = "jcr.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) });
  }

  filterData = (record) => {
    const { username, firstNames, surname, membershipExpiresAt } = record;

    if(this.state.username.length !== 0) {
      if(!username.toLowerCase().includes(this.state.username.toLowerCase())) {
        return false;
      }
    }

    if(this.state.firstNames.length !== 0) {
      if(!firstNames.toLowerCase().includes(this.state.firstNames.toLowerCase())) {
        return false;
      }
    }

    if(this.state.surname.length !== 0) {
      if(!surname.toLowerCase().includes(this.state.surname.toLowerCase())) {
        return false;
      }
    }

    if(this.state.membership !== "any") {
      const hasMembership = membershipExpiresAt !== null;

      if(this.state.membership === "yes") {
        if(!hasMembership) {
          return false;
        }
      } else {
        if(hasMembership) {
          return false;
        }
      }
    }

    return true;
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

    let serverResponse;

    try {
      serverResponse = await api.get("/memberships/user/ids");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to load IDs" });
      return;
    }

    this.setState({ loaded: true, ids: serverResponse.data.ids });
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
          <h1 className="font-semibold text-5xl pb-4">Manage JCR Memberships</h1>
          <div>
            <div className="mb-2">
              <h2 className="text-left font-semibold text-2xl">Filters</h2>
              <table>
                <tbody>
                  <tr>
                    <td className="text-left">Username Contains:</td>
                    <td>
                      <input
                        type="text"
                        className="w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        value={this.state.username}
                        name="username"
                        onChange={this.onInputChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">First Names Contains:</td>
                    <td>
                      <input
                        type="text"
                        className="w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        value={this.state.firstNames}
                        name="firstNames"
                        onChange={this.onInputChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Surname Contains:</td>
                    <td>
                      <input
                        type="text"
                        className="w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        value={this.state.surname}
                        name="surname"
                        onChange={this.onInputChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Has Membership:</td>
                    <td>
                      <select
                        value={this.state.membership}
                        name="membership"
                        className="w-64 border rounded py-1 px-1 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        onChange={this.onInputChange}
                      >
                        <option value="any">Any</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="mx-auto border-2 text-left border-red-900 w-full">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Username</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">First Names</th>
                    <th className="p-2 font-semibold">Surname</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">Registered On</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">Last Login</th>
                    <th className="p-2 font-semibold">Membership Expires On</th>
                    <th className="p-2 font-semibold">Grant/Revoke Membership</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.ids.map(id => (
                      <MemberRow
                        key={id}
                        id={id}
                        displayCondition={this.filterData}
                      />
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ManageMembershipsPage;
