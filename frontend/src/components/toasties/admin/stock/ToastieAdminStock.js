import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import { ToastieNewBasicStockRow } from './ToastieNewBasicStockRow';
import { ToastieBasicStockRow } from './ToastieBasicStockRow';
import { ToastieAdditionalStockRow } from './ToastieAdditionalStockRow';
import { ToastieNewAdditionalStockRow } from './ToastieNewAdditionalStockRow';
import { ToastieSpecialRow } from './ToastieSpecialRow';
import { ToastieSpecialCreator } from './ToastieSpecialCreator';

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
      specials: [],

      additionalTypes: [],
      newTypeName: "",

      showSpecialCreator: false
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
      result = await api.get("/toastie/stock/admin");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let typeResult;

    try {
      typeResult = await api.get("/toastie/additional/types");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { additionalStock, breads, fillings, milkshakes, specials } = result.data;
    const { types } = typeResult.data;

    this.setState({ loaded: true, additionalStock, breads, fillings, milkshakes, specials, additionalTypes: types });
  }

  onNewBreadRow = (record) => {
    const copiedBreads = [...this.state.breads];
    copiedBreads.push(record);
    this.setState({ breads: copiedBreads })
  }

  renderBreadSection = () => {
    return (
      <div className="flex flex-col w-full items-start">
        <h3 className="text-2xl font-semibold mb-2">Bread</h3>
        <table className="w-full border border-red-900 border-collapse">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Price (£)</th>
              <th className="p-2 font-semibold">Available</th>
              <th className="p-2 font-semibold">Last Edited</th>
              <th className="p-2 font-semibold">Save Changes</th>
              <th className="p-2 font-semibold">Permanently Delete</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.breads.sort((a, b) => a.name > b.name ? 1: -1).map(bread => 
                <ToastieBasicStockRow 
                  key={bread.id}
                  url="bread"
                  id={bread.id}
                  name={bread.name}
                  pricePerUnit={bread.pricePerUnit}
                  available={bread.available}
                  updatedAt={bread.updatedAt}
                />
              )
            }
            <ToastieNewBasicStockRow 
              url="bread"
              onRowAdded={this.onNewBreadRow} 
            />
          </tbody>
        </table>
      </div>
    )
  }

  onNewFillingRow = (record) => {
    const copiedFillings = [...this.state.fillings];
    copiedFillings.push(record);
    this.setState({ fillings: copiedFillings })
  }

  renderFillingSection = () => {
    return (
      <div className="flex flex-col mt-4 w-full items-start">
        <h3 className="text-2xl font-semibold mb-2">Fillings</h3>
        <table className="w-full border border-red-900 border-collapse">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Price (£)</th>
              <th className="p-2 font-semibold">Available</th>
              <th className="p-2 font-semibold">Last Edited</th>
              <th className="p-2 font-semibold">Save Changes</th>
              <th className="p-2 font-semibold">Permanently Delete</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.fillings.sort((a, b) => a.name > b.name ? 1: -1).map(filling => 
                <ToastieBasicStockRow 
                  key={filling.id}
                  url="filling"
                  id={filling.id}
                  name={filling.name}
                  pricePerUnit={filling.pricePerUnit}
                  available={filling.available}
                  updatedAt={filling.updatedAt}
                />
              )
            }
            <ToastieNewBasicStockRow 
              url="filling"
              onRowAdded={this.onNewFillingRow} 
            />
          </tbody>
        </table>
      </div>
    )
  }

  onNewMilkshakeRow = (record) => {
    const copiedMilkshakes = [...this.state.milkshakes];
    copiedMilkshakes.push(record);
    this.setState({ milkshakes: copiedMilkshakes })
  }

  renderMilkshakeSection = () => {
    return (
      <div className="flex flex-col w-full items-start">
        <h3 className="text-2xl font-semibold mb-2">Milkshakes</h3>
        <table className="w-full border border-red-900 border-collapse">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Price (£)</th>
              <th className="p-2 font-semibold">Available</th>
              <th className="p-2 font-semibold">Last Edited</th>
              <th className="p-2 font-semibold">Save Changes</th>
              <th className="p-2 font-semibold">Permanently Delete</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.milkshakes.sort((a, b) => a.name > b.name ? 1: -1).map(milkshake => 
                <ToastieBasicStockRow 
                  key={milkshake.id}
                  url="milkshake"
                  id={milkshake.id}
                  name={milkshake.name}
                  pricePerUnit={milkshake.pricePerUnit}
                  available={milkshake.available}
                  updatedAt={milkshake.updatedAt}
                />
              )
            }
            <ToastieNewBasicStockRow 
              url="milkshake"
              onRowAdded={this.onNewMilkshakeRow} 
            />
          </tbody>
        </table>
      </div>
    )
  }

  onNewAdditionalRow = (record, type) => {
    const copiedAdditionals = {...this.state.additionalStock};
    copiedAdditionals[type.name].push(record);
    this.setState({ additionalStock: copiedAdditionals })
  }

  createNewType = async () => {
    this.setState({ newTypeDisabled: true });

    if(this.state.newTypeName.length === 0) {
      alert("Invalid input");
      this.setState({ newTypeDisabled: false });
      return;
    }

    let result;

    try {
      result = await api.post("/toastie/additional/type/create", { name: this.state.newTypeName });
    } catch (error) {
      alert("There was an error adding the new type");
      return;
    }

    const copiedAdditionals = {...this.state.additionalStock}
    copiedAdditionals[result.data.record.name] = [];

    const copiedAdditionalTypes = [...this.state.additionalTypes]
    copiedAdditionalTypes.push(result.data.record);
    this.setState({ additionalTypes: copiedAdditionalTypes, additionalStock: copiedAdditionals, newTypeDisabled: false, newTypeName: "" });
  }

  renderAdditionalSection = () => {
    return (
      <div className="flex flex-col mt-4 w-full items-start">
        <h3 className="text-2xl font-semibold mb-2">Additional Items</h3>
        <div className="flex flex-col border p-2 mb-2 w-full items-start">
          <h4 className="text-xl font-semibold mb-1">Create Additional Item Type</h4>
          <div className="flex flex-row w-full items-center">
            <span>Type Name:</span>
            <input
              type="text"
              className="mx-2 py-1 px-2 border disabled:opacity-25"
              name="newTypeName"
              value={this.state.newTypeName} 
              maxLength={255}
              onChange={this.onInputChange}
            />
            <button
              disabled={this.state.newTypeDisabled || this.state.newTypeName.length === 0}
              className="w-48 bg-green-900 text-white px-2 py-1 rounded-sm disabled:opacity-25"
              onClick={this.createNewType}
            >Create New Type</button>
          </div>
        </div> 
        <table className="w-full border border-red-900 border-collapse">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Type</th>
              <th className="p-2 font-semibold">Price (£)</th>
              <th className="p-2 font-semibold">Available</th>
              <th className="p-2 font-semibold">Last Edited</th>
              <th className="p-2 font-semibold">Save Changes</th>
              <th className="p-2 font-semibold">Permanently Delete</th>
            </tr>
          </thead>
          <tbody>
            {
              Object.keys(this.state.additionalStock).sort((a, b) => a.name > b.name ? 1: -1).map((additionalType, i) => 
                this.state.additionalStock[additionalType].sort((a, b) => a.name > b.name ? 1: -1).map(additional => (
                  <ToastieAdditionalStockRow 
                    key={additional.id}
                    id={additional.id}
                    name={additional.name}
                    typeId={additional.typeId}
                    pricePerUnit={additional.pricePerUnit}
                    available={additional.available}
                    updatedAt={additional.updatedAt}
                    allTypes={this.state.additionalTypes}
                  />
                ))
              )
            }
            <ToastieNewAdditionalStockRow
              onRowAdded={this.onNewAdditionalRow} 
              allTypes={this.state.additionalTypes}
            />
          </tbody>
        </table>
      </div>
    )
  }

  onNewSpecialCreated = (record, fillings, available) => {
    const copiedSpecials = [...this.state.specials];
    copiedSpecials.push({
      ...record,
      fillings,
      available
    });

    this.setState({ specials: copiedSpecials }, () => console.log(this.state.specials))
  }

  renderSpecialSection = () => {
    return (
      <div className="flex flex-col w-full items-start mt-4">
        <h3 className="text-2xl font-semibold mb-2">Specials</h3>
        <button
          className="bg-grey-500 text-white px-2 py-1 rounded-sm disabled:opacity-25 mb-2"
          onClick={() => this.setState({ showSpecialCreator: true })}
          disabled={this.state.showSpecialCreator}
        >Open Special Creator</button>
        <table className="w-full border border-red-900 border-collapse">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Description</th>
              <th className="p-2 font-semibold">Fillings</th>
              <th className="p-2 font-semibold">Start Date</th>
              <th className="p-2 font-semibold">End Date</th>
              <th className="p-2 font-semibold">Price (£)</th>
              <th className="p-2 font-semibold">Available</th>
              <th className="p-2 font-semibold">Last Edited</th>
              <th className="p-2 font-semibold">Save Changes</th>
              <th className="p-2 font-semibold">Permanently Delete</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.specials.sort((a, b) => new Date(a.startDate) > new Date(b.startDate) ? 1: -1).map(special => 
                <ToastieSpecialRow 
                  key={special.id}
                  url="special"
                  id={special.id}
                  name={special.name}
                  description={special.description}
                  fillings={special.fillings}
                  available={special.available}
                  startDate={special.startDate}
                  endDate={special.endDate}
                  priceWithoutBread={special.priceWithoutBread}
                  updatedAt={special.updatedAt}
                />
              )
            }
          </tbody>
        </table>
      </div>
    )
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
        { 
          this.state.showSpecialCreator ? 
            <ToastieSpecialCreator 
              fillingsList={this.state.fillings}
              onNewSpecialCreated={this.onNewSpecialCreated}
              hide={() => this.setState({ showSpecialCreator: false })}
            /> 
          : null 
        }
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Manage Toastie Bar Stock</h1>
          <div className="flex flex-col">
            <div className="border border-red-900 p-2 flex flex-col items-start mb-4">
              <h2 className="text-3xl font-semibold mb-2">Toasties</h2>
              { this.renderBreadSection() }
              { this.renderFillingSection() }
              { this.renderSpecialSection() }
            </div>
            <div className="border border-red-900 p-2 flex flex-col items-start">
              <h2 className="text-3xl font-semibold mb-2">Other Items</h2>
              { this.renderMilkshakeSection() }
              { this.renderAdditionalSection() }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ToastieAdminStock;
