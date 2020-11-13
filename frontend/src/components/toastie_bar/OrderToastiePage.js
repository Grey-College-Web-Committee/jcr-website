import React from 'react';
import PropTypes from 'prop-types';
import api from '../../utils/axiosConfig.js';
import SelectBread from './SelectBread';
import SelectMany from './SelectMany';

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
      purchaseDisabled: false
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

  placeOrder = () => {
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
    }
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
  }
}

export default OrderToastiePage;
