import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../utils/axiosConfig';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';

class MediaAdminPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      threads: []
    };

    // Change this to your permission
    this.requiredPermission = "media";
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
    /*let content;

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

    this.setState({ loaded: true, status: 200, threads });*/
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
          <h1 className="font-semibold text-5xl pb-4">Manage Media</h1>
          <div>
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
                  <tr className="text-center border-b border-gray-400">
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

export default MediaAdminPage;