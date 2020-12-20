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
      ids: []
    };

    // Change this to your permission
    this.requiredPermission = "jcr.manage";
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
          <table className="mx-auto border-2 text-left border-red-900 w-full">
            <thead className="bg-red-900 text-white">
              <tr>
                <th className="p-2 font-semibold">Username</th>
                <th className="p-2 font-semibold">First Names</th>
                <th className="p-2 font-semibold">Surname</th>
                <th className="p-2 font-semibold hidden sm:table-cell">Registered On</th>
                <th className="p-2 font-semibold hidden sm:table-cell">Last Login</th>
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
                    displayCondition={(record) => { return true }}
                  />
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ManageMembershipsPage;
