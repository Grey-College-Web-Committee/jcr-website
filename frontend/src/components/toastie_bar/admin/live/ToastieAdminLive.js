import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import socketIOClient from 'socket.io-client';

class ToastieAdminLive extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
    };

    // Change this to your permission
    this.requiredPermission = "toastie.stock.edit";
  }

  componentWillUnmount = () => {
    // Want to end the connection when it unmounts
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

    // Prepare the socket.io client

    const protocol = window.location.protocol.toLowerCase() === "https:" ? "wss" : "ws";

    this.socket = socketIOClient(`${protocol}://${window.location.host}`);//, { transports: [ "websocket" ]});
    // Subscribes to the barOrderClients room so that we receive the events relating to orders
    this.socket.emit("subscribeToToastieOrders", {});
    // This will occur when the server sends the initial backlog of orders
    // this.socket.on("barInitialData", this.handleInitialData);
    // // This will occur when someone updates a drink as complete
    // this.socket.on("barContentCompleted", this.handleOrderContentCompleted);
    // // This will occur when the server send a barNewOrder event
    // this.socket.on("barNewOrder", this.handleNewOrder);
    // // This will occur when someone updates an order as paided
    // this.socket.on("barOrderPaid", this.handleOrderPaid);
    // // This will occur when someone updates an order as completed
    // this.socket.on("barOrderCompleted", this.handleOrderCompleted);
    // // This will occur when someone updates if the bar is open for orders
    // this.socket.on("barOpenChanged", this.handleBarOpenChanged)

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
          <h1 className="font-semibold text-5xl pb-4">Live Toastie Orders</h1>
        </div>
      </div>
    );
  }
}
export default ToastieAdminLive;
