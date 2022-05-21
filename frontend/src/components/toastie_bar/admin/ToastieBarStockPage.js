import React from 'react';
import { Redirect, Link } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import ExistingStock from './ExistingStock';
import AddStock from './AddStock';
import LoadingHolder from '../../common/LoadingHolder';

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

    if(adminCheck.data.user.permissions) {
      if(adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if(!adminCheck.data.user.permissions.includes("toastie.stock.edit")) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
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
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Toastie Bar Stock</h1>
          <div className="border-b-2 border-t-2 py-4">
            <h2 className="font-semibold text-3xl pb-4">Manage Existing Items</h2>
            <p className="pb-4 text-semibold">Note: the toastie bar must be closed to delete items</p>
            <p className="block sm:hidden pb-4">Your screen is too small to display all columns</p>
            <ExistingStock stock={this.state.stock} />
          </div>
          <p>You can view and change the uploaded images for each item on the <Link className="font-semibold text-red-900" to="/toasties/images">Images Page</Link>.</p>
          <div className="border-b-2 py-4">
            <h2 className="font-semibold text-3xl pb-4">Add New Items</h2>
            <AddStock updateStockListing={this.updateStockListing} />
          </div>
        </div>
      </div>
    )
  }
}

export default ToastieBarStockPage;
