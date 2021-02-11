import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';

class ComplaintsAdminOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
    };

    // Change this to your permission
    this.requiredPermission = "complaints.manage";
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
    let contents;

    // Loads the complaints
    try {
      contents = await api.get("/complaints");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to load the complaints" });
      return;
    }

    let { complaints } = contents.data;

    // Sorts them so the newest is at the top
    complaints = complaints.sort((a, b) => {
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);

      return -(aDate < bDate ? -1 : (aDate > bDate ? 1 : 0));
    });

    this.setState({ loaded: true, complaints });
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
          <h1 className="font-semibold text-5xl pb-4">Complaints</h1>
          <table className="mx-auto border-2 text-left border-red-900 w-full">
            <thead className="bg-red-900 text-white">
              <tr>
                <th className="p-2 font-semibold">From</th>
                <th className="p-2 font-semibold">About</th>
                <th className="p-2 font-semibold">Subject</th>
                <th className="p-2 font-semibold">Submited At</th>
                <th className="p-2 font-semibold">View Complaint</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.complaints.map((complaint, i) => (
                  <tr className="border-b border-gray-400">
                    <td className="p-2 border-r border-gray-400 break-all">
                      <p>Given: {complaint.name}</p>
                      <p>Actual: {`${complaint.User.firstNames.split(',')[0]} ${complaint.User.surname}`}</p>
                    </td>
                    <td className="p-2 border-r border-gray-400 break-all">{complaint.complainingAbout}</td>
                    <td className="p-2 border-r border-gray-400 break-all">{complaint.subject}</td>
                    <td className="p-2 border-r border-gray-400">{dateFormat(complaint.createdAt, "dd/mm/yyyy HH:MM")}</td>
                    <td className="p-2 border-r border-gray-400">
                      <Link to={`/complaints/view/${complaint.id}`}>
                        <button
                          className="px-4 py-1 rounded bg-blue-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        >View Complaint</button>
                      </Link>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ComplaintsAdminOverview;
