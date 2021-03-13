import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import socketIOClient from 'socket.io-client';

class BarAdminLive extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      data: "None"
    };

    this.socket = socketIOClient("http://localhost:3000");

    // Change this to your permission
    this.requiredPermission = "bar.manage";
  }

  componentWillUnmount = () => {
    this.socket.disconnect();
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

    this.socket.emit("subscribeToBarOrders", {});
    this.socket.on("barOrder", (data) => {
      this.setState({ data });
    })
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
          <h1 className="font-semibold text-5xl pb-4">Live Bar Orders</h1>
          <p>Bar orders will appear here as they come in. The oldest orders will appear at the top of the page. You can mark individual drinks as completed as well as marking whole orders as paid and completed. If you mark a whole order it will be moved to the completed orders section to help track which orders are outstanding.</p>
          <button
            onClick={() => {
            }}
          >Request</button>
          <p>{this.state.data}</p>
        </div>
      </div>
    );
  }
}

export default BarAdminLive;
