import React from 'react';
import { Redirect } from 'react-router-dom';
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

  // Load the data once the element is ready
  componentDidMount = async () => {
    let adminCheck;

    try {
      adminCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify admin status" });
      return;
    }

    if(!adminCheck.data.admin) {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    const loaded = await this.updateStockListing();
    this.setState({ loaded });
  }

  // Just gets the data from the server
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
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <React.Fragment>
          <h1>Loading...</h1>
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
