import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import socketIOClient from 'socket.io-client';
import { ToastieOrderRow } from './ToastieOrderRow';

class ToastieAdminLive extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",

      initialDataLoaded: false,
      orderRecords: [],
      completed: 0,

      open: false
    };

    // Change this to your permission
    this.requiredPermission = "toasties.manage";
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
    this.socket.emit("subscribeToToastieBar", {});
    // This will occur when the server sends the initial backlog of orders
    this.socket.on("toastieBarInitialData", this.handleInitialData);
    // // This will occur when the server send a barNewOrder event
    this.socket.on("toastieBarNewOrder", this.handleNewOrder);
    // // This will occur when someone updates an order as completed
    this.socket.on("toastieBarOrderCompleted", this.handleToastieBarOrderCompleted);
    // This will occur when someone updates if the bar is open for orders
    this.socket.on("toastieBarOpenStatusChanged", this.handleToastieBarStatusChanged)

    this.setState({ loaded: true });
  }

  // Initial Data

  handleInitialData = (data) => {
    const { open, orderRecords } = data;
    this.setState({ initialDataLoaded: true, open, orderRecords });
  }

  // Open / Closing

  toggleOpenForOrders = () => {
    // Change the toastie ordering to open or closed
    const newOpen = !this.state.open;
    this.socket.emit("setToastieBarOpen", { open: newOpen });
    this.setState({ open: newOpen });
  }

  handleToastieBarStatusChanged = (data) => {
    const { open } = data;
    this.setState({ open });
  }

  // Order completion
  
  completeOrder = (orderId) => {
    this.socket.emit("markToastieBarOrderCompleted", { orderId });
    // Complete number is incremented when confirmed by the server
  }

  handleToastieBarOrderCompleted = (data) => {
    const { orderId, completedTime } = data;
    const orderRecords = {...this.state.orderRecords};
    orderRecords[orderId].completedTime = completedTime;
    this.setState({ orderRecords, completed: this.state.completed + 1 });
  }

  // New Order Received
  handleNewOrder = (data) => {
    const { processedOrder } = data;
    const orderRecords = {...this.state.orderRecords};
    orderRecords[processedOrder.id] = processedOrder;
    // Update the records and play the notification sound
    this.setState({ orderRecords }, this.playNotificationSound);
  }
  
  playNotificationSound = () => {
    const audio = new Audio("/audio/notification_sound.mp3");
    audio.play();
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

    if(!this.state.initialDataLoaded) {
      return <LoadingHolder />
    }

    const { open, orderRecords } = this.state;

    return (
      <div className="flex flex-col">
        <div className="flex flex-col my-4 justify-center items-center md:w-3/5 md:mx-auto mx-2">
          <h1 className="font-semibold text-5xl pb-4">Live Toastie Bar Orders</h1>
          <div className="w-full mb-2 flex flex-row items-center">
            <p className="text-left font-semibold text-lg mr-2">Toastie Bar Status: { open ? "Open" : "Closed" }</p>
            <button
              onClick={this.toggleOpenForOrders}
              className={`px-4 py-1 rounded ${ open ? "bg-red-700" : "bg-green-700" } text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
            >{ open ? "Set Closed" : "Set Open" }</button>
          </div>
          <div className="w-full">
            <p>Orders will appear here automatically as they are placed. There are currently {Object.keys(this.state.orderRecords).length - this.state.completed} order(s) that need completing.</p>
            <div className="flex flex-col mt-2">
              {
                Object.keys(orderRecords).sort((a, b) => new Date(orderRecords[a].orderedAt) > new Date(orderRecords[b].orderedAt) ? 1 : -1).map(orderId => {
                  const order = orderRecords[orderId];

                  return (
                    <ToastieOrderRow 
                      key={order.id}
                      orderId={order.id}
                      customerName={order.customerName}
                      orderedAt={order.orderedAt}
                      additionalItems={order.additionalItems}
                      toasties={order.toasties}
                      milkshakes={order.milkshakes}
                      totalPrice={order.totalPrice}
                      completedTime={order.completedTime}
                      complete={() => this.completeOrder(order.id)}
                    />
                  )
                })
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default ToastieAdminLive;
