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
      selectedItem: 1
    };
    this.itemColourChanged=this.itemColourChanged.bind(this);
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
    this.setState({ stockloaded });
    this.setState({ sizesloaded });
    this.setState({ coloursloaded });
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Available Stash - Admin</h1>
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
