import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import NewRoleForm from './NewRoleForm';
import RoleRow from './RoleRow';

class CreateNewRolePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      roles: [],
      committees: []
    };

    // Change this to your permission
    this.requiredPermission = "jcr.manage";
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

    let result;

    try {
      result = await api.get("/jcr/roles/manage");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    // Load any required data for the page here

    this.setState({ loaded: true, roles: result.data.roles, committees: result.data.committees });
  }

  appendNewRole = (role) => {
    const { roles } = this.state;
    roles.push(role);
    this.setState({ roles });
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
          <h1 className="font-semibold text-5xl pb-4">Manage Roles</h1>
          <NewRoleForm
            onCreate={this.appendNewRole}
          />
          <div className="mt-2 text-left">
            <h2 className="font-semibold text-2xl pb-2 text-left">Existing Roles</h2>
            <p className="py-1">You can adjust the roles that have already been created here as well as assign users and committees to them.</p>
            <p className="py-1">To control the hierarchy of a committee, so that they are displayed in the correct order on the website, set the position of the role within the committee. A lower number indicates a higher position within the committee. For example, Website Editor will have position 0 in the Website Committee as they chair it whereas they will have position 3 in the Executive Committee as they sit below JCR President (position 0), FACSO and VP (both in position 1), JCR Chair (position 2), then they are in the general executive members (all other members of the exec are also in position 3).</p>
            <table className="mx-auto border-2 text-left border-red-900 w-full mt-4">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Assigned Users</th>
                  <th className="p-2 font-semibold">Assigned Committees</th>
                  <th className="p-2 font-semibold">Save</th>
                  <th className="p-2 font-semibold">Delete</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.roles.map((role, i) => (
                    <RoleRow
                      key={i}
                      role={role}
                      committees={this.state.committees}
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

export default CreateNewRolePage;
