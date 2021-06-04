import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import socketIOClient from 'socket.io-client';
import ToastieOrder from './ToastieOrder';

class ToastieAdminLive extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      initialLoaded: false,
      refreshKey: new Date(),
      activeOrders: {},
      completedOrders: {},
      showCompleted: false
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
    this.socket.on("toastieInitialData", this.handleInitialData);
    // // This will occur when the server send a barNewOrder event
    this.socket.on("toastieNewOrder", this.handleNewOrder);
    // // This will occur when someone updates an order as completed
    this.socket.on("toastieOrderCompleted", this.handleOrderCompleted);
    // // This will occur when someone updates if the bar is open for orders
    // this.socket.on("barOpenChanged", this.handleBarOpenChanged)

    this.setState({ loaded: true });
  }

  handleInitialData = (data) => {
    const { transformedOrders, open } = data;
    transformedOrders.forEach(this.handleNewOrder);
    this.setState({ initialLoaded: true, openForOrders: open });
  }

  handleNewOrder = (order) => {
    let { activeOrders } = this.state;
    activeOrders[order.id] = order;
    this.setState({ activeOrders });
  }

  handleOrderCompleted = (data) => {
    let { orderId } = data;
    let { activeOrders } = this.state;

    const filteredIdRecords = Object.keys(activeOrders).filter(id => Number(id) === Number(orderId));

    if(filteredIdRecords.length === 0) {
      return;
    }

    const completedOrder = activeOrders[filteredIdRecords[0]];
    completedOrder.completed = true;

    delete activeOrders[`${orderId}`];

    this.setState({ activeOrders, refreshKey: new Date() });
  }

  updateOrderCompleted = (orderId) => {
    // Called when the order is marked as completed so it can update all instances
    this.socket.emit("markToastieOrderCompleted", { orderId });
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

    const { showCompleted, initialLoaded, activeOrders, refreshKey } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Live Toastie Orders</h1>
          <p className="text-left">Toastie orders will appear here as they come in. The oldest orders will appear at the top of the page. You can mark individual items as completed as well as marking whole orders as completed. If you mark a whole order it will be moved to the completed orders section to help track which orders are outstanding.</p>
          <p className="text-left">If you want to see the completed orders in this session (i.e. since you opened this page) you can toggle them on or off. They will appear greyed out and will be uneditable.</p>
          <div className="flex flex-row justify-start py-1">
            <button
              className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onClick={() => {
                this.setState({ showCompleted: !showCompleted });
              }}
            >{showCompleted ? "Hide Recently Completed" : "Show Recently Completed"}</button>
          </div>
          {
            !initialLoaded ? <LoadingHolder /> : null
          }
          {
            Object.keys(activeOrders).sort((a, b) => {
              const aDate = new Date(activeOrders[a].createdAt);
              const bDate = new Date(activeOrders[b].createdAt);

              return aDate < bDate ? -1 : (aDate > bDate ? 1 : 0);
            }).map(id => (
              <ToastieOrder
                key={`${refreshKey}-${id}`}
                order={activeOrders[id]}
                completed={activeOrders[id].completed}
                updateOrderCompleted={this.updateOrderCompleted}
                showCompleted={showCompleted}
              />
            ))
          }
        </div>
      </div>
    );
  }
}
export default ToastieAdminLive;
