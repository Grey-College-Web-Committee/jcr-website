import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import dateFormat from 'dateformat';

class WelfareAdminOverviewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      threads: [],

      deleteDate: ""
    };

    // Change this to your permission
    this.requiredPermission = "welfare.anonymous";
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

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/welfare/messages/threads/admin");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let { threads } = content.data;

    threads.sort((a, b) => {
      return -(a.lastUpdate < b.lastUpdate ? -1 : (a.lastUpdate > b.lastUpdate ? 1 : 0));
    });

    this.setState({ loaded: true, status: 200, threads });
  }

  deleteInactive = async () => {
    const { deleteDate } = this.state;

    if(!deleteDate || deleteDate.length === 0) {
      return;
    }

    let confirmed = window.confirm(`By clicking OK you confirm you are certain that you want to irreversibly delete all threads that have been inactive since ${dateFormat(deleteDate, "dd/mm/yyyy")}`);

    if(!confirmed) {
      return;
    }

    let result;

    try {
      result = await api.post("/welfare/messages/threads/delete/date", {
        deleteDate: this.state.deleteDate
      });
    } catch (error) {
      alert("An error occurred when deleting the threads")
      return;
    }

    window.alert(`Deleted ${result.data.deletedCount} threads. Click OK to reload the page.`);
    window.location.reload();
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
          <h1 className="font-semibold text-5xl pb-4">Manage Anonymous Messages</h1>
          <div>
            <div className="flex flex-col items-start border p-1 my-2">
              <h2 className="text-xl font-semibold">Delete Old Threads</h2>
              <p>You can delete old threads according to their activity. Set a date below and click the delete button to remove all threads that have not received a message since then.</p>
              <p className="font-semibold">These actions are irreversible!</p>
              <div className="flex flex-row my-1 items-center">
                <span>Inactive since:</span>
                <input
                  type="date"
                  value={this.state.deleteDate}
                  className="p-1 border ml-2"
                  name="deleteDate"
                  onChange={this.onInputChange}
                />
                <button
                  className="ml-2 p-1 bg-red-900 text-white disabled:opacity-25"
                  onClick={this.deleteInactive}
                  disabled={!this.state.deleteDate || this.state.deleteDate.length === 0}
                >Delete</button>
              </div>
            </div>
            <table className="mx-auto border-2 text-left border-red-900 w-full my-2">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Title</th>
                  <th className="p-2 font-semibold">Last Message Date</th>
                  <th className="p-2 font-semibold">View Thread</th>
                </tr>
              </thead>
              <tbody>
                {this.state.threads.map((thread, i) => (
                  <tr className="text-center border-b border-gray-400" key={i}>
                    <td className="p-2 border-r border-gray-400">{thread.title}</td>
                    <td className="p-2 border-r border-gray-400">{dateFormat(thread.lastUpdate, "dd/mm/yyyy HH:MM")}</td>
                    <td className="p-2 border-r border-gray-400">
                      <Link to={`/welfare/message/admin/thread/${thread.id}`}>
                        <button
                          className="px-4 py-1 rounded bg-green-700 text-white w-full md:w-48 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        >View</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default WelfareAdminOverviewPage;
