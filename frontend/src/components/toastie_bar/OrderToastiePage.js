import React from 'react';
import PropTypes from 'prop-types';
import api from '../../utils/axiosConfig.js';
import SelectBread from './SelectBread';
import SelectMany from './SelectMany';
import CheckoutForm from '../payment/CheckoutForm';
import authContext from '../../utils/authContext.js';

class OrderToastiePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      status: 0,
      error: "",
      stock: [],
      choices: [],
      otherItems: [],
      bread: -1,
      cost: 0,
      purchaseDisabled: false,
      confirmed: false,
      confirmedOrder: {},
      realCost: 0,
      clientSecret: "",
      paymentSuccessful: false
    };
  }

  componentDidMount = async () => {
    // Once the component is ready we can query the API
    const loaded = await this.updateStockListing();
    this.setState({ loaded });
  }

  updateStockListing = async () => {
    let query;

    // Standard way to just get the data from the API
    try {
      query = await api.get("/toastie_bar/stock");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return false;
    }

    const stock = query.data.stock;

    this.setState({ status: query.status, stock });
    return true;
  }

  // These 3 are used by the child components to share their choices with the parent
  passUpFillings = (choices) => {
    this.setState({ choices }, this.calculateCost);
  }

  passUpBread = (bread) => {
    this.setState({ bread: Number(bread) }, this.calculateCost);
  }

  passUpOtherItems = (otherItems) => {
    this.setState({ otherItems }, this.calculateCost);
  }

  // Just runs through and calculates the cost
  // converts strings to ints so we can get a sensible value
  calculateCost = () => {
    let cost = 0;

    if(this.state.bread !== -1) {
      cost += Number(this.state.stock.find(item => item.id === this.state.bread).price);
    }

    const selectedFillings = this.state.stock.filter(item => this.state.choices.includes(item.id));

    selectedFillings.forEach(item => {
      cost += Number(item.price);
    });

    const selectedOtherItems = this.state.stock.filter(item => this.state.otherItems.includes(item.id));

    selectedOtherItems.forEach(item => {
      cost += Number(item.price);
    });

    cost = Math.round(cost * 100) / 100;

    this.setState({ cost });
  }

  placeOrder = async () => {
    // Don't want them resubmitting while we are handling one already
    this.setState({ purchaseDisabled: true });

    // Ordering a toastie
    if(this.state.bread !== -1) {
      // No fillings isn't allowed
      if(this.state.choices.length === 0) {
        alert("You must select some fillings for your toastie.");
        this.setState({ purchaseDisabled: false });
        return;
      }
    } else {
      // They didn't order anything
      if(this.state.otherItems.length === 0) {
        alert("You must order something.");
        this.setState({ purchaseDisabled: false });
        return;
      }

      // Only fillings and other items isn't allowed either
      if(this.state.choices.length !== 0) {
        alert("You cannot just order fillings. Please select a bread type.");
        this.setState({ purchaseDisabled: false });
        return;
      }
    }

    const orderDetails = {
      bread: this.state.bread,
      fillings: this.state.choices,
      otherItems: this.state.otherItems
    };

    let query;

    // Get the server to check everything and give us the details for the Stripe checkout
    try {
      query = await api.post("/toastie_bar/order", orderDetails);
    } catch (error) {
      alert("Your order has not been placed. Some items may have gone out of stock. Please refresh the page and try again.");
      return;
    }

    // We can now show the payment area
    this.setState({
      confirmed: true,
      confirmedOrder: query.data.confirmedOrder,
      realCost: query.data.realCost,
      clientSecret: query.data.clientSecret
    });
  }

  // Used by the CheckoutForm to make changes to the page's state
  onPaymentSuccess = () => {
    this.setState({ paymentSuccessful: true });
  }

  displayToastieOrder = () => {
    const items = this.state.confirmedOrder.filter(item => item.type === "filling" || item.type === "bread");

    if(items.length === 0) {
      return (
        <strong>None selected</strong>
      );
    }

    return (
      <table class="fillingTable">
        <thead>
          <tr>
            <th>Item</th><th>Price (£)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  displayOtherItemsOrder = () => {
    const otherItems = this.state.confirmedOrder.filter(item => item.type === "other");

    if(otherItems.length === 0) {
      return (
        <strong>None selected</strong>
      );
    }

    return (
      <table class="fillingTable">
        <thead>
          <tr>
            <th>Item</th><th>Price (£)</th>
          </tr>
        </thead>
        <tbody>
          {otherItems.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  render () {
    // Still waiting for data from the API
    if(!this.state.loaded) {
      return (
        <React.Fragment>
          <h1>Loading...</h1>
        </React.Fragment>
      );
    }

    // Error occurred should probably handle this better when I get the chance
    if(this.state.status !== 200) {
      return (
        <React.Fragment>
          <h1>Non-200 Status {this.state.status}</h1>
        </React.Fragment>
      );
    }

    // Once they have paid we can hide everything else
    if(this.state.paymentSuccessful) {
      return (
        <React.Fragment>
          <h1>Payment Success!</h1>
          <p>Your order is now being processed. Please come and collect it in 15 minutes!</p>
          <h2>Toastie</h2>
          {this.displayToastieOrder()}
          <h2>Other Items</h2>
          {this.displayOtherItemsOrder()}
          <p>A receipt has been emailed to {this.context.email}</p>
        </React.Fragment>
      )
    }

    // They are still constructing their order at this point
    if(!this.state.confirmed) {
      return (
        <React.Fragment>
          <h1>Order Toastie</h1>
          <h2>Bread</h2>
          <p>Select one type of bread. Unselectable items are out of stock.</p>
          <SelectBread
            stock={this.state.stock}
            passUp={this.passUpBread}
            disabled={this.state.purchaseDisabled}
          />
          <h2>Fillings</h2>
          <SelectMany
            stock={this.state.stock}
            passUp={this.passUpFillings}
            type="filling"
            disabled={this.state.purchaseDisabled}
          />
          <h2>Other Items</h2>
          <SelectMany
            stock={this.state.stock}
            passUp={this.passUpOtherItems}
            type="other"
            disabled={this.state.purchaseDisabled}
          />
          <h2>Checkout</h2>
          <h3>Total £{this.state.cost.toFixed(2)}</h3>
          <button
            onClick={this.placeOrder}
            disabled={this.state.purchaseDisabled}
          >Place Order</button>
        </React.Fragment>
      )
    } else {
      // They are ready to purchase the toastie
      return (
        <React.Fragment>
          <h1>Purchase Toastie</h1>
          <h2>Confirmed Order</h2>
          <h3>Toastie</h3>
          {this.displayToastieOrder()}
          <h3>Other Items</h3>
          {this.displayOtherItemsOrder()}
          <h2>Price: £{this.state.realCost.toFixed(2)}</h2>
          <CheckoutForm
            clientSecret={this.state.clientSecret}
            onSuccess={this.onPaymentSuccess}
          />
        </React.Fragment>
      )
    }
  }
}

OrderToastiePage.contextType = authContext;

export default OrderToastiePage;
