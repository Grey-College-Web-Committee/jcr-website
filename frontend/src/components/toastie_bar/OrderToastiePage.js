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
      stock: []
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
        <SelectBread stock={this.state.stock} />
        <h2>Fillings</h2>
        <SelectFillings stock={this.state.stock} />
        <h2>Checkout</h2>
      </React.Fragment>
    )
  }
}

export default OrderToastiePage;
