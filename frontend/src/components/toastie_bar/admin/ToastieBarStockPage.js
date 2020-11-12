import React from 'react';
import api from '../../../utils/axiosConfig';
import ExistingStock from './ExistingStock';
import AddStock from './AddStock';

class ToastieBarStockPage extends React.Component {
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
        <h1>Toastie Bar Stock</h1>
        <h2>Manage Existing Items</h2>
        <ExistingStock stock={this.state.stock} />
        <h2>Add New Items</h2>
        <AddStock updateStockListing={this.updateStockListing} />
      </React.Fragment>
    )
  }
}

export default ToastieBarStockPage;
