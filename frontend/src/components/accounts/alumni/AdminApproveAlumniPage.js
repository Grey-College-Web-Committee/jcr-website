import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

class AdminApproveAlumniPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      applications: []
    };

    // Change this to your permission
    this.requiredPermission = "users.manage";
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
    let result;

    try {
      result = await api.get("/alumni/pending");
    } catch (error) {
      this.setState({ status: error.response.data, error: error.response.data?.error });
      return;
    }

    const { applications } = result.data;

    this.setState({ loaded: true, applications });
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
          <h1 className="font-semibold text-5xl pb-4">Approve Alumni</h1>
          {
            !this.state.applications || this.state.applications?.length === 0 ? (
              <p>No outstanding applications</p>
            ) : (
              <div>
                <table className="mx-auto border-2 text-left border-red-900 w-full">
                  <thead className="bg-red-900 text-white">
                    <tr>
                      <th className="p-2 font-semibold">ID</th>
                      <th className="p-2 font-semibold">Username</th>
                      <th className="p-2 font-semibold">First Name</th>
                      <th className="p-2 font-semibold">Surname</th>
                      <th className="p-2 font-semibold">Year</th>
                      <th className="p-2 font-semibold">Submitted At</th>
                      <th className="p-2 font-semibold">Approve</th>
                      <th className="p-2 font-semibold">Deny</th>
                    </tr>
                  </thead>
                  <tbody>
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
    );
  }
}

export default AdminApproveAlumniPage;
