import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder.js';
import dateFormat from 'dateformat';

class FormalsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      formals: []
    };

    // Change this to your permission
    this.requiredPermission = "formals.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let adminCheck;

    try {
      adminCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify admin status" });
      return;
    }

    // Ensure they are an admin
    if (adminCheck.data.user.permissions) {
      if (adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if (!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    // Once the component is ready we can query the API
    let formals;

    try {
      formals = (await api.get("/formals/all")).data.formals;
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, formals });
  }

  deleteFormal = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the formal "${name}"? This action is irreversible!`)) {
      try {
        let { formals } = this.state
        await api.delete(`/formals/${id}`)
        formals = formals.filter(formal => formal.id !== id)
        this.setState({ formals })
      } catch {
        alert("Database error!")
      }
    }
  }

  render() {
    if (!this.state.loaded) {
      if (this.state.status !== 200 && this.state.status !== 0) {
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
          <h1 className="font-semibold text-5xl pb-4">Formals Admin</h1>
          <Link to={`/formals/admin/new`} className="w-full md:w-auto">
            <button
              className="px-4 py-1 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >New Formal</button>
          </Link>
          {this.state.formals.length === 0 && <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
            <p>No formals found.</p>
          </div>}
          <div className="flex flex-col">
            {
              this.state.formals.sort((a, b) => a.closeDate > b.closeDate ? 1 : (a.closeDate < b.closeDate ? -1 : 0)).map((record, i) => (
                <div key={i} className="border-2 border-grey-300 p-2 text-left mt-4">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex flex-col justify-between mt-2 md:ml-2 md:mt-0 flex-grow">
                      <div>
                        <h2 className="font-semibold text-3xl text-center md:text-left">{record.name}</h2>
                        <p className="pb-2 text-lg text-center md:text-left">Seating selection closes: {dateFormat(record.closeDate, "dd/mm/yyyy HH:MM")}</p>
                      </div>
                      <div className="flex flex-col justify-start md:flex-row">
                        <Link to={`/formals/admin/${record.id}/details`} className="w-full md:w-auto">
                          <button
                            className="px-4 py-1 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                          >More Details</button>
                        </Link>
                        <button
                          onClick={() => this.deleteFormal(record.id, record.name)}
                          className="md:ml-5 md:mt-0 mt-2 px-4 py-1 rounded text-lg bg-red-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        >Delete Formal</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}

FormalsPage.contextType = authContext;

export default FormalsPage;
