import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';

class ComplaintViewPage extends React.Component {
  constructor(props) {
    super(props);

    // Gets the id from the URL bar
    this.state = {
      loaded: false,
      status: 0,
      error: "",
      id: this.props.match.params.id
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

    // Gets the details of the complaint
    try {
      contents = await api.get(`/complaints/single/${this.state.id}`);
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to load the complaint" });
      return;
    }

    const { complaint } = contents.data;

    this.setState({ loaded: true, ...complaint });
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

    const { name, User, complainingAbout, createdAt, subject, reason, signatureLink } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <div className="py-2 text-left">
            <Link to="/complaints/admin">
              <button
                className="px-4 py-2 rounded bg-blue-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >← Back to Complaints</button>
            </Link>
          </div>
          <table className="mx-auto border-2 text-left border-red-900 w-full">
            <tbody>
              <tr>
                <td className="p-2 bg-red-900 text-white font-semibold border-r border-gray-400 w-1/6">Submitted By</td>
                <td className="p-2 border-r border-gray-400 border-b">
                  <p>Given: {name}</p>
                  <p>Actual: {`${User.firstNames.split(',')[0]} ${User.surname}`}</p>
                  <p>Email: {User.email}</p>
                </td>
              </tr>
              <tr>
                <td className="p-2 bg-red-900 text-white font-semibold border-r border-gray-400 w-1/6">Signature</td>
                <td className="p-2 border-r border-gray-400 border-b">
                  <img
                    src={`/uploads/complaints/signatures/${signatureLink}`}
                    alt="Signature"
                    className="h-16 md:h-24 w-auto border"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2 bg-red-900 text-white font-semibold border-r border-gray-400 w-1/6">Complaint About</td>
                <td className="p-2 border-r border-gray-400 border-b">{complainingAbout}</td>
              </tr>
              <tr>
                <td className="p-2 bg-red-900 text-white font-semibold border-r border-gray-400 w-1/6">Submitted At</td>
                <td className="p-2 border-r border-gray-400 border-b">{dateFormat(createdAt, "dd/mm/yyyy HH:MM")}</td>
              </tr>
              <tr>
                <td className="p-2 bg-red-900 text-white font-semibold border-r border-gray-400 w-1/6">Subject</td>
                <td className="p-2 border-r border-gray-400 border-b">{subject}</td>
              </tr>
              <tr>
                <td className="p-2 bg-red-900 text-white font-semibold border-r border-gray-400 w-1/6">Complaint</td>
                <td className="p-2 border-r border-gray-400 border-b">
                  {
                    reason.split("\n").map((paragraph, i) => {
                      if(paragraph.length === 0) {
                        return null;
                      }

                      return (
                        <p className="pt-1 text-justify" key={i}>{paragraph}</p>
                      );
                    })
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ComplaintViewPage;
