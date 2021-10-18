import React from 'react';
import { Redirect } from 'react-router-dom';
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
      openForOrders: false,
      allOrders: {},
      showingAll: false,
      sortOrder: "oldest"
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

    this.socket = socketIOClient(`${protocol}://${window.location.host}`, { transports: [ "websocket" ]});
    // Subscribes to the barOrderClients room so that we receive the events relating to orders
    this.socket.emit("subscribeToToastieOrders", {});
    // This will occur when the server sends the initial backlog of orders
    this.socket.on("toastieInitialData", this.handleInitialData);
    // This will occur when the server send a barNewOrder event
    this.socket.on("toastieNewOrder", this.handleNewOrder);
    // This will occur when someone updates an order as completed
    this.socket.on("toastieOrderCompleted", this.handleOrderCompleted);
    // This will occur when someone updates if the bar is open for orders
    this.socket.on("toastieOpenChanged", this.handleToastieOpenChanged)

    this.setState({ loaded: true });
  }

  handleInitialData = (data) => {
    const { allNightOrders, open } = data;
    allNightOrders.forEach(this.handleNewOrder);

    this.setState({ initialLoaded: true, openForOrders: open });
  }

  handleNewOrder = (order) => {
    let { allOrders } = this.state;
    allOrders[order.id] = order;
    this.setState({ allOrders });
  }

  handleOrderCompleted = (data) => {
    let { orderId } = data;
    let allOrders = Object.assign(this.state.allOrders);

    const filteredIdRecords = Object.keys(allOrders).filter(id => Number(id) === Number(orderId));

    if(filteredIdRecords.length === 0) {
      return;
    }

    allOrders[filteredIdRecords[0]].completed = true;
    this.setState({ allOrders, refreshKey: new Date() });
  }

  handleToastieOpenChanged = (data) => {
    const { open } = data;
    this.setState({ openForOrders: open });
  }

  updateOrderCompleted = (orderId) => {
    // Called when the order is marked as completed so it can update all instances
    this.socket.emit("markToastieOrderCompleted", { orderId });
  }

  toggleOpenForOrders = () => {
    // Change the toastie ordering to open or closed
    const newOpen = !this.state.openForOrders;
    this.socket.emit("setToastieOpen", { open: newOpen });
    this.setState({ openForOrders: newOpen });
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

    const { initialLoaded, refreshKey, openForOrders, allOrders } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Live Toastie Orders</h1>
          <div className="flex flex-row items-center">
            {
              initialLoaded ? (
                <React.Fragment>
                  <p className="text-left font-semibold text-lg py-1 mr-2">Ordering Status: { openForOrders ? "Open" : "Closed" }</p>
                  <button
                    onClick={this.toggleOpenForOrders}
                    className={`px-4 py-1 rounded ${ openForOrders ? "bg-red-700" : "bg-green-700" } text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                  >{ openForOrders ? "Set Closed" : "Set Open" }</button>
                </React.Fragment>
              ) : (
                <p className="text-left font-semibold text-lg py-1 mr-2">Ordering Status: Loading...</p>
              )
            }
          </div>
          <p className="text-left">Toastie orders will appear here as they come in. The oldest orders will appear at the top of the page. You can mark individual items as completed as well as marking whole orders as completed. If you mark a whole order it will be moved to the completed orders section to help track which orders are outstanding.</p>
          <p className="text-left">If you want to see the completed orders in this session (i.e. since you opened this page) you can toggle them on or off. They will appear greyed out and will be uneditable.</p>
          <div className="flex flex-col">
            <div className="flex flex-row justify-start py-1 items-center">
              <span>Show orders:</span>
              <select
                onChange={this.onInputChange}
                value={this.state.showingAll}
                name="showingAll"
                className="ml-1 p-1 border"
              >
                <option value="incomplete">Incomplete Only</option>
                <option value="all">All from today</option>
              </select>
            </div>
            <div className="flex flex-row justify-start py-1 items-center">
              <span>Sort order:</span>
              <select
                onChange={this.onInputChange}
                value={this.state.sortOrder}
                name="sortOrder"
                className="ml-1 p-1 border"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            <div className="flex flex-row justify-start py-1 items-center">
              <span>Orders today: {Object.keys(this.state.allOrders).length}</span>
            </div>
          </div>
          {
            !initialLoaded ? <LoadingHolder /> : null
          }
          {
            Object.keys(allOrders).sort((a, b) => {
              const aDate = new Date(allOrders[a].createdAt);
              const bDate = new Date(allOrders[b].createdAt);
              const sign = this.state.sortOrder === "oldest" ? 1 : -1;

              return sign * (aDate < bDate ? -1 : (aDate > bDate ? 1 : 0));
            }).map(id => (
              <ToastieOrder
                key={`${refreshKey}-${id}`}
                order={allOrders[id]}
                completed={allOrders[id].completed}
                updateOrderCompleted={this.updateOrderCompleted}
                showCompleted={this.state.showingAll === "all"}
              />
            ))
          }
        </div>
      </div>
    );
  }
}
export default ToastieAdminLive;
