import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import { IconContext  } from 'react-icons';
import { MdOutlineInventory2, MdComputer } from 'react-icons/md';

class ToastieAdminPortal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
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
          <h1 className="font-semibold text-5xl pb-4">Toastie Bar Admin</h1>
          <IconContext.Provider value={{ className: "w-24 h-24" }}>
            <div className="flex flex-col">
              <div className="border border-red-900 p-2 flex flex-row mb-4">
                <MdComputer />
                <div className="ml-1 flex flex-row justify-between items-center w-full">
                  <div className="flex flex-col items-start justify-start h-full p-1">
                    <h2 className="font-semibold text-3xl">View Live Orders</h2>
                    <p>From the live orders page you can see orders they are placed and mark them completed once they are ready.</p>
                    <p>You can also open and close ordering from this page and will receive audio pings when new orders arrive.</p>
                  </div>
                  <Link to="/toasties/admin/live">
                    <button
                      className="border px-4 py-2 text-2xl bg-grey-500 text-white rounded-md w-48"
                    >Open Orders</button>
                  </Link>
                </div>
              </div>
              <div className="border border-red-900 p-2 flex flex-row mb-4">
                <MdOutlineInventory2 />
                <div className="ml-1 flex flex-row justify-between items-center w-full">
                  <div className="flex flex-col items-start justify-start h-full p-1">
                    <h2 className="font-semibold text-3xl">Manage Stock</h2>
                    <p>From the stock management page you have complete control over bread options, fillings, specials, milkshakes, and any additional items.</p>
                    <p>You can toggle their availability, setup time-limited specials, add new items, and delete existing items.</p>
                  </div>
                  <Link to="/toasties/admin/stock">
                    <button
                      className="border px-4 py-2 text-2xl bg-grey-500 text-white rounded-md w-48"
                    >Open Stock</button>
                  </Link>
                </div>
              </div>
              {/* {<div className="border border-red-900 p-2 flex flex-row">
                <MdDataExploration />
                <div className="ml-1 flex flex-row justify-between items-center w-full">
                  <div className="flex flex-col items-start justify-start h-full p-1">
                    <h2 className="font-semibold text-3xl">View Statistics</h2>
                    <p>From the statistics page you can see how well different items are performing.</p>
                    <p>You can also see basic customer information such as year group performance.</p>
                  </div>
                  <Link to="/toasties/admin/stock">
                    <button
                      className="border px-4 py-2 text-2xl bg-grey-500 text-white rounded-md w-48"
                    >Open Statistics</button>
                  </Link>
                </div>
              </div>} */}
            </div>
          </IconContext.Provider>
        </div>
      </div>
    );
  }
}

export default ToastieAdminPortal;
