import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import ImageRow from './ImageRow';

class StashImagesPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stockloaded: false,
      stockstatus: 0,
      stock: [],
      error: "",
      selectedItem: 1
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

      if(!adminCheck.data.user.permissions.includes("stash.stock.edit")) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    const stockloaded = await this.updateStockListing();
    this.setState({ stockloaded });
  }

  updateAll = async () => {
    this.updateSizeListing();
    this.updateStockListing();
  }

  // Just gets the data from the server
  updateStockListing = async () => {
    let query;

    try {
      query = await api.get("/stash/stock");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return false;
    }

    const stock = query.data.stock;

    this.setState({ status: query.status, stock });
    return true;
  }

  render () {
    if(!this.state.stockloaded) {
      if(this.state.sockstatus !== 200 && this.state.stockstatus !== 0) {
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
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Stash Images - Admin</h1>
          <div className="border-b-2 border-t-2 py-4">
            <h2 className="font-semibold text-3xl pb-4">Manage Existing Item Images</h2>
            <span className="block sm:hidden pb-4">Your screen is too small to display all columns</span>
            <table className="mx-auto border-2 text-left border-red-900">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Item</th>
                  <th className="p-2 font-semibold">Current Image(s)</th>
                  <th className="p-2 font-semibold">Add New</th>
                  <th className="p-2 font-semibold hidden sm:table-cell">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {this.state.stock.map((item, index) => (
                    <ImageRow
                      key={index} item={item} 
                    />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
}

export default StashImagesPage;