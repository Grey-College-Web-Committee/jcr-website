import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import BarDropdown from './BarDropdown';
import Cart from '../cart/Cart';

class BarOrderingPage extends React.Component {
  constructor(props) {
    super(props);

    this.cart = new Cart();
    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      baseDrinks: [],
      byType: {},
      hasScrolled: false,
      tableNumber: -1,
      tableNumberOpen: false
    };

    this.validTableNumbers = [...Array(15).keys()].map(i => i + 1);
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
    let membershipCheck;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status", isMember: false });
      return;
    }

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
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

    const { baseDrinks } = content.data;

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

    this.setState({ loaded: true, status: 200, baseDrinks, byType, tableNumber });
  }

  onChangeTableNumber = (e) => {
    const chosen = Number(e.target.value);
    localStorage.setItem("table_bar", chosen);
    this.setState({ tableNumber: chosen });
  }

  showChangeTableNumber = () => {
    if(!this.state.tableNumberOpen) {
      return null;
    }

    return (
      <div className="w-screen h-screen flex flex-row justify-center items-center fixed bg-grey-500 bg-opacity-25 top-0 left-0">
        <div className="flex flex-col w-max bg-white p-4 border-2 border-grey-900">
          <p className="mb-2 text-lg font-semibold">Select your table number</p>
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
                <option value={no}>Table #{no}</option>
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
    const confirmed = window.confirm("Are you sure you want to remove your table number and delete all your drinks?");

    if(!confirmed) {
      return;
    }

    e.preventDefault();

    localStorage.removeItem("table_bar");
    this.cart.get();
    this.cart.removeAllWithFilter(item => item.shop === "bar");

    this.setState({ tableNumber: -1 });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/membership" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    const { tableNumber } = this.state;

    return (
      <React.Fragment>
        {this.showChangeTableNumber()}
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-2">College Bar</h1>
            <div className="mb-2">
              <p className="text-2xl font-semibold"> {tableNumber === -1 ? "Set your table number" : `Your Table Number: ${tableNumber}`}</p>
              {tableNumber === -1 ? <p>You won't be able to add items to your cart until you set a table number.</p> : null}
              <div className="my-1 flex md:flex-row flex-col md:justify-center">
                <button
                  onClick={() => this.setState({ tableNumberOpen: true })}
                  className="mx-2 md:mb-0 mb-2 px-4 py-1 rounded bg-grey-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >{tableNumber === -1 ? "Set" : "Change"} Table Number</button>
                {tableNumber !== -1 ?
                  <button
                    onClick={this.removeTableNumber}
                    className="mx-2 px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  >Remove Table Number</button>
                : null}
              </div>
              <div>
                <p>Removing your table number will clear all of the drinks from your bag!</p>
                <p>You can change it without affecting your order however.</p>
              </div>
            </div>
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
        </div>
      </React.Fragment>
    );
  }
}

BarOrderingPage.contextType = authContext;

export default BarOrderingPage;
