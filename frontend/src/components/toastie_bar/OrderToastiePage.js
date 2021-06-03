import React from 'react';
import { Redirect, Prompt } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import GroupDropdown from './GroupDropdown';
import Cart from '../cart/Cart';

class OrderToastiePage extends React.Component {
  constructor(props) {
    super(props);

    this.cart = new Cart();
    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      stock: [],
      idMatchedStock: {},
      toastie: {
        bread: -1,
        fillings: []
      },
      confectionary: [],
      drinks: [],
      refreshId: Math.random(),
      showAddedInfo: false
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status", isMember: false });
      return;
    }

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
      return;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/toastie_bar/stock");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    content = content.data.stock;

    const idMatchedStock = content.reduce((map, obj) => {
      map[obj.id] = obj;
      return map;
    }, {});

    this.setState({ loaded: true, status: 200, stock: content, idMatchedStock });
  }

  updateBread = (bread) => {
    let { toastie } = this.state;

    if(bread.length === 0) {
      toastie.bread = -1;
    } else {
      toastie.bread = bread[0];
    }

    this.setState({ toastie })
  }

  updateFillings = (fillings) => {
    let { toastie } = this.state;
    toastie.fillings = fillings;
    this.setState({ toastie });
  }

  updateConfectionary = (confectionary) => {
    this.setState({ confectionary });
  }

  updateDrinks = (drinks) => {
    this.setState({ drinks });
  }

  checkToastie = (toastie) => {
    if(toastie.bread === -1) {
      return "No bread selected";
    }

    if(toastie.fillings.length === 0) {
      return "No fillings selected";
    }

    return true;
  }

  addToBag = () => {
    // refresh in case it's out of sync
    this.cart.get();

    const { toastie, drinks, confectionary } = this.state;
    const valid = this.checkToastie(toastie);

    let cartableObjects = [];

    const toastieOrdered = valid === true;
    const drinksOrdered = drinks.length !== 0;
    const confectionaryOrdered = confectionary.length !== 0;

    if(toastieOrdered) {
      const basePrice = 0;
      let components = [];

      //bread here
      const bread = this.state.idMatchedStock[toastie.bread];
      components.push({
        name: bread.name,
        price: Number(bread.price),
        quantity: 1,
        submissionInformation: {
          id: bread.id
        }
      });

      toastie.fillings.forEach((fillingId, i) => {
        const filling = this.state.idMatchedStock[fillingId];
        components.push({
          name: filling.name,
          price: Number(filling.price),
          quantity: 1,
          submissionInformation: {
            id: filling.id
          }
        });
      });

      cartableObjects.push({
        shop: "toastie",
        name: "Toastie",
        basePrice,
        quantity: 1,
        submissionInformation: {},
        components,
        duplicateHash: null,
        image: "/images/cart/placeholder.png"
      });
    }

    if(drinksOrdered) {
      drinks.forEach((drinkId, i) => {
        const drink = this.state.idMatchedStock[drinkId];
        cartableObjects.push({
          shop: "toastie",
          name: drink.name,
          basePrice: Number(drink.price),
          quantity: 1,
          submissionInformation: {
            id: drink.id
          },
          components: [],
          duplicateHash: null,
          image: "/images/cart/placeholder.png"
        })
      });
    }

    if(confectionaryOrdered) {
      confectionary.forEach((confectionaryId, i) => {
        const confectionaryItem = this.state.idMatchedStock[confectionaryId];
        cartableObjects.push({
          shop: "toastie",
          name: confectionaryItem.name,
          basePrice: Number(confectionaryItem.price),
          quantity: 1,
          submissionInformation: {
            id: confectionaryItem.id
          },
          components: [],
          duplicateHash: null,
          image: "/images/cart/placeholder.png"
        })
      });
    }

    if(cartableObjects.length !== 0) {
      cartableObjects.forEach((item, i) => {
        this.cart.addToCartRaw(item);
      });

      // Now clear the current order
      this.setState({ toastie: {
        bread: -1,
        fillings: []
      }, drinks: [], confectionary: [], refreshId: Math.random(), showAddedInfo: true });

      setTimeout(() => {
        this.setState({ showAddedInfo: false });
      }, 5000);
    }
  }

  displaySelectedToastie = () => {
    const { toastie } = this.state;
    const valid = this.checkToastie(toastie);

    if(valid !== true) {
      return (
        <p>{valid}</p>
      )
    }

    return (
      <div>
        <div className="flex flex-row justify-between">
          <span>Bread: {this.state.idMatchedStock[toastie.bread].name}</span>
          <span>£{this.state.idMatchedStock[toastie.bread].price}</span>
        </div>
        <p>Fillings:</p>
        <ul>
          {
            toastie.fillings.map((stockId, i) => (
              <li key={i}>
                <div className="flex flex-row justify-between">
                  <span>- {this.state.idMatchedStock[stockId].name}</span>
                  <span>£{this.state.idMatchedStock[stockId].price}</span>
                </div>
              </li>
            ))
          }
        </ul>
      </div>
    );
  }

  displaySelected = (key) => {
    const items = this.state[key];

    if(items.length === 0) {
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
                <span>- {this.state.idMatchedStock[stockId].name}</span>
                <span>£{this.state.idMatchedStock[stockId].price}</span>
              </div>
            </li>
          ))
        }
      </ul>
    );
  }

  displaySummary = () => {
    const { toastie, drinks, confectionary } = this.state;

    let toastieTotal = -1;
    let drinksTotal = -1;
    let confectionaryTotal = -1;

    const valid = this.checkToastie(toastie);
    const toastieOrdered = valid === true;
    const drinksOrdered = drinks.length !== 0;
    const confectionaryOrdered = confectionary.length !== 0;

    if(toastieOrdered) {
      toastieTotal = Number(this.state.idMatchedStock[toastie.bread].price);
      toastieTotal += toastie.fillings.reduce((sum, stockId) => sum + Number(this.state.idMatchedStock[stockId].price), 0);
    }

    if(drinksOrdered) {
      drinksTotal = drinks.reduce((sum, stockId) => sum + Number(this.state.idMatchedStock[stockId].price), 0);
    }

    if(confectionaryOrdered) {
      confectionaryTotal = confectionary.reduce((sum, stockId) => sum + Number(this.state.idMatchedStock[stockId].price), 0);
    }

    let subtotal = (toastieOrdered ? toastieTotal : 0) + (drinksOrdered ? drinksTotal : 0) + (confectionaryOrdered ? confectionaryTotal : 0);

    const wasValidOrder = toastieOrdered || drinksOrdered || confectionaryOrdered;

    return (
      <ul>
        { toastieTotal !== -1 ? (
          <li>
            <div className="flex flex-row justify-between">
              <span>Toastie</span>
              <span>£{toastieTotal.toFixed(2)}</span>
            </div>
          </li>
        ) : null}
        { drinksTotal !== -1 ? (
          <li>
            <div className="flex flex-row justify-between">
              <span>Drinks</span>
              <span>£{drinksTotal.toFixed(2)}</span>
            </div>
          </li>
        ) : null}
        { confectionaryTotal !== -1 ? (
          <li>
            <div className="flex flex-row justify-between">
              <span>Confectionary</span>
              <span>£{confectionaryTotal.toFixed(2)}</span>
            </div>
          </li>
        ) : null}
        <li className="pt-2">
          <div className="flex flex-row justify-between font-semibold">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
        </li>
        { wasValidOrder ? (
          <li className="pt-2">
            <button
              className="px-4 py-2 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onClick={this.addToBag}
            >Add To Bag</button>
          </li>
        ) : null}
      </ul>
    )
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0 && this.state.status !== 403) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/memberships/join" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <Prompt
          when={this.state.drinks.length !== 0 || this.state.toastie.fillings.length !== 0 || this.state.confectionary.length !== 0 || this.state.toastie.bread !== -1}
          message="You have not added your items to your bag. Are you sure you want to leave?"
        />
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Create Toastie</h1>
          <div className="flex flex-col lg:flex-row w-full text-left">
            <div className="w-full lg:w-3/4 lg:px-2 lg:mx-2">
              <GroupDropdown
                title="Toastie: Bread"
                groupItems={this.state.stock.filter(item => item.type === "bread")}
                exclusive={true}
                updateParent={this.updateBread}
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
                title="Confectionary"
                groupItems={this.state.stock.filter(item => ["chocolates", "crisps"].includes(item.type))}
                exclusive={false}
                updateParent={this.updateConfectionary}
                refreshId={this.state.refreshId}
              />
              <GroupDropdown
                title="Drinks"
                groupItems={this.state.stock.filter(item => item.type === "drinks")}
                exclusive={false}
                updateParent={this.updateDrinks}
                refreshId={this.state.refreshId}
              />
            </div>
            <div className="w-full lg:w-1/4 text-base pb-4">
              <div className="border-2 p-2 border-black">
                <h2 className="text-3xl font-bold">Your Order</h2>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold">Toastie</h3>
                  {this.displaySelectedToastie()}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold">Confectionary</h3>
                  {this.displaySelected("confectionary")}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold">Drinks</h3>
                  {this.displaySelected("drinks")}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold">Summary</h3>
                  {this.displaySummary()}
                </div>
                <div className="pt-2">
                  {this.state.showAddedInfo ? <p>Your order has been added to your basket!</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

OrderToastiePage.contextType = authContext;

export default OrderToastiePage;
