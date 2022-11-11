import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import GroupDropdown from './GroupDropdown';

class ToastieOrder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      user: {},
      loaded: false,
      status: 0,
      error: "",
      stock: [],
      idMatchedStock: {},
      open: false,
      refreshId: Math.random(),
      extras: [],
      orderedExtras: {},
      toastie: {
        bread: -1,
        fillings: []
      },
      milkshakes: [],
      specials: [],
      validEmail: false,
      email: "",
      name: ""
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;
    let isMember;
    let user = {};

    try {
      membershipCheck = await api.get("/auth/verify");
      if (membershipCheck.data.user.permissions.includes("jcr.member")) {
        isMember = true
        user = membershipCheck.data.user
      } else {
        isMember = false
      }
    } catch (error) {
      isMember = false
    }

    // Once the component is ready we can query the API
    let content;
    let open;

    try {
      open = await api.get("/toastie/status");
      content = await api.get("/toastie/stock");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let stock = [];
    const types = { "breads": "bread", "fillings": "filling", "milkshakes": "milkshake", "specials": "special" };
    let extras = []

    for (let key in content.data) {
      if (key === "additionalStock") {
        for (let type in content.data[key]) {
          extras.push(type)
          this.state.orderedExtras[type] = []
          content.data[key][type].forEach(item => {
            item.type = type
            stock.push(item)
          })
        }
      } else {
        content.data[key].forEach(item => {
          item.type = types[key]
          if (item.type === "special") item.pricePerUnit = item.priceWithoutBread
          stock.push(item)
        })
      }
    }

    const idMatchedStock = stock.reduce((map, obj) => {
      map[`${obj.id}-${obj.type}`] = obj;
      return map;
    }, {});

    this.setState({ loaded: true, status: 200, stock, open, isMember, idMatchedStock, user, extras });
  }

  // Set the bread on the toastie
  updateBread = (bread) => {
    let { toastie } = this.state;

    if (bread.length === 0) {
      toastie.bread = -1;
    } else {
      toastie.bread = bread[0];
    }

    this.setState({ toastie })
  }

  // Update the fillings
  updateFillings = (fillings) => {
    let { toastie } = this.state;
    toastie.fillings = fillings;
    this.setState({ toastie });
  }

  // Update milkshakes
  updateMilkshakes = (milkshakes) => {
    this.setState({ milkshakes })
  }

  // Update milkshakes
  updateSpecials = (specials) => {
    this.setState({ specials })
  }

  // Update extras
  updateExtras = (extras, key) => {
    let orderedExtras = this.state.orderedExtras
    orderedExtras[key] = extras
    this.setState({ orderedExtras })
  }

  // Validate the toastie object
  checkToastie = (toastie) => {
    if (toastie.bread === -1) {
      return "No bread selected";
    }

    if (toastie.fillings.length === 0 && this.state.specials.length === 0) {
      return "No fillings or special selected";
    }

    if (toastie.fillings.length !== 0 && this.state.specials.length !== 0) {
      return "You cannot select custom fillings for a special"
    }

    return true;
  }

  placeOrder = async () => {
    const { toastie, specials, milkshakes, orderedExtras } = this.state;
    const valid = this.checkToastie(toastie);
    const username = this.state.user.username

    let order = {
      customer: this.state.isMember ? { name: username, username } : { name: this.state.name, username: this.state.email.replace("@durham.ac.uk", "") },
      content: {
        toasties: [],
        milkshakeIds: milkshakes,
        specials: [],
        additionalIds: []
      }
    };

    if (valid === true) {
      if (toastie.fillings.length > 0) {
        let orderToastie = { fillingIds: toastie.fillings, breadId: toastie.bread }
        order.content.toasties.push(orderToastie)
      } else {
        let special = { specialId: specials[0], breadId: toastie.bread }
        order.content.specials.push(special)
      }

      for (let key in orderedExtras) {
        for (let item of orderedExtras[key]) {
          order.content.additionalIds.push(item)
        }
        orderedExtras[key] = []
      }
      
      await api.post("/toastie/order", { order });

      // Now clear the current order
      this.setState({
        toastie: {
          bread: -1,
          fillings: []
        },
        milkshakes: [],
        specials: [],
        refreshId: Math.random(),
        showAddedInfo: true,
        validEmail: false,
        email: "",
        name: ""
      });

      setTimeout(() => {
        this.setState({ showAddedInfo: false });
      }, 5000);
    }
  }

  displaySelectedExtra = (key) => {
    const items = this.state.orderedExtras[key];

    if (items.length === 0) {
      return (
        <p>None Selected</p>
      )
    }

    return (
      <ul>
        {
          items.map((stockId, i) => (
            <li key={i}>
              <div className="flex flex-row justify-between">
                <span>- {this.state.idMatchedStock[`${stockId}-${key}`].name}</span>
                <span>£{this.state.idMatchedStock[`${stockId}-${key}`].pricePerUnit}</span>
              </div>
            </li>
          ))
        }
      </ul>
    );
  }

  displayMilkshakes = () => {
    const items = this.state.milkshakes;

    if (items.length === 0) {
      return (
        <p>None Selected</p>
      )
    }

    return (
      <ul>
        {
          items.map((stockId, i) => (
            <li key={i}>
              <div className="flex flex-row justify-between">
                <span>- {this.state.idMatchedStock[`${stockId}-milkshake`].name}</span>
                <span>£{this.state.idMatchedStock[`${stockId}-milkshake`].pricePerUnit}</span>
              </div>
            </li>
          ))
        }
      </ul>
    );
  }

  // Convert a toastie object to a displayable component
  displaySelectedToastie = () => {
    const { toastie } = this.state;
    const valid = this.checkToastie(toastie);

    if (valid !== true) {
      return (
        <p>{valid}</p>
      )
    }

    return (
      <div>
        <div className="flex flex-row justify-between">
          <span>Bread: {this.state.idMatchedStock[`${toastie.bread}-bread`].name}</span>
          <span>£{this.state.idMatchedStock[`${toastie.bread}-bread`].pricePerUnit}</span>
        </div>
        <p>Fillings:</p>
        <ul>
          {
            toastie.fillings.map((stockId, i) => (
              <li key={i}>
                <div className="flex flex-row justify-between">
                  <span>- {this.state.idMatchedStock[`${stockId}-filling`].name}</span>
                  <span>£{this.state.idMatchedStock[`${stockId}-filling`].pricePerUnit}</span>
                </div>
              </li>
            ))
          }
          {
            this.state.specials.length > 0 ?
              <li>
                <div className="flex flex-row justify-between">
                  <span>- Special: {this.state.idMatchedStock[`${this.state.specials[0]}-special`].name}</span>
                  <span>£{this.state.idMatchedStock[`${this.state.specials[0]}-special`].pricePerUnit}</span>
                </div>
              </li>
              : null
          }
        </ul>
      </div>
    );
  }

  emailChange = e => {
    this.setState({ email: e.target.value, validEmail: e.target.value.match(/.*@durham\.ac\.uk/) })
  }

  nameChange = e => {
    this.setState({ name: e.target.value })
  }

  // Summary shown on the RHS of the webpage
  displaySummary = () => {
    const { toastie, milkshakes, specials, orderedExtras, extras } = this.state;

    let toastieTotal = -1;

    const valid = this.checkToastie(toastie);
    const toastieOrdered = valid === true;

    if (toastieOrdered) {
      toastieTotal = Number(this.state.idMatchedStock[`${toastie.bread}-bread`].pricePerUnit);
      toastieTotal += toastie.fillings.reduce((sum, stockId) => sum + Number(this.state.idMatchedStock[`${stockId}-filling`].pricePerUnit), 0);
      if (specials[0]) {
        toastieTotal += Number(this.state.idMatchedStock[`${specials[0]}-special`].pricePerUnit)
      }
    }

    let subtotal = (toastieOrdered ? toastieTotal : 0);

    for (let shake of milkshakes) {
      subtotal += Number(this.state.idMatchedStock[`${shake}-milkshake`].pricePerUnit)
    }

    for (let type of extras) {
      for (let item of orderedExtras[type]) {
        subtotal += Number(this.state.idMatchedStock[`${item}-${type}`].pricePerUnit)
      }
    }

    const wasValidOrder = toastieOrdered;
    const emailBorder = !this.state.email ? "border-gray-400" : !this.state.validEmail ? "border-red-700" : "border-green-700";
    const nameBorder = !this.state.name ? "border-gray-400" : "border-green-700";

    return (
      <ul>
        {toastieTotal !== -1 ? (
          <li>
            <div className="flex flex-row justify-between">
              <span>Toastie</span>
              <span>£{toastieTotal.toFixed(2)}</span>
            </div>
          </li>
        ) : null}
        <li className="pt-2">
          <div className="flex flex-row justify-between font-semibold">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
        </li>
        {wasValidOrder && !this.state.isMember && this.state.open ? (
          <React.Fragment>
            <li className="pt-2">
              <input
                type="text"
                value={this.state.name}
                onChange={this.nameChange}
                className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${nameBorder}`}
                placeholder="Enter your name..."
              />
            </li>
            <li className="pt-2">
              <input
                type="text"
                value={this.state.email}
                onChange={this.emailChange}
                className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${emailBorder}`}
                placeholder="Enter your Durham email..."
              />
            </li>
          </React.Fragment>
        ) : null}
        {wasValidOrder ? (
          <li className="pt-2">
            <button
              className="px-4 py-2 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onClick={this.placeOrder}
              disabled={!(this.state.open && (this.state.isMember || (this.state.validEmail && this.state.name)))}
            >Place Order</button>
            {
              this.state.open ? null : (
                <p className="mt-2 font-semibold">The Toastie Bar is currently closed.</p>
              )
            }
          </li>
        ) : null}
      </ul>
    )
  }

  render() {
    if (!this.state.loaded) {
      if (this.state.status !== 200 && this.state.status !== 0) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col p-4">
        <div className="flex flex-col my-4 justify-center items-left md:w-3/5 md:mx-auto mx-2">
          <h1 className="text-5xl font-semibold mb-4">Welcome to the Toastie Bar</h1>
          {
            this.state.open ? (
              <React.Fragment>
                <p className="mb-2 text-lg text-left">The Toastie Bar is open! Please make your toastie below. Toasties are paid for and collected from the Toastie Bar in the JCR.</p>
                <p className="mb-2 text-lg text-left">To order, choose a bread and then either a special <em>or</em> a combination of fillings.</p>
              </React.Fragment>
            ) : (
              <p className="mb-2 font-semibold text-lg text-left">The Toastie Bar is currently closed. Orders cannot be placed but you can browse the menu.</p>
            )
          }
          <a href="/uploads/toasties/allergens" className="font-semibold underline" target="_blank"><p className="text-lg underline font-semibold mb-2 text-left">For allergen information, please click here.</p></a>
          <div className="flex flex-col lg:flex-row w-full text-left">
            <div className="w-full lg:w-3/4 lg:mr-2">
              <GroupDropdown
                title="Toastie: Bread"
                groupItems={this.state.stock.filter(item => item.type === "bread")}
                exclusive={true}
                updateParent={this.updateBread}
                refreshId={this.state.refreshId}
              />
              <GroupDropdown
                title="Toastie: Specials"
                groupItems={this.state.stock.filter(item => item.type === "special")}
                exclusive={true}
                updateParent={this.updateSpecials}
                refreshId={this.state.refreshId}
              />
              <GroupDropdown
                title="Toastie: Fillings"
                groupItems={this.state.stock.filter(item => item.type === "filling")}
                exclusive={false}
                updateParent={this.updateFillings}
                refreshId={this.state.refreshId}
              />
              <GroupDropdown
                title="Milkshakes"
                groupItems={this.state.stock.filter(item => item.type === "milkshake")}
                exclusive={true}
                updateParent={this.updateMilkshakes}
                refreshId={this.state.refreshId}
              />
              {
                this.state.extras.map(type => <GroupDropdown
                  title={type}
                  groupItems={this.state.stock.filter(item => item.type === type)}
                  exclusive={false}
                  updateParent={(extras) => this.updateExtras(extras, type)}
                  refreshId={this.state.refreshId}
                  key={type}
                />)
              }
            </div>
            <div className="w-full lg:w-1/4 text-base pb-4">
              <div className="border-2 p-2 border-black">
                <h2 className="text-3xl font-bold">Your Order</h2>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold">Toastie</h3>
                  {this.displaySelectedToastie()}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold">Milkshakes</h3>
                  {this.displayMilkshakes()}
                </div>
                {
                  this.state.extras.map(type => <div className="pt-2" key={type}>
                    <h3 className="text-xl font-semibold">{type}</h3>
                    {this.displaySelectedExtra(type)}
                  </div>)
                }
                <div className="pt-2">
                  <h3 className="text-xl font-semibold">Summary</h3>
                  {this.displaySummary()}
                </div>
                <div className="pt-2">
                  {this.state.showAddedInfo ? <p>Your order has been successfully placed!</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ToastieOrder.contextType = authContext;

export default ToastieOrder;