import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import ExistingStock from './ExistingStock';
import ExistingColours from './ExistingColours';
import AddStock from './AddStock';
import LoadingHolder from '../../common/LoadingHolder';

class StashStockPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stockloaded: false,
      stockstatus: 0,
      sizesloaded: false,
      sizesstatus: 0,
      coloursloaded: false,
      coloursstatus: 0,
      error: "",
      stock: [],
      sizes: [],
      colours: [],
      selectedColours: {},
      selectedItem: 1,
      stashPageText: "",
      stashPageOpen: false,
      disabled: false
    };
    this.itemColourChanged=this.itemColourChanged.bind(this);
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
    const sizesloaded = await this.updateSizeListing();
    const coloursloaded = await this.updateColoursListing();

    let stashInfoRes;

    try {
      stashInfoRes = await api.get("/stash/information");
    } catch (error) {
      this.setState({ status: 500, error: stashInfoRes.response.data.error });
    }

    this.setState({ stashPageOpen: stashInfoRes.data.open, stashPageText: stashInfoRes.data.message });

    this.setState({ stockloaded });
    this.setState({ sizesloaded });
    this.setState({ coloursloaded });
  }

  updateStashPageData = async () => {
    this.setState({ disabled: true });
    const { stashPageOpen, stashPageText } = this.state;

    try {
      await api.post("/stash/information", { open: stashPageOpen, message: stashPageText });
    } catch (error) {
      alert("Unable to update the information");
    }

    this.setState({ disabled: false });
    return;
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

  // Just gets the data from the server
  updateSizeListing = async () => {
    let query;

    try {
      query = await api.get("/stash/sizes");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return false;
    }

    const sizes = query.data.sizes;

    this.setState({ sizesstatus: query.status, sizes });
    return true;
  }

  // Just gets the data from the server
  updateColoursListing = async () => {
    let query;

    try {
      query = await api.get("/stash/stockColours");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return false;
    }

    const colours = query.data.colours;

    this.setState({ status: query.status, colours });
    this.createItemColoursSelection();
    return true;
  }

  getItemColours = async (productId=1) => {
    let query;

    try {
      query = await api.get(`/stash/itemColour/${productId}`);
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return false;
    }

    const itemColours = query.data.itemColours;
    var colourIdArray = [];
    for (var i=0; i<itemColours.length; i++){
      colourIdArray.push(itemColours[i].colourId);
    };
    let newObject = {};
    let length = this.state.colours.length;
    for (i=0; i<length; i++){
      const colourId = this.state.colours[i].id;
      const index = colourIdArray.indexOf(colourId);
      if (index > -1) { newObject[colourId]= true; }
      else { newObject[colourId]= false; };
    }

    this.setState({ selectedColours: newObject, selectedItem: productId });

  };

  createItemColoursSelection = async() =>{
    let newObject = {};
    let length = this.state.colours.length;
    for (var i=0; i<length; i++){
      const colourId = this.state.colours[i].id;
      newObject[colourId]= false;
    }
    this.setState({ selectedColours: newObject });
  }

  itemColourChanged(colourId){
    let newObject = {};
    newObject = this.state.selectedColours;

    if (this.state.selectedColours[colourId]){
      newObject[colourId] = false;
    }
    else{
      newObject[colourId] = true;
    }
    this.setState({ selectedColours: newObject })
  }

  render () {
    if(!this.state.stockloaded || !this.state.coloursloaded) {
      /*if(this.state.sockstatus !== 200 && this.state.stockstatus !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }*/

      return (
        <LoadingHolder />
      );
    }

    if(!this.state.sizes) {
      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Available Stash - Admin</h1>
          <div className="border-b-2 py-4">
            <h2 className="font-semibold text-3xl pb-4">Stash Information</h2>
            <div className="pt-2 pb-2 border-b-2">
              <label htmlFor="stashPageText" className="flex flex-row justify-start text-xl font-semibold">Stash Page Text</label>
              <textarea
                name="stashPageText"
                value={this.state.stashPageText}
                onChange={this.onInputChange}
                className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                maxLength={30000}
              />
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
              <label htmlFor="stashPageOpen" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">Stash Ordering Open</label>
              <div className="flex flex-col items-center justify-center ml-2">
                <input
                  type="checkbox"
                  name="stashPageOpen"
                  checked={this.state.stashPageOpen}
                  onChange={this.onInputChange}
                  className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.props.disabled}
                  autoComplete=""
                />
              </div>
            </div>
            <div className="pt-2 pb-2 border-b-2">
              <button
                className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.state.disabled}
                onClick={this.updateStashPageData}
              >Save Stash Information</button>
            </div>
          </div>
          <div className="border-b-2 border-t-2 py-4">
            <h2 className="font-semibold text-3xl pb-4">Manage Existing Items</h2>
            <span className="block lg:hidden pb-4">Your screen is too small to display all columns</span>
            <ExistingStock selectedColours={this.state.selectedColours} colours={this.state.colours} updateItemColours={this.getItemColours} updateAll={this.updateAll} stock={this.state.stock} sizes={this.state.sizes} />
            <p>You can view and change the uploaded images for each item on the <Link className="font-semibold text-red-900" to="/stash/images">Images Page</Link>.</p>
          </div>
          <div className="border-b-2 py-4">
            <h2 className="font-semibold text-3xl pb-4">Add New Item</h2>
            <AddStock
              updateStockListing={this.updateStockListing}
              updateSizeListing={this.updateSizeListing}
              colours={this.state.colours}
              selectedColours={this.state.selectedColours} />
          </div>
          <div className="border-b-2 py-4">
            <h2 className="font-semibold text-3xl pb-4">Manage Available Colours</h2>
            <ExistingColours selectedColours={this.state.selectedColours} itemColourChanged={this.itemColourChanged.bind(this)} colours={this.state.colours} updateColoursListing={this.updateColoursListing} />
          </div>
        </div>
      </div>
    )
  }
}

export default StashStockPage;
