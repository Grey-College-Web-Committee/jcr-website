import React from 'react';
import PropTypes from 'prop-types';
import api from '../../utils/axiosConfig.js';
import SelectBread from './SelectBread';
import SelectMany from './SelectMany';
import CheckoutForm from './CheckoutForm';

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
    const loaded = await this.updateStockListing();
    this.setState({ loaded });
  }

  updateStockListing = async () => {
    let query;

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

  passUpFillings = (choices) => {
    this.setState({ choices }, this.calculateCost);
  }

  passUpBread = (bread) => {
    this.setState({ bread: Number(bread) }, this.calculateCost);
  }

  passUpOtherItems = (otherItems) => {
    this.setState({ otherItems }, this.calculateCost);
  }

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
    this.setState({ purchaseDisabled: true });

    // Ordering a toastie
    if(this.state.bread !== -1) {
      if(this.state.choices.length === 0) {
        alert("You must select some fillings for your toastie.");
        this.setState({ purchaseDisabled: false });
        return;
      }
    } else {
      if(this.state.otherItems.length === 0) {
        alert("You must order something.");
        this.setState({ purchaseDisabled: false });
        return;
      }

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

    console.log(JSON.stringify(orderDetails));
    let query;

    try {
      query = await api.post("/toastie_bar/order", orderDetails);
    } catch (error) {
      console.log(error);
      //handle this
      return;
    }

    this.setState({
      confirmed: true,
      confirmedOrder: query.data.confirmedOrder,
      realCost: query.data.realCost,
      clientSecret: query.data.clientSecret
    });
  }

  onPaymentSuccess = () => {
    this.setState({ paymentSuccessful: true });
  }

  render () {
    if(!this.state.loaded) {
      return (
        <React.Fragment>
          <h1>Loading...</h1>
        </React.Fragment>
      );
    }

    if(this.state.status !== 200) {
      return (
        <React.Fragment>
          <h1>Non-200 Status {this.state.status}</h1>
        </React.Fragment>
      );
    }

    if(this.state.paymentSuccessful) {
      return (
        <React.Fragment>
          <h1>Payment Success!</h1>
          <p>Your order is now being processed. Please come and collect it in 15 minutes!</p>
          <p>Display the order here</p>
          <p>A receipt has been emailed to your Durham email probably print it here</p>
        </React.Fragment>
      )
    }

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
      return (
        <React.Fragment>
          <h1>Purchase Toastie</h1>
          <h2>Confirmed Order</h2>
          <pre>
            {JSON.stringify(this.state.confirmedOrder, null, 2)}
          </pre>
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

export default OrderToastiePage;
