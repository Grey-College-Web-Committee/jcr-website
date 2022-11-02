import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import { ToastieNewBasicStockRow } from './ToastieNewBasicStockRow';
import { ToastieBasicStockRow } from './ToastieBasicStockRow';

class ToastieAdminStock extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",

      additionalStock: [], 
      breads: [], 
      fillings: [], 
      milkshakes: [], 
      specials: []
    };

    // Change this to your permission
    this.requiredPermission = "toasties.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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

    // Ensure they are an admin
    if(adminCheck.data.user.permissions) {
      if(adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if(!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    // Load any required data for the page here
    let result;

    try {
        result = await api.get("/toastie/stock");
    } catch (error) {
        this.setState({ loaded: false, status: error.response.status });
        return;
    }

    const { additionalStock, breads, fillings, milkshakes, specials } = result.data;

    this.setState({ loaded: true, additionalStock, breads, fillings, milkshakes, specials });
  }

  onNewBreadRow = (record) => {
    const copiedBreads = [...this.state.breads];
    copiedBreads.push(record);
    this.setState({ breads: copiedBreads })
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

    const { additionalStock, breads, fillings, milkshakes, specials } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Manage Toastie Bar Stock</h1>
          <div className="flex flex-col">
            <div className="border border-red-900 p-2 flex flex-col items-start">
              <h2 className="text-3xl font-semibold">Toastie Customisation</h2>
              <h3 className="text-2xl font-semibold">Bread</h3>
              <table className="w-full border border-red-900 border-collapse">
                <thead className="bg-red-900 text-white">
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Price (£)</th>
                  <th className="p-2 font-semibold">Available</th>
                  <th className="p-2 font-semibold">Last Edited</th>
                  <th className="p-2 font-semibold">Save Changes</th>
                  <th className="p-2 font-semibold">Permanently Delete</th>
                </thead>
                <tbody>
                  {
                    breads.map(bread => 
                      <ToastieBasicStockRow 
                        key={bread.id}
                        type="bread"
                        id={bread.id}
                        name={bread.name}
                        pricePerUnit={bread.pricePerUnit}
                        available={bread.available}
                        updatedAt={bread.updatedAt}
                      />
                    )
                  }
                  <ToastieNewBasicStockRow 
                    type="bread"
                    onRowAdded={this.onNewBreadRow} 
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ToastieAdminStock;
