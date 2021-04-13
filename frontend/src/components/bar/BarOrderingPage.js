import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import BarDropdown from './BarDropdown';
import BarCart from './BarCart';

class BarOrderingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      baseDrinks: [],
      byType: {},
      hasScrolled: false,
      tableNumber: -1,
      tableNumberOpen: false,
      id: Math.random(),
      placeOrderOpen: false,
      disabled: false,
      orderStatus: 0,
      lastOrderPrice: 0,
      orderError: null,
      open: false
    };

    this.barCart = new BarCart();
    this.validTableNumbers = [...Array(20).keys()].map(i => i + 1);
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  componentDidUpdate = () => {
    if(this.state.loaded) {
      this.scrollToLastPosition();
    }
  }

  scrollToLastPosition = () => {
    if(this.state.hasScrolled) {
      return;
    }

    this.setState({ hasScrolled: true });

    setTimeout(() => {
      window.requestAnimationFrame(() => {
        const y = localStorage.getItem("bar_scroll_position");
        window.scrollTo(0, y);
        localStorage.removeItem("bar_scroll_position");
      });
    });
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    try {
      await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status" });
      return;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/bar");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { baseDrinks, open } = content.data;

    // Now sort into types
    const byType = {};

    baseDrinks.forEach((base, i) => {
      const typeName = base.BarDrinkType.name;
      let inType = [];

      if(Object.keys(byType).includes(typeName)) {
        inType = byType[typeName];
      }

      inType.push(base);
      byType[typeName] = inType;
    });

    let tableNumber = -1;

    if(localStorage.getItem("table_bar") !== null) {
      tableNumber = Number(localStorage.getItem("table_bar"));
    }

    // TODO: Sort by type name

    window.addEventListener("focus", this.onFocus);
    this.barCart.registerCallbackOnSave(this.refreshBarOrder);
    this.setState({ loaded: true, status: 200, baseDrinks, byType, tableNumber, open });
  }

  componentWillUnmount = () => {
    window.removeEventListener("focus", this.onFocus);
  }

  onFocus = () => {
    this.refreshBarOrder();
  }

  onChangeTableNumber = (e) => {
    const chosen = Number(e.target.value);
    localStorage.setItem("table_bar", chosen);
    this.setState({ tableNumber: chosen, tableNumberOpen: false });
  }

  showChangeTableNumber = () => {
    if(!this.state.tableNumberOpen) {
      return null;
    }

    return (
      <div className="w-screen h-screen flex flex-row justify-center items-center fixed bg-grey-500 bg-opacity-75 top-0 left-0 z-10">
        <div className="flex flex-col w-max bg-white p-4 border-2 border-grey-900 text-lg">
          <p className="mb-2 text-2xl font-semibold">Select your table number</p>
          <select
            name="tableNumber"
            className="w-auto h-8 border border-gray-400 disabled:opacity-50"
            onChange={this.onChangeTableNumber}
            value={this.state.tableNumber}
            disabled={this.state.disabled}
          >
            <option disabled={true} hidden={true} value={-1}>Please choose an option...</option>
            {
              this.validTableNumbers.map(no => (
                <option value={no}>Table {no}</option>
              ))
            }
          </select>
          <button
            onClick={() => this.setState({ tableNumberOpen: false })}
            className="mt-2 px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >Close</button>
        </div>
      </div>
    )
  }

  removeTableNumber = (e) => {
    e.preventDefault();
    localStorage.removeItem("table_bar");
    this.setState({ tableNumber: -1 });
  }

  refreshBarOrder = () => {
    this.setState({ id: Math.random() });
  }

  showPlaceOrder = () => {
    if(!this.state.placeOrderOpen) {
      return null;
    }

    if(this.state.tableNumber === -1) {
      return null;
    }

    switch(this.state.orderStatus) {
      case 0:
        const { items } = this.barCart.get();
        let displayItems = [];
        let totalPrice = 0;

        items.forEach(item => {
          let perItemPrice = 0;

          let mixer = null;
          let size = null;

          let sizeComps = item.components.filter(comp => comp.submissionInformation.type === "size");

          if(sizeComps.length !== 0) {
            size = sizeComps[0].name;
            perItemPrice += sizeComps[0].price;
          }

          let mixerComps = item.components.filter(comp => comp.submissionInformation.type === "mixer");

          if(mixerComps.length !== 0) {
            mixer = mixerComps[0].name;
            perItemPrice += mixerComps[0].price;
          }

          displayItems.push({
            name: item.name,
            perItemPrice,
            quantity: item.quantity,
            mixer,
            size,
            hash: item.duplicateHash
          });

          totalPrice += perItemPrice * item.quantity;
        });

        return (
          <div className="w-screen h-full overflow-auto flex flex-row justify-center my-auto fixed bg-grey-500 bg-opacity-75 top-0 left-0 block z-10">
            <div className="flex flex-row justify-center text-lg overflow-y-auto overflow-x-hidden h-full">
              <div className="flex flex-col bg-white p-4 mx-2 md:mx-0 overflow-y-auto overflow-x-hidden md:w-96 w-full border-2 border-grey-900 h-auto my-auto">
              <h2 className="mb-2 text-2xl font-semibold">Confirm Order</h2>
              <p className="text-base">Your order will be sent to the bar and a member of staff will come to your table (Table {this.state.tableNumber}) to collect payment. The order will not be processed until payment is taken.</p>
              <div className="w-full">
                <button
                  onClick={this.placeOrder}
                  className="my-2 px-4 py-1 block rounded bg-grey-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={displayItems.length === 0 || this.state.disabled}
                >Confirm Order</button>
                <button
                  onClick={() => {
                    this.props.disableScroll(false);
                    this.setState({ placeOrderOpen: false });
                  }}
                  className="mb-2 px-4 py-1 rounded bg-red-900 text-sm text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Close</button>
              </div>
              <div className="text-base">
                <p className="font-semibold text-xl">Total: £{totalPrice.toFixed(2)}</p>
                <ul className="my-1">
                  {
                    displayItems.map((item, i) => (
                      <li key={i} className="border p-2 mt-2">
                        {item.quantity} x {item.name} (£{item.perItemPrice.toFixed(2)} each)
                        <ul>
                          {
                            item.mixer === null ? null : (<li>- {item.mixer}</li>)
                          }
                          {
                            item.size === null ? null : (<li>- {item.size}</li>)
                          }
                        </ul>
                      </li>
                    ))
                  }
                </ul>
              </div>
              {
                displayItems.length >= 4 ? (
                  <div className="w-full">
                    <button
                      onClick={this.placeOrder}
                      className="my-1 px-4 py-1 rounded bg-grey-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      disabled={displayItems.length === 0 || this.state.disabled}
                    >Confirm Order</button>
                  </div>
              ) : null }
              <div className="w-full">
                <button
                  onClick={() => {
                    this.props.disableScroll(false);
                    this.setState({ placeOrderOpen: false });
                  }}
                  className="mt-2 px-4 py-1 rounded bg-red-900 text-sm text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Close</button>
              </div>
            </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="w-screen h-screen flex flex-row justify-center items-center fixed bg-grey-500 bg-opacity-75 top-0 left-0 z-10">
            <div className="flex flex-col w-96 bg-white p-4 border-2 border-grey-900 text-lg">
              <h2 className="mb-2 text-2xl font-semibold">Processing...</h2>
              <LoadingHolder />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-screen h-screen flex flex-row justify-center items-center fixed bg-grey-500 bg-opacity-75 top-0 left-0 z-10">
            <div className="flex flex-col w-96 bg-white p-4 border-2 border-grey-900 text-lg">
              <h2 className="mb-2 text-2xl font-semibold">Order Confirmed</h2>
              <p>Your order has been confirmed and emailed to your Durham email address.</p>
              <p>A member of staff will come over soon to collect payment.</p>
              <p className="font-semibold">Total to pay: £{this.state.lastOrderPrice.toFixed(2)}</p>
              <button
                onClick={() => {
                  this.props.disableScroll(false);
                  this.setState({ placeOrderOpen: false, orderStatus: 0, disabled: false, lastOrderPrice: 0, orderError: null });
                }}
                className="mt-2 px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >Close</button>
            </div>
          </div>
        );
      default:
      case 999:
        return (
          <div className="w-screen h-screen flex flex-row justify-center items-center fixed bg-grey-500 bg-opacity-75 top-0 left-0 z-10">
            <div className="flex flex-col w-96 bg-white p-4 border-2 border-grey-900 text-lg">
              <h2 className="mb-2 text-2xl font-semibold">Error Occurred</h2>
              <p>{this.state.orderError}</p>
              <button
                onClick={() => {
                  this.props.disableScroll(false);
                  this.setState({ placeOrderOpen: false, orderStatus: 0, disabled: false, lastOrderPrice: 0, orderError: null });
                }}
                className="mt-2 px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >Close</button>
            </div>
          </div>
        );
    }
  }

  placeOrder = async () => {
    this.setState({ disabled: true, orderStatus: 1 });
    const { items } = this.barCart.get();

    let issue = false;

    let simplifiedOrder = items.map(item => {
      const { components } = item;

      const mixerComp = components.filter(comp => comp.submissionInformation.type === "mixer");
      const sizeComp = components.filter(comp => comp.submissionInformation.type === "size");

      let mixerId = null;
      let drinkId = null;

      if(mixerComp.length !== 0) {
        mixerId = mixerComp[0].submissionInformation.mixerId;
      }

      if(sizeComp.length === 0) {
        issue = true;
      } else {
        drinkId = sizeComp[0].submissionInformation.drinkId;
      }

      return {
        mixerId,
        drinkId,
        quantity: item.quantity
      }
    });

    if(issue) {
      alert("There was an issue with your cart. Please clear it and try again.");
      this.setState({ disabled: false, orderStatus: 0 });
      return;
    }

    if(simplifiedOrder.length === 0) {
      alert("There is nothing in your order");
      this.setState({ disabled: false, orderStatus: 0 });
      return;
    }

    const { tableNumber } = this.state;

    const submission = {
      tableNumber,
      items: simplifiedOrder
    };

    let result;

    try {
      result = await api.post("/bar/order", submission);
    } catch (error) {
      this.setState({ orderStatus: 999, orderError: error.response.data.error });
      return;
    }

    this.barCart.get();
    this.barCart.clearCart();
    this.setState({ orderStatus: 2, lastOrderPrice: result.data.totalPrice });
  }

  renderBarOrder = () => {
    const { items } = this.barCart.get();
    let displayItems = [];
    let totalPrice = 0;

    items.forEach(item => {
      let perItemPrice = 0;

      let mixer = null;
      let size = null;

      let sizeComps = item.components.filter(comp => comp.submissionInformation.type === "size");

      if(sizeComps.length !== 0) {
        size = sizeComps[0].name;
        perItemPrice += sizeComps[0].price;
      }

      let mixerComps = item.components.filter(comp => comp.submissionInformation.type === "mixer");

      if(mixerComps.length !== 0) {
        mixer = mixerComps[0].name;
        perItemPrice += mixerComps[0].price;
      }

      displayItems.push({
        name: item.name,
        perItemPrice,
        quantity: item.quantity,
        mixer,
        size,
        hash: item.duplicateHash
      });

      totalPrice += perItemPrice * item.quantity;
    });

    const belowButton = this.state.tableNumber !== -1 ?
      (
      <React.Fragment>
        <button
          className="px-4 py-1 rounded bg-grey-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          onClick={() => {
            this.props.disableScroll(true);
            this.setState({ placeOrderOpen: true })
          }}
          disabled={!this.state.open}
        >{ this.state.open ? "Place Order" : "Bar Is Closed" }</button>
        { this.state.open ? null : <p>You will need to refresh this page once the bar opens. Your order will not be lost!</p> }
      </React.Fragment>
      ) : (
        <p>You need to set your table number</p>
      );

    return (
      <div className="text-lg">
        <h2 className="text-2xl font-semibold">Your Order</h2>
        <p>Total: £{totalPrice.toFixed(2)}</p>
        <div className="mt-2 mb-2">
          { displayItems.length !== 0 ? belowButton : null }
        </div>
        <ul className="">
          {
            displayItems.map((item, i) => (
              <li key={i} className="border p-2 mt-2">
                {item.quantity} x {item.name} (£{item.perItemPrice.toFixed(2)} each)
                <ul className="mb-2">
                  {
                    item.mixer === null ? null : (<li>- {item.mixer}</li>)
                  }
                  {
                    item.size === null ? null : (<li>- {item.size}</li>)
                  }
                </ul>
                <div className="flex flex-row justify-between">
                  <button
                    className="px-4 py-1 rounded bg-grey-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-sm"
                    onClick={() => this.barCart.adjustQuantity(item.hash, 1)}
                  >Add 1</button>
                  <button
                    className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-sm"
                    onClick={() => this.barCart.adjustQuantity(item.hash, -1)}
                  >Remove 1</button>
                </div>
              </li>
            ))
          }
        </ul>
      </div>
    )
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

    const { tableNumber } = this.state;

    return (
      <React.Fragment>
        {this.showChangeTableNumber()}
        {this.showPlaceOrder()}
        <div className={`flex flex-col justify-start md:mx-10 ${this.state.placeOrderOpen || this.state.tableNumberOpen ? "overflow-hidden" : ""}`}>
          <div className="text-center p-4">
            <h1 className="font-semibold text-5xl pb-2">College Bar</h1>
          </div>
          <div className="flex flex-col-reverse md:flex-row">
            <div className="md:w-7/10 px-2 mx-2">
              {
                Object.keys(this.state.byType).map((typeName, i) => (
                  <BarDropdown
                    title={typeName}
                    groupItems={this.state.byType[typeName]}
                    key={i}
                    identifier={typeName}
                  />
                ))
              }
            </div>
            <div className="md:w-3/10 px-2 mx-2 md:mb-0 mb-2">
              <div className="mb-2">
                <h2 className="text-2xl font-semibold">{tableNumber === -1 ? "Set your table number" : `Your Table Number: ${tableNumber}`}</h2>
                {tableNumber === -1 ? <p>You won't be able to add items to your cart until you set a table number.</p> : null}
                <div className="my-2 flex md:flex-row flex-col md:justify-start">
                  <button
                    onClick={() => this.setState({ tableNumberOpen: true })}
                    className="md:mr-2 md:mb-0 mb-2 px-4 py-1 rounded bg-grey-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-lg"
                  >{tableNumber === -1 ? "Set" : "Change"} Table Number</button>
                  {tableNumber !== -1 ?
                    <button
                      onClick={this.removeTableNumber}
                      className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-lg"
                    >Remove Table Number</button>
                  : null}
                </div>
              </div>
              {this.renderBarOrder()}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

BarOrderingPage.contextType = authContext;

export default BarOrderingPage;
