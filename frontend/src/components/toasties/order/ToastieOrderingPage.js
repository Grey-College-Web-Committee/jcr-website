import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import { ToastieSpecial } from './ToastieSpecial.js';
import { ToastieBuilder } from './ToastieBuilder.js';

import { IconContext  } from 'react-icons';
import { GiChocolateBar, GiBreadSlice, GiSandsOfTime, GiMilkCarton } from 'react-icons/gi';
import { ToastieHowToOrder } from './ToastieHowToOrder.js';

class ToastieOrderingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",

      name: "",
      username: "",

      additionalStock: [],
      breads: [],
      fillings: [],
      milkshakes: [],
      specials: [],

      open: false,
      waitTime: "Unknown",

      basketMilkshakes: [],
      basketAdditionals: [],
      basketSpecials: [],
      basketToasties: [],

      selectedTab: "build",
      disabled: false,
      showHowTo: false,
      showAddedInfo: false
    };

    this.tabs = {
      "build": {
        "title": "Build a Toastie",
        "icon": GiBreadSlice,
        "renderer": this.renderBuildToastie
      },
      "specials": {
        "title": "Specials",
        "icon": GiSandsOfTime,
        "renderer": this.renderSpecials
      },
      "milkshakes": {
        "title": "Milkshakes",
        "icon": GiMilkCarton,
        "renderer": this.renderMilkshakes
      },
      "other": {
        "title": "Other Items",
        "icon": GiChocolateBar,
        "renderer": this.renderAdditionalItems
      }
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let stockResult;

    try {
      stockResult = await api.get("/toastie/stock");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let statusResult;

    try {
      statusResult = await api.get("/toastie/status");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { additionalStock, breads, fillings, milkshakes, specials } = stockResult.data;

    const breadLookup = breads.reduce((acc, item) => {
      acc[item.id] = {
        name: item.name,
        pricePerUnit: item.pricePerUnit
      };

      return acc;
    }, {});

    const fillingLookup = fillings.reduce((acc, item) => {
      acc[item.id] = {
        name: item.name,
        pricePerUnit: item.pricePerUnit
      };

      return acc;
    }, {});

    const milkshakeLookup = milkshakes.reduce((acc, item) => {
      acc[item.id] = {
        name: item.name,
        pricePerUnit: item.pricePerUnit
      };

      return acc;
    }, {});

    const specialsLookup = specials.reduce((acc, item) => {
      acc[item.id] = {
        name: item.name,
        priceWithoutBread: item.priceWithoutBread
      };

      return acc;
    }, {});

    let additionalLookup = {};

    Object.keys(additionalStock).forEach(key => additionalStock[key].forEach(entry => {
      additionalLookup[entry.id] = {
        name: entry.name,
        pricePerUnit: entry.pricePerUnit,
        type: key
      }
    }))

    const { open, waitTime } = statusResult.data;

    this.setState({ 
      loaded: true, status: 200, 
      additionalStock, breads, fillings, milkshakes, specials, 
      open, waitTime,
      breadLookup, fillingLookup, milkshakeLookup, specialsLookup, additionalLookup 
    });
  }

  addCustomToastieToOrder = (entry) => {
    const copiedBasketToasties = [...this.state.basketToasties];
    copiedBasketToasties.push(entry);
    this.setState({ basketToasties: copiedBasketToasties });
  }

  renderBuildToastie = () => {
    const { breads, breadLookup, fillings, fillingLookup } = this.state;

    return (
      <ToastieBuilder
        breads={breads}
        breadLookup={breadLookup}
        fillings={fillings}
        fillingLookup={fillingLookup}
        addToOrder={this.addCustomToastieToOrder}
      />
    )
  }

  addSpecialToOrder = (entry) => {
    const copiedBasketSpecials = [...this.state.basketSpecials];
    copiedBasketSpecials.push(entry);
    this.setState({ basketSpecials: copiedBasketSpecials });
  }

  renderSpecials = () => {
    const { specials, breads } = this.state;

    if(specials.length === 0) {
      return (
        <div>
          <span>There are no specials on at the moment!</span>
        </div>
      )
    }

    return (
      <div className="flex flex-col">
        <h3 className="font-semibold text-xl lg:hidden">Specials</h3>
        {
          specials.sort((a, b) => a.name > b.name ? 1: -1).map((special, i) => (
            <div 
              key={i}
              className={`border p-1 flex flex-col ${i === 0 ? "" : "mt-2"}`}
            >
              <ToastieSpecial
                special={special}
                breads={breads}
                addToOrder={this.addSpecialToOrder}
              />
            </div>
          ))
        }
      </div>
    )
  }

  renderMilkshakes = () => {
    const { milkshakes, basketMilkshakes } = this.state;

    return (
      <div className="flex flex-col">
        <h3 className="font-semibold text-lg lg:hidden">Milkshakes</h3>
        {
          milkshakes.map((milkshake, i) => (
            <div key={i} className={`flex flex-row justify-between items-center border-b py-1 ${i === 0 ? "border-t" : ""}`}>
              <span>{milkshake.name} (£{milkshake.pricePerUnit})</span>
              {
                milkshake.available ? (
                  <button
                    className="bg-grey-500 text-white w-20 p-1 rounded-sm disabled:opacity-25"
                    onClick={() => this.setState({ basketMilkshakes: [...basketMilkshakes, milkshake.id] })}
                  >Add</button>
                ) : (
                  <span className="p-1">Out of Stock</span>
                )
              }
            </div>
          ))
        }
      </div>
    );
  }

  renderAdditionalItems = () => {
    const { additionalStock, basketAdditionals } = this.state;

    return (
      <div>
        {
          Object.keys(additionalStock).map((groupName, i) => (
            <div key={i} className={`${i === 0 ? "" : "mt-2"}`}>
              <h2 className="font-semibold text-lg">{groupName}</h2>
              <ul>
                {
                  additionalStock[groupName].sort((a, b) => a.name > b.name ? 1: -1).map((additional, j) => 
                    <div key={j} className="flex flex-col">
                      <div className={`flex flex-row justify-between items-center border-b py-1 ${i === 0 ? "border-t" : ""}`}>
                        <span>{additional.name} (£{additional.pricePerUnit})</span>
                        {
                          additional.available ? (
                            <button
                              className="bg-grey-500 text-white w-20 p-1 rounded-sm disabled:opacity-25"
                              onClick={() => this.setState({ basketAdditionals: [...basketAdditionals, additional.id] })}
                            >Add</button>
                          ) : (
                            <span className="p-1">Out of Stock</span>
                          )
                        }
                      </div>
                    </div>
                  )
                }
              </ul>
            </div>
          ))
        }
      </div>
    );
  }
  
  placeOrder = async () => {
    this.setState({ disabled: true });
    const { basketMilkshakes, basketAdditionals, basketSpecials, basketToasties, name, username } = this.state;

    const order = {
      customer: { name, username },
      content: {
        toasties: basketToasties,
        milkshakeIds: basketMilkshakes,
        specials: basketSpecials,
        additionalIds: basketAdditionals
      }
    }

    try {
      await api.post("/toastie/order", { order });
    } catch (error) {
      if(error?.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("There was an error processing your order.")
      }
      return;
    }

    setTimeout(() => {
      this.setState({ showAddedInfo: false });
    }, 5000);

    this.setState({ disabled: false, basketAdditionals: [], basketMilkshakes: [], basketSpecials: [], basketToasties: [], showAddedInfo: true })
  }

  // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
  // https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  generateHashCode = (str) => {
    let hash = 0;
    let i, chr;

    for(i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }

    return hash;
  }

  renderOrderContent = () => {
    const { 
      basketAdditionals, additionalLookup,
      basketMilkshakes, milkshakeLookup,
      basketSpecials, specialsLookup,
      basketToasties, fillingLookup, breadLookup
    } = this.state;

    let orderSections = [];
    let totalPrice = 0;

    if(basketToasties.length !== 0) {
      const basketToastiesQuant = {};

      basketToasties.forEach(toastie => {
        const sortedToastie = {
          breadId: toastie.breadId,
          fillingIds: toastie.fillingIds.sort(), // needed to get equal hash code
          price: Number(toastie.price)
        }

        const hashCode = this.generateHashCode(JSON.stringify(sortedToastie));

        if(!Object.keys(basketToastiesQuant).includes(`${hashCode}`)) {
          basketToastiesQuant[hashCode] = {
            toastie: {
              ...sortedToastie, 
              addedTime: toastie.addedTime // fixes some issues with the sorting 
            }, 
            quantity: 0
          };
        }

        if(Number(toastie.addedTime) < Number(basketToastiesQuant[hashCode].toastie.addedTime)) {
          basketToastiesQuant[hashCode] = {...basketToastiesQuant[hashCode], addedTime: toastie.addedTime, quantity: basketToastiesQuant[hashCode].quantity + 1};
        } else {
          basketToastiesQuant[hashCode] = {...basketToastiesQuant[hashCode], quantity: basketToastiesQuant[hashCode].quantity + 1};
        }

      });

      orderSections.push(
        <div className="flex flex-col mt-1">
          <span className="text-lg font-semibold">Toasties</span>
          {
            Object.keys(basketToastiesQuant)
              .sort((a, b) => Number(basketToastiesQuant[a].toastie.addedTime) > Number(basketToastiesQuant[b].toastie.addedTime) ? 1 : -1)
              .map((toastieHashCode, i) => 
            {
              const { toastie, quantity } = basketToastiesQuant[toastieHashCode];
              const price = toastie.price * quantity;
              totalPrice += price;

              return (
                <div key={i} className="flex flex-col">
                  <span>{quantity} x Toastie #{i + 1} (£{price.toFixed(2)})</span>
                  <ul className="list-inside list-disc ml-2">
                    <li>Bread: {breadLookup[toastie.breadId].name}</li>
                    <li>Fillings: {toastie.fillingIds.map(id => fillingLookup[id].name).join(", ")}</li>
                  </ul>
                </div>
              )
            })
          }
        </div>
      )
    }

    if(basketSpecials.length !== 0) {
      const basketSpecialsQuant = {};

      basketSpecials.forEach(special => {
        if(!Object.keys(basketSpecialsQuant).includes(`${special.specialId}-${special.breadId}`)) {
          basketSpecialsQuant[`${special.specialId}-${special.breadId}`] = 0;
        }

        basketSpecialsQuant[`${special.specialId}-${special.breadId}`] += 1;
      })

      orderSections.push(
        <div className="flex flex-col mt-1">
          <span className="text-lg font-semibold">Specials</span>
          <ul>
            {
              Object.keys(basketSpecialsQuant).map((specialUniqueIdentifier, i) => {
                const specialId = Number(specialUniqueIdentifier.split("-")[0]);
                const breadId = Number(specialUniqueIdentifier.split("-")[1]);

                const special = specialsLookup[specialId];
                const bread = breadLookup[breadId];

                const quantity = basketSpecialsQuant[specialUniqueIdentifier];
                const price = Number(special.priceWithoutBread) + Number(bread.pricePerUnit);
                totalPrice += price * quantity;

                return (
                  <li key={i}>{quantity} x {special.name} with {bread.name} (£{(price * quantity).toFixed(2)})</li>
                )
              })
            }
          </ul>
        </div>
      )
    }

    if(basketMilkshakes.length !== 0) {
      const basketMilkshakesQuant = {};

      basketMilkshakes.forEach(milkshakeId => {
        if(!Object.keys(basketMilkshakesQuant).includes(`${milkshakeId}`)) {
          basketMilkshakesQuant[milkshakeId] = 0;
        }

        basketMilkshakesQuant[milkshakeId] += 1;
      })

      orderSections.push(
        <div className="flex flex-col mt-1">
          <span className="text-lg font-semibold">Milkshakes</span>
          <ul>
            {
              Object.keys(basketMilkshakesQuant).map((milkshakeId, i) => {
                const quantity = basketMilkshakesQuant[milkshakeId]
                const milkshake = milkshakeLookup[milkshakeId];
                
                const price = quantity * milkshake.pricePerUnit;
                totalPrice += price;

                return (
                  <li key={i}>{quantity} x {milkshake.name} (£{price.toFixed(2)})</li>
                )
              })
            }
          </ul>
        </div>
      )
    }

    if(basketAdditionals.length !== 0) {
      const basketAdditionalsQuant = {};

      basketAdditionals.forEach(additionalId => {
        if(!Object.keys(basketAdditionalsQuant).includes(`${additionalId}`)) {
          basketAdditionalsQuant[additionalId] = 0;
        }

        basketAdditionalsQuant[additionalId] += 1;
      })

      orderSections.push(
        <div className="flex flex-col mt-1">
          <span className="text-lg font-semibold">Other Items</span>
          <ul>
            {
              Object.keys(basketAdditionalsQuant).map((additionalId, i) => {
                const quantity = basketAdditionalsQuant[additionalId];
                const additional = additionalLookup[additionalId];

                const price = quantity * additional.pricePerUnit;
                totalPrice += price;

                return (
                  <li key={i}>{quantity} x {additional.name} (£{price.toFixed(2)})</li>
                )
              })
            }
          </ul>
        </div>
      )
    }

    if(totalPrice !== 0) {
      orderSections.push(
        <div className="flex flex-col text-lg mb-1">
          <div className="flex flex-row items-center">
            <span className="font-semibold mr-1">Total:</span>
            <span>£{totalPrice.toFixed(2)}</span>
          </div>
          {
            totalPrice < 1 ? (
              <span className="mt-1">The minimum order is £1</span>
            ) : null
          }
        </div>
      )
    } 

    if(orderSections.length === 0) {
      return <span className="mt-1">Your order is empty!</span>;
    } else {
      if(!this.context?.username) {
        const { username, name } = this.state;

        const usernameBorder = username.length === 0 ? "border-gray-400" : (username.length !== 6 ? "border-red-700" : "border-green-700");
        const nameBorder = name.length === 0 ? "border-gray-400" : "border-green-700";

        orderSections.push(
          <div className="flex flex-col my-1">
          <div className="flex flex-row items-center mb-1">
            <span className="mr-1">Name:</span>
            <input
              type="text"
              value={this.state.name}
              name="name"
              onChange={this.onInputChange}
              className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${nameBorder}`}
              placeholder="Enter your name..."
              maxLength={100}
              disabled={this.state.disabled}
            />
          </div>
          <div className="flex flex-row items-center">
            <span className="mr-1">Username:</span>
            <input
              type="text"
              value={this.state.username}
              name="username"
              onChange={this.onInputChange}
              className={`appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${usernameBorder}`}
              placeholder="Enter your username..."
              maxLength={6}
              disabled={this.state.disabled}
            />
          </div>
        </div>
        );
      }

      if(this.state.open) {
        orderSections.push(
          <button
            className="bg-grey-500 text-white rounded-sm p-2 text-lg mt-1 disabled:opacity-25"
            disabled={
              this.state.disabled || 
              (basketAdditionals.length === 0 && basketMilkshakes.length === 0 && basketSpecials.length === 0 && basketToasties.length === 0) ||
              !this.validUserDetails() ||
              totalPrice < 1
            }
            onClick={this.placeOrder}
          >Place Order</button>
        )
        
      }

      return orderSections;
    }
  }

  validUserDetails = () => {
    if(this.context?.username) {
      return true;
    }

    if(this.state.name.length > 0 && this.state.username.length === 6) {
      return true;
    }

    return false;
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

    const { open, waitTime } = this.state;

    return (
      <>
        <ToastieHowToOrder
          visible={this.state.showHowTo}
          hide={() => this.setState({ showHowTo: false })}
        />
        <div className="flex flex-col">
          <div className="relative">
            <img
              src="/images/fs_banner.jpg"
              className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
              alt="Toastie Bar banner"
            ></img>
            <img
              src="/images/fs_banner.jpg"
              className="w-full h-auto relative z-0 block lg:hidden"
              alt="Toastie Bar banner"
            ></img>
            <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
              <div className="flex flex-row align-middle items-center justify-center">
                <h1 className="text-4xl md:text-6xl font-bold">Toastie Bar</h1>
              </div>
            </div>
          </div>
          <div className="flex flex-col my-4 justify-center items-left lg:w-4/5 lg:mx-auto mx-2">
            <div className="bg-red-900 text-white font-semibold text-center text-lg mb-4 p-1">
              <p className="py-1">
                The JCR is trialling a new ordering system. 
                Payment is no longer taken online. 
                Place your order online, wait for an email to tell you your order is ready, pay at the Toastie Bar!
              </p>
              <div className="py-1">
                <button className="bg-grey-500 py-1 px-2 font-semibold w-auto rounded-sm" onClick={() => this.setState({ showHowTo: true })}>
                  For more information, click this!
                </button>
              </div> 
            </div>
            <div className="flex flex-col border p-1 mb-4">
              {
                open ? (
                  <>
                    <p className="py-1">
                      The Toastie Bar is open for orders! We are using a new ordering system, simply select the items you want below and add them to your order,
                      then place your order and pay at the Toastie Bar in the JCR instead of online. You will receive an email to let you know when your order is
                      ready for collection!
                    </p>
                    <p className="py-1 font-semibold">The estimated wait time is {waitTime} minutes but may be longer.</p>
                    <p className="py-1 font-semibold underline">
                      <a 
                        href="https://www.greyjcr.co.uk/uploads/toasties/allergens"
                        target="_blank"
                        rel="noreferrer"
                      >For allegen information click here. Please speak to the Toastie Bar staff before ordering!</a>
                    </p>
                  </>
                ) : (
                  <p>The Toastie Bar is currently closed! We open at X...</p>
                )
              }
            </div>
            <div className="flex lg:flex-row flex-col-reverse">
              <div className="lg:hidden lg:mt-0 mt-2">
                <button 
                  className="bg-grey-500 text-white rounded-sm p-2 w-full text-lg mt-1 disabled:opacity-25"
                  onClick={() => window.scrollTo(0, 100)}
                >Back to Top</button>
              </div>
              <div className="lg:w-4/5 flex flex-row">
                <div className="w-full flex flex-col">
                    <h2 className="font-semibold text-2xl lg:hidden">Menu</h2>
                    <div className="flex flex-row w-full border-red-900 border-2 border-b-0 rounded-sm text-xl">
                      {
                        Object.keys(this.tabs).map((tabKey, i) => (
                          <div
                            key={i}
                            className={`p-1 w-1/4 text-center ${this.state.selectedTab === tabKey ? "bg-white" : "bg-red-900 border-b-2 border-red-900 text-white cursor-pointer"}`}
                            onClick={() => this.setState({ selectedTab: tabKey })}
                          >
                            <span className="font-semibold lg:inline hidden">{this.tabs[tabKey].title}</span>
                            <div className="flex flex-row justify-center items-center lg:hidden">
                              <IconContext.Provider value={{ className: "w-10 h-10" }}>
                                { React.createElement(this.tabs[tabKey].icon) }
                              </IconContext.Provider>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                    <div className="border-red-900 border-2 border-t-0 p-1">
                      { this.tabs[this.state.selectedTab].renderer() }
                    </div>
                </div>
              </div>
              <div className="lg:w-1/5 lg:ml-4 flex flex-col lg:mb-0 mb-2">
                <div className="flex flex-col border-2 border-red-900 p-1">
                  <span className="font-bold text-2xl">Your Order</span>
                  { this.renderOrderContent() }
                  
                </div>
                {
                  this.state.showAddedInfo ? (
                    <div className="mt-2 bg-green-900 text-white p-2 text-center font-semibold">
                      <p>Your order has successfully been placed! {this.context?.username ? "" : "Make sure you verify your order from your email!"}</p>
                    </div>
                  ) : null
                }
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

ToastieOrderingPage.contextType = authContext;

export default ToastieOrderingPage;
