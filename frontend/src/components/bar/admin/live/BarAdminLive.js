import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import socketIOClient from 'socket.io-client';
import BarOrder from './BarOrder';

class BarAdminLive extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      activeOrders: {},
      completedOrders: {},
      refreshKey: new Date(),
      initialLoaded: false,
      showCompleted: false,
      openForOrders: false
    };

    // Change this to your permission
    this.requiredPermission = "bar.manage";
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
    this.socket = socketIOClient(`ws://${window.location.host}`);
    // Subscribes to the barOrderClients room so that we receive the events relating to orders
    this.socket.emit("subscribeToBarOrders", {});
    // This will occur when the server sends the initial backlog of orders
    this.socket.on("barInitialData", this.handleInitialData);
    // This will occur when someone updates a drink as complete
    this.socket.on("barContentCompleted", this.handleOrderContentCompleted);
    // This will occur when the server send a barNewOrder event
    this.socket.on("barNewOrder", this.handleNewOrder);
    // This will occur when someone updates an order as paided
    this.socket.on("barOrderPaid", this.handleOrderPaid);
    // This will occur when someone updates an order as completed
    this.socket.on("barOrderCompleted", this.handleOrderCompleted);
    // This will occur when someone updates if the bar is open for orders
    this.socket.on("barOpenChanged", this.handleBarOpenChanged)

    this.setState({ loaded: true });
  }

  handleBarOpenChanged = (data) => {
    const { open } = data;
    this.setState({ openForOrders: open });
  }

  handleOrderCompleted = (data) => {
    let { orderId } = data;
    let { activeOrders, completedOrders } = this.state;

    const filteredIdRecords = Object.keys(activeOrders).filter(id => id === `${orderId}`);

    if(filteredIdRecords.length === 0) {
      return;
    }

    const completedOrder = activeOrders[filteredIdRecords[0]];
    completedOrder.paid = true;

    delete activeOrders[`${orderId}`];
    completedOrders[`${orderId}`] = completedOrder;

    this.setState({ activeOrders, completedOrders, refreshKey: new Date() });
  }

  handleOrderContentCompleted = (data) => {
    let { orderId, contentId } = data;
    let { activeOrders } = this.state;

    if(Object.keys(activeOrders).includes(`${orderId}`)) {
      for(const i in activeOrders[`${orderId}`].contents) {
        const content = activeOrders[`${orderId}`].contents[i];
        if(content.id === contentId) {
          content.completed = true;
          break;
        }
      }
    }

    this.setState({ activeOrders, refreshKey: new Date() });
  }

  handleOrderPaid = (data) => {
    let { orderId } = data;
    let { activeOrders } = this.state;

    if(Object.keys(activeOrders).includes(`${orderId}`)) {
      activeOrders[`${orderId}`].paid = true;
    }

    this.setState({ activeOrders, refreshKey: new Date() });
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

  updateOrderCompleted = (orderId) => {
    // Called when the order is marked as completed so it can update all instances
    this.socket.emit("markBarOrderCompleted", { orderId });
  }

  updateContentCompleted = (orderId, contentId) => {
    // When someone marks a drink as complete we want to update it on all instances
    this.socket.emit("markBarContentComplete", { orderId, contentId });
  }

  updateOrderPaid = (orderId) => {
    // Called when the order is marked as paid so it can update all instances
    this.socket.emit("markBarOrderPaid", { orderId });
  }

  toggleOpenForOrders = () => {
    // Change the bar ordering to open or closed
    const newOpen = !this.state.openForOrders;
    this.socket.emit("setBarOpen", { open: newOpen });
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

    const { activeOrders, refreshKey, connected, showCompleted, completedOrders, openForOrders } = this.state;

    let knownKeys = Object.keys(activeOrders).map(key => {
      return {
        key,
        active: true
      }
    });

    if(showCompleted) {
      knownKeys = knownKeys.concat(Object.keys(completedOrders).map(key => {
        return {
          key,
          active: false
        }
      }));
    }
    // We want the oldest orders at the top
    let sortedKeys = Object.keys(knownKeys).map(k => knownKeys[k]).sort((a, b) => {
      const aDate = a.active ? new Date(activeOrders[Number(a.key)].orderedAt) : new Date(completedOrders[Number(a.key)].orderedAt);
      const bDate = b.active ? new Date(activeOrders[Number(b.key)].orderedAt) : new Date(completedOrders[Number(b.key)].orderedAt);

      return aDate < bDate ? -1 : (aDate > bDate ? 1 : 0);
    });

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Live Bar Orders</h1>
          <div className="flex flex-row items-center">
            {
              this.state.initialLoaded ? (
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
          <p className="text-left">Bar orders will appear here as they come in. The oldest orders will appear at the top of the page. You can mark individual drinks as completed as well as marking whole orders as paid and completed. If you mark a whole order it will be moved to the completed orders section to help track which orders are outstanding.</p>
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
            !this.state.initialLoaded ? <LoadingHolder /> : null
          }
          {
            this.state.initialLoaded && sortedKeys.length === 0 ? (
              <p className="font-semibold text-2xl py-2">No outstanding orders.</p>
            ) : null
          }
          {
            sortedKeys.map(record => (
              <BarOrder
                key={`${refreshKey}-${record.key}`}
                order={record.active ? activeOrders[record.key] : completedOrders[record.key]}
                updateContentCompleted={this.updateContentCompleted}
                updateOrderPaid={this.updateOrderPaid}
                updateOrderCompleted={this.updateOrderCompleted}
                completed={!record.active}
              />
            ))
          }
          <div>
          </div>
        </div>
      </div>
    );
  }
}
export default BarAdminLive;
