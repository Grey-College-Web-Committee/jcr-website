import React from 'react';
import { Prompt, Redirect } from 'react-router-dom';
import LoadingHolder from '../common/LoadingHolder';
import Cart from '../cart/Cart';
import CheckoutCartItem from './CheckoutCartItem';
import api from '../../utils/axiosConfig';
import CheckoutForm from './CheckoutForm';
import authContext from '../../utils/authContext.js';

class CheckoutPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: Math.random(),
      disabled: false,
      pageState: 0,
      lockedClientSideCart: null,
      errorStatus: -1,
      clientSecret: null,
      totalAmountInPence: -1,
      error: null,
      status: 0,
      requiresDeliveryOption: true,
      deliveryOption: "collection",
      address: {
        recipient: "",
        line1: "",
        line2: "",
        city: "",
        postcode: ""
      },
      consent: false,
      lockedTableNumber: localStorage.getItem("table_bar") === null ? null : Number(localStorage.getItem("table_bar"))
    }
  }

  startCheckout = (e) => {
    e.preventDefault();

    // Double check in case they make changes on another tab
    this.cart.get();
    const { items } = this.cart.get();
    const stashItems = items.filter(item => item.shop === "stash");
    const hasStashItems = stashItems.length !== 0;

    if(hasStashItems !== this.state.requiresDeliveryOption) {
      alert("You have made changes to your cart. Please refresh the page.");
      this.setState({ disabled: true });
      return;
    }

    if(this.state.requiresDeliveryOption) {
      switch(this.state.deliveryOption) {
        case "collection":
        case "delivery":
          this.cart.setDeliveryInformation(true, this.state.deliveryOption, this.state.address);
          break;
        case "none":
        default:
          alert("Stash in cart but no delivery option set!");
          return;
      }
    } else {
      this.cart.setDeliveryInformation(false, this.state.deliveryOption, this.state.address);
    }

    const hasBarItems = items.filter(item => item.shop === "bar").length !== 0;

    if(hasBarItems && this.state.lockedTableNumber === null) {
      alert("You cannot order bar items without setting your table number.");
      this.setState({ disabled: true });
      return;
    }

    this.setState({ disabled: true, pageState: 1, lockedClientSideCart: JSON.parse(JSON.stringify(this.cart.get())) }, this.submitCart);
    this.cart.setLocked(true);
  }

  onPaymentSuccess = () => {
    this.cart.setLocked(false);
    this.cart.clearCart();
    window.removeEventListener("beforeunload", this.unlockHandler);
    this.setState({ pageState: 3 });
  }

  submitCart = async () => {
    // Construct the object to send to the server
    // No checking here of the structure just send it and let the server process that

    let submissionCart = {
      items: []
    };

    const { items, delivery } = this.state.lockedClientSideCart;

    items.forEach((item, i) => {
      const globalSubmissionInfo = item.submissionInformation;
      let componentSubmissionInfo = [];

      if(item.hasOwnProperty("components")) {
        const { components } = item;

        if(components !== undefined && components !== null && components.length !== 0) {
          components.forEach((component, i) => {
            componentSubmissionInfo.push(component.submissionInformation);
          });
        }
      }

      // Prices will be determined server side instead
      submissionCart.items.push({
        shop: item.shop,
        quantity: item.quantity,
        globalSubmissionInfo,
        componentSubmissionInfo
      });
    });

    // Now confirm with the server

    let serverResponse;
    let status;

    try {
      serverResponse = await api.post("/cart/process", { submissionCart, delivery, tableNumber: this.state.lockedTableNumber });
    } catch (error) {
      status = error.response.status;

      if(status === 402) {
        this.setState({ pageState: 999 });
        return;
      }

      this.setState({ pageState: -1, errorStatus: status, error: error.response.data.error });
      return;
    }

    const { clientSecret, totalAmountInPence } = serverResponse.data;

    this.setState({ clientSecret, totalAmountInPence, pageState: 2 });
  }

  updateCart = () => {
    // Forces a re-render
    this.setState({ id: Math.random() });
  }

  componentDidMount = async () => {
    this.cart = new Cart();
    this.cart.registerCallbackOnSave(this.updateCart);
    this.updateCart();

    window.addEventListener("beforeunload", this.unlockHandler);
    this.setState({ loaded: true, status: 200 });
  }

  unlockHandler = (ev) => {
    if(this.cart) {
      this.cart.setLocked(false);
    }
  }

  componentWillUnmount = () => {
    if(this.cart) {
      this.cart.setLocked(false);
    }
  }

  displayCart = (items, locked) => {
    if(items.length === 0) {
      return (
        <div className="flex flex-row justify-center">
          <div className="text-3xl flex flex-col justify-center align-middle w-max">
            <div>
              <img
                src="/images/cart/basket.png"
                className="w-64 h-64"
                alt="Empty Basket"
              />
            </div>
            <div>
              <p className="flex">Your bag is empty!</p>
            </div>
          </div>
        </div>
      )
    }

    const deliveryElement = this.state.deliveryOption === "delivery" ? (
      <li>
        <div className="flex flex-row p-2 border-red-700 border-solid border-b-2 w-auto text-xl">
          <div className="pr-4 align-middle flex flex-col justify-between w-1/3">
            <img
              src="/images/cart/placeholder.png"
              alt="Placeholder"
              className="w-full h-auto"
            />
          </div>
          <div className="flex flex-col flex-grow text-left w-2/3">
            <span className="text-left text-3xl font-semibold">Stash Delivery</span>
            <div className="flex flex-row justify-between">
              <span>1 x £3.60</span>
              <span>(£3.60)</span>
            </div>
            <ul>
              <li>{this.state.address.recipient}</li>
              <li>{this.state.address.line1}</li>
              <li>{this.state.address.line2}</li>
              <li>{this.state.address.city}</li>
              <li>{this.state.address.postcode}</li>
            </ul>
          </div>
        </div>
      </li>
    ) : null;

    const collectionElement = this.state.deliveryOption === "collection" ? (
      <li>
        <div className="flex flex-row p-2 border-red-700 border-solid border-b-2 w-auto text-xl">
          <div className="pr-4 align-middle flex flex-col justify-between w-1/3">
            <img
              src="/images/cart/placeholder.png"
              alt="Placeholder"
              className="w-full h-auto"
            />
          </div>
          <div className="flex flex-col flex-grow text-left w-2/3">
            <span className="text-left text-3xl font-semibold">Stash Collection</span>
            <div className="flex flex-row justify-between">
              <span>1 x £0.00</span>
              <span>(£0.00)</span>
            </div>
            <span>Collection from Grey College</span>
          </div>
        </div>
      </li>
    ) : null;

    return (
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            <CheckoutCartItem
              item={item}
              locked={locked}
            />
          </li>
        ))}
        { deliveryElement }
        { collectionElement }
      </ul>
    );
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  onAddressChange = e => {
    const { name, type, checked, value } = e.target;
    this.setState(prevState => ({
      address: {
        ...prevState.address,
        [name]: (type === "checkbox" ? checked : value)
      }
    }))
  }

  requestDeliveryOption = () => {
    const { items } = this.cart.get();
    const stashItems = items.filter(item => item.shop === "stash");

    // No stash items so no need for delivery address
    if(stashItems.length === 0) {
      if(this.state.requiresDeliveryOption) {
        this.setState({ requiresDeliveryOption: false, deliveryOption: "" });
      }

      return null;
    }

    const allowingDelivery = false;

    if(allowingDelivery) {
      return (
        <div className="text-left">
          <h2 className="text-xl font-semibold pb-2">Stash Delivery</h2>
          <p className="pb-2">For stash items you can have the items delivered directly to your address (within the UK) or you can collect them from college for free once restrictions are eased.</p>
          <div className="pb-2 flex flex-col md:flex-row max-w-full">
            <div className="flex-shrink-0 flex flex-col justify-center">
              <label htmlFor="deliveryOption" className="w-40 inline-block font-semibold">Delivery Option:</label>
            </div>
            <div className="flex-grow">
              <select
                name="deliveryOption"
                className="w-auto h-8 border border-gray-400 disabled:opacity-50"
                onChange={this.onInputChange}
                value={this.state.deliveryOption}
                required={true}
                disabled={this.state.disabled}
              >
                <option value="none" disabled={true} hidden={true}>Please Select...</option>
                <option value="collection">Collect From College (+£0.00)</option>
                <option value="delivery">Deliver To UK Address (+£3.60)</option>
              </select>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="text-left">
        <h2 className="text-xl font-semibold pb-2">Stash Collection</h2>
        <p className="pb-2">Due to the easing of restrictions in Durham, all orders must now be collected from college instead.</p>
      </div>
    );
  }

  requestAddress = () => {
    if(this.state.deliveryOption !== "delivery") {
      return null;
    }

    return (
      <div className="text-justify">
        <p className="pb-2">Please enter your address below. Starred fields are required. Please ensure that your address is accurately written. You can check your address on the <a href="https://www.royalmail.com/find-a-postcode" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Royal Mail's website.</a></p>
        <fieldset>
          <div className="pb-2 flex flex-row">
            <div className="flex-shrink-0 flex flex-col justify-center">
              <label htmlFor="recipient" className="w-40 inline-block font-semibold">*Recipient:</label>
            </div>
            <div className="flex-grow">
              <input
                type="text"
                name="recipient"
                value={this.state.address.recipient}
                onChange={this.onAddressChange}
                className={`w-full rounded border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                placeholder="Recipient Name..."
                disabled={this.props.disabled}
                maxLength={255}
                autoComplete=""
              />
            </div>
          </div>
          <div className="pb-2 flex flex-row">
            <div className="flex-shrink-0 flex flex-col justify-center">
              <label htmlFor="line1" className="w-40 inline-block font-semibold">*Address Line 1:</label>
            </div>
            <div className="flex-grow">
              <input
                type="text"
                name="line1"
                value={this.state.address.line1}
                onChange={this.onAddressChange}
                className={`w-full rounded border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                placeholder="Address Line 1..."
                disabled={this.props.disabled}
                maxLength={255}
                autoComplete="address-line1"
              />
            </div>
          </div>
          <div className="pb-2 flex flex-row">
            <div className="flex-shrink-0 flex flex-col justify-center">
              <label htmlFor="line2" className="w-40 inline-block font-semibold">Address Line 2:</label>
            </div>
            <div className="flex-grow">
              <input
                type="text"
                name="line2"
                value={this.state.address.line2}
                onChange={this.onAddressChange}
                className={`w-full rounded border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                placeholder="Address Line 2..."
                disabled={this.props.disabled}
                maxLength={255}
                autoComplete="address-line2"
              />
            </div>
          </div>
          <div className="pb-2 flex flex-row">
            <div className="flex-shrink-0 flex flex-col justify-center">
              <label htmlFor="city" className="w-40 inline-block font-semibold">*Town/City:</label>
            </div>
            <div className="flex-grow">
              <input
                type="text"
                name="city"
                value={this.state.address.city}
                onChange={this.onAddressChange}
                className={`w-full rounded border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                placeholder="Town/City..."
                disabled={this.props.disabled}
                maxLength={255}
                autoComplete="address-level1"
              />
            </div>
          </div>
          <div className="pb-2 flex flex-row">
            <div className="flex-shrink-0 flex flex-col justify-center">
              <label htmlFor="postcode" className="w-40 inline-block font-semibold">*Postcode:</label>
            </div>
            <div className="flex-grow">
              <input
                type="text"
                name="postcode"
                value={this.state.address.postcode}
                onChange={this.onAddressChange}
                className={`w-full rounded border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                placeholder="Postcode..."
                disabled={this.props.disabled}
                maxLength={255}
                autoComplete="postal-code"
              />
            </div>
          </div>
          <p className="mb-2">By writing your address, you consent to us sharing your data with our supplier "SAGITTARIAN SECURITY LIMITED" for the purpose of order preparation and delivery.</p>
          <div className="pb-2 flex flex-row">
            <div className="flex-shrink-0 flex flex-col justify-center">
              <label htmlFor="postcode" className="inline-block font-semibold">I consent to the sharing of my address:</label>
            </div>
            <div className="flex-grow flex flex-row justify-center items-center">
              <input
                type="checkbox"
                name="consent"
                value={this.state.consent}
                onChange={this.onInputChange}
                className="p-2 h-6 w-6 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.props.disabled}
              />
            </div>
          </div>
        </fieldset>
      </div>
    )
  }

  isReadyForPayment = () => {
    if(!this.state.requiresDeliveryOption) {
      return true;
    }

    switch(this.state.deliveryOption) {
      case "collection":
        return true;
      case "delivery":
        for(let property in this.state.address) {
          if(this.state.address[property].length === 0 && property !== "line2") {
            return false;
          }
        }

        return this.state.consent;
      case "none":
      default:
        return false;
    }
  }

  injectPrompt = () => {
    return (
      <Prompt
        when={this.state.pageState === 1 || this.state.pageState === 2}
        message="You are about to navigate away from the checkout, meaning your payment will not go through. Leave checkout anyway?"
      />
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

    if(!this.cart) {
      return (
        <LoadingHolder />
      );
    }

    const { items } = this.state.pageState <= 0 ? this.cart.get() : this.state.lockedClientSideCart;
    const checkoutClosed = false;

    switch(this.state.pageState) {
      // Confirm the order
      case 0:
        let subtotal = (this.state.deliveryOption === "delivery" ? 3.6 : 0);
        const bagEmpty = items.length === 0;

        items.forEach((item, i) => {
          const { basePrice, quantity, components } = item;
          const hasComponents = components !== undefined && components !== null && components.length !== 0;
          let additionalPrice = 0;

          if(hasComponents) {
            additionalPrice = components.map(component => component.price * component.quantity).reduce((sum, price) => sum + price);
          }

          subtotal += (basePrice + additionalPrice) * quantity;
        });

        return (
          <div className="flex flex-col justify-start">
            {this.injectPrompt()}
            <div className="container mx-auto p-4 w-full">
              <h1 className="font-semibold text-5xl pb-4 text-center">Your Bag</h1>
              <div className="flex flex-col-reverse lg:flex-row lg:justify-between">
                <div className="lg:w-1/2 lg:mx-auto w-full">
                  {this.displayCart(items, false)}
                </div>
                {
                  checkoutClosed ? (
                    <div className="w-full lg:w-1/3 mx-auto block lg:flex lg:flex-col text-base py-4 align-middle">
                      <p>Checkout is currently closed for maintenance. Please check back soon!</p>
                    </div>
                  ) : (
                    <div className="w-full lg:w-1/3 mx-auto block lg:flex lg:flex-col text-base py-4 align-middle">
                      <div className="flex flex-row justify-between font-semibold text-3xl mb-4">
                        <span>Total</span>
                        <span>£{subtotal.toFixed(2)}</span>
                      </div>
                      { this.requestDeliveryOption() }
                      { this.requestAddress() }
                      <button
                        className="px-2 py-2 rounded bg-red-900 text-white text-2xl w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        onClick={this.startCheckout}
                        disabled={this.state.disabled || bagEmpty || !this.isReadyForPayment()}
                      >Pay Now</button>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        );
      // Load the checkout form and confirm with the server
      case 1:
        return (
          <div>
            {this.injectPrompt()}
            <LoadingHolder />
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col justify-start">
            {this.injectPrompt()}
            <div className="container mx-auto p-4 w-full">
              <h1 className="font-semibold text-5xl pb-4 text-center">Your Confirmed Order</h1>
              <div className="flex flex-col-reverse lg:flex-row lg:justify-between">
                <div className="lg:w-1/2 lg:mx-auto w-full">
                  {this.displayCart(items, true)}
                </div>
                <div className="w-full lg:w-1/3 mx-auto block lg:flex lg:flex-col text-base py-4 align-middle">
                  <CheckoutForm
                    clientSecret={this.state.clientSecret}
                    onSuccess={this.onPaymentSuccess}
                    totalAmountInPence={this.state.totalAmountInPence}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col justify-start">
            <div className="container mx-auto p-4 w-full">
              <h1 className="font-semibold text-5xl pb-4 text-center">Order Placed!</h1>
              <div className="mx-auto text-center">
                <div className="lg:w-1/2 lg:mx-auto w-full">
                  <div className="text-3xl pb-2 font-semibold text-center">
                    <h2>Thank you for your purchase</h2>
                  </div>
                  <div className="text-lg pb-4">
                    <p>A receipt has been emailed to your Durham email address.</p>
                    <p>The payment has been confirmed and the order has been placed.</p>
                  </div>
                  {this.displayCart(items, true)}
                </div>
              </div>
            </div>
          </div>
        )

      case 999:
        // Special case for debtors
        return (
          <Redirect to="/debt?checkout=true" />
        )

      case -1:
        return (
          <div className="flex flex-col justify-start">
            <div className="container mx-auto p-4 w-full text-center text-3xl">
              <h1 className="font-semibold text-5xl pb-4 text-center">Something went wrong...</h1>
              <p>Unfortunately there was an issue during checkout.</p>
              <p>Reason: {this.state.error.error}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}

CheckoutPage.contextType = authContext;

export default CheckoutPage;
