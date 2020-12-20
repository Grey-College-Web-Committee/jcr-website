import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import GenericCartableItem from '../cart/GenericCartableItem';
import dateFormat from 'dateformat';
import Cart from '../cart/Cart';

class GymInformationPage extends React.Component {
  constructor(props) {
    super(props);

    this.cart = new Cart();
    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      termsOfUse: false,
      parq: false,
      inBasket: this.cart.get().items.filter(item => item.shop === "gym").length !== 0
    };
  }

  // Basic function to change the state for any text-based input
  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) }, this.checkCart);
  }

  checkCart = () => {
    if(this.state.termsOfUse && this.state.parq) {
      return;
    }

    const gymItems = this.cart.get().items.reduce((arr, item, index) => {
      if(item.shop === "gym") {
        arr.push(index);
      }

      return arr;
    }, []);

    gymItems.forEach(index => {
      this.cart.removeFromCart(index);
    });
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;
    let isMember = true;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    // Ensure they are a member
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        isMember = false;
      }
    } else {
      isMember = false;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/gym/active");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, membership: content.data.membership, isMember });
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

    const { membership } = this.state;

    const membershipOptions = [
      {
        price: 40,
        nonMemberPrice: 55,
        name: "Epiphany Term Membership",
        image: "/images/cart/placeholder.png",
        description: "(expires 20/03/2021)",
        displayName: "Epiphany Term Gym Membership",
        submissionInformation: {
          type: "single_term"
        }
      },
      {
        price: 80,
        nonMemberPrice: 100,
        name: "Full Year Membership",
        image: "/images/cart/placeholder.png",
        description: "(expires 01/07/2021)",
        displayName: "Full Year Gym Membership",
        submissionInformation: {
          type: "full_year"
        }
      }
    ]

    const purchaseDiv = membership === null ? (
      <div className="flex flex-col mx-auto justify-center sm:w-1/2 sm:mr-24 sm:ml-4 px-4 sm:px-0 mb-2 sm:mb-0 w-full">
        <div>
          <h2 className="text-4xl font-semibold pb-2 text-center">Purchase Membership</h2>
        </div>
        <div className="flex flex-row justify-center align-middle">
          <div className="flex flex-col text-center">
            <div>
              <label className="h-4 px-2 align-middle w-64" htmlFor="termsOfUse">I accept the Terms of Use of Grey College Gym</label>
              <input
                type="checkbox"
                name="termsOfUse"
                className="p-2 h-4 w-4 align-middle"
                onChange={this.onInputChange}
                disabled={this.state.inBasket}
              />
            </div>
            <div>
              <label className="h-4 px-2 align-middle w-64" htmlFor="parq">I confirm the authenticity of my PARQ</label>
              <input
                type="checkbox"
                name="parq"
                className="p-2 h-4 w-4 align-middle"
                onChange={this.onInputChange}
                disabled={this.state.inBasket}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-row flex-wrap w-full justify-center">
          {
            membershipOptions.map((option, i) => (
              <GenericCartableItem
                price={this.state.isMember ? option.price : option.nonMemberPrice}
                name={option.name}
                image={option.image}
                description={option.description}
                cartData={{
                  shop: "gym",
                  name: option.displayName,
                  basePrice: this.state.isMember ? option.price : option.nonMemberPrice,
                  quantity: 1,
                  submissionInformation: option.submissionInformation,
                  components: [],
                  image: option.image,
                  upperLimit: 1
                }}
                disabled={membership !== null || !this.state.termsOfUse || !this.state.parq}
                buttonText={membership !== null ? "Already Purchased" : "Add To Bag"}
                disableOnCondition={(items) => {
                  return items.filter(item => item.shop === "gym").length !== 0;
                }}
                callback={() => {
                  this.setState({ inBasket: true })
                }}
              />
            ))
          }
        </div>
      </div>
    ) : null;

    const resolvedType = {
      "full_year": "Full Year",
      "single_term": "Single Term"
    }

    const viewMembershipDiv = membership !== null ? (
      <div className="flex flex-col mx-auto justify-center text-center sm:w-1/2 sm:mr-24 sm:ml-4 px-4 sm:px-0 mb-2 sm:mb-0 w-full">
        <h2 className="text-4xl font-semibold pb-2">Your Membership</h2>
        <div className="text-left mx-auto">
          <p>Expires On: {dateFormat(new Date(membership.expiresAt), "dd/mm/yyyy")}</p>
          <p>Type: {resolvedType[membership.type]}</p>
          <p>Purchased On: {dateFormat(new Date(membership.createdAt), "dd/mm/yyyy")}</p>
        </div>
      </div>
    ) : null;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Grey Gym</h1>
        </div>
        <img
          src="/images/banners/placeholder.png"
          alt="Gym Banner"
          className="mb-4"
        />
      <div className="flex flex-col sm:flex-row">
          <div className="mx-auto px-4 sm:px-0 mb-2 w-full sm:w-1/2 sm:ml-24 sm:mr-4">
            <h1 className="font-semibold text-4xl pb-4 text-center">Information</h1>
            <p>Some information about the gym here...</p>
          </div>
          { purchaseDiv }
          { viewMembershipDiv }
        </div>
      </div>
    );
  }
}

GymInformationPage.contextType = authContext;

export default GymInformationPage;
