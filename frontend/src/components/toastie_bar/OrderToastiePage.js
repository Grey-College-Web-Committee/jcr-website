import React from 'react';
import PropTypes from 'prop-types';
import api from '../../utils/axiosConfig.js';
import SelectBread from './SelectBread';
import SelectFillings from './SelectFillings';

class OrderToastiePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      status: 0,
      error: "",
      stock: [],
      choices: [],
      bread: -1,
      cost: 0
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

  calculateCost = () => {
    let cost = 0;

    if(this.state.bread !== -1) {
      cost += Number(this.state.stock.find(item => item.id === this.state.bread).price);
    }

    const selectedFillings = this.state.stock.filter(item => this.state.choices.includes(item.id));

    selectedFillings.forEach(item => {
      cost += Number(item.price);
    });

    this.setState({ cost });
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
        <p>Select one type of bread</p>
        <SelectBread
          stock={this.state.stock}
          passUp={this.passUpBread}
        />
        <h2>Fillings</h2>
        <SelectFillings
          stock={this.state.stock}
          passUp={this.passUpFillings}
        />
        <h2>Checkout</h2>
        <h3>Total £{this.state.cost}</h3>
      </React.Fragment>
    )
  }
}

export default OrderToastiePage;
