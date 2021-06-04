import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

class ToastieBarOverview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
    };

    // Change this to your permission
    this.requiredPermission = "toastie.stock.edit";
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

    this.setState({ loaded: true });
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
          <h1 className="font-semibold text-5xl pb-4">Manage Toastie Bar</h1>
          <div className="flex flex-col items-start mb-4">
            <h2 className="font-semibold text-3xl pb-1">Live Orders</h2>
            <p className="pb-1">This page will show you orders as they come in so that they can be processed.</p>
            <p className="pb-1">You can also open and close the ordering from here.</p>
            <Link to="/toasties/live">
              <button
                className="px-4 py-1 rounded bg-grey-500 text-white md:w-80 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >View Live Orders</button>
            </Link>
          </div>
          <div className="flex flex-col items-start mb-4">
            <h2 className="font-semibold text-3xl pb-1">Edit Stock</h2>
            <p className="pb-1">This page will let you edit stock, changes prices and change the availability.</p>
            <Link to="/toasties/stock">
              <button
                className="px-4 py-1 rounded bg-grey-500 text-white md:w-80 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >Edit Stock</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default ToastieBarOverview;
