import React from 'react';
import { Redirect, Link } from 'react-router-dom';
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
      induction: false,
      inBasket: this.cart.get().items.filter(item => item.shop === "gym").length !== 0,
      householdNumber: "",
    };

    this.membershipOptions = [
      {
        price: 20,
        nonMemberPrice: 30,
        name: "Easter Term Gym Membership",
        image: "/images/cart/placeholder.png",
        description: "(expires 25/06/2021)",
        displayName: "Easter Term Gym Membership",
        submissionInformation: {
          type: "single_term"
        }
      }
    ];

    this.validHouseholdNumbers = [...Array(28).keys()].map(i => i + 1);
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

  renderPurchaseDiv = () => {
    const { membership } = this.state;
    return (
      <div className="flex-1 flex flex-col px-4 lg:px-0 mb-2 lg:mx-16">
        <h2 className="text-4xl font-semibold pb-2 text-left">Purchase Membership</h2>
        <div className="flex flex-row">
          <div className="flex flex-col text-left">
            <div className="pb-2">
              <p>You must agree to the following conditions before you are able to add a membership to your bag.</p>
              <p>Please read the Terms of Use by clicking the red text below.</p>
            </div>
            <div>
              <label className="h-4 pr-2 align-middle w-64" htmlFor="termsOfUse">I accept the <Link to="/gym/terms"><span className="underline font-semibold text-red-700">Terms of Use of Grey College Gym</span></Link></label>
              <input
                type="checkbox"
                name="termsOfUse"
                className="p-2 h-4 w-4 align-middle"
                onChange={this.onInputChange}
                disabled={this.state.inBasket}
              />
            </div>
            <div>
              <label className="h-4 pr-2 align-middle w-64" htmlFor="parq">I have completed an accurate PARQ Health Declaration</label>
              <input
                type="checkbox"
                name="parq"
                className="p-2 h-4 w-4 align-middle"
                onChange={this.onInputChange}
                disabled={this.state.inBasket}
              />
            </div>
            <div>
              <label className="h-4 pr-2 align-middle w-64" htmlFor="induction">I have completed the online DUO induction training and quiz (with 100% pass mark)</label>
              <input
                type="checkbox"
                name="induction"
                className="p-2 h-4 w-4 align-middle"
                onChange={this.onInputChange}
                disabled={this.state.inBasket}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-row flex-wrap w-full justify-center">
          {
            this.membershipOptions.map((option, i) => (
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
                  components: [{
                    name: `Household ${this.state.householdNumber}`,
                    price: 0,
                    quantity: 1,
                    submissionInformation: {
                      type: "household",
                      value: this.state.householdNumber
                    }
                  }],
                  image: option.image,
                  upperLimit: 1
                }}
                disabled={membership !== null || !this.state.termsOfUse || !this.state.parq || !this.state.induction}
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
    );
  }

  renderHouseholdDiv = () => {
    return (
      <div className="flex-1 px-4 lg:px-0 mb-2 lg:mx-16">
        <h2 className="font-semibold text-4xl pb-4 text-left">Household Confirmation</h2>
        <p>As part of the <Link to="/gym/terms"><span className="underline font-semibold text-red-700">Terms of Use of Grey College Gym</span></Link>, at least one other member of your household must be using the gym with you. Please specify your household number below, this will be used to check that at least two members of the same household have a membership once the gym opens.</p>
        <div className="flex flex-col w-max bg-white p-4 border-2 border-grey-900 text-lg">
          <p className="mb-2 text-2xl font-semibold">Select your household number</p>
          <select
            name="householdNumber"
            className="w-auto h-8 border border-gray-400 disabled:opacity-50"
            onChange={this.onInputChange}
            value={this.state.householdNumber}
            disabled={this.state.disabled}
          >
            <option disabled={true} hidden={true} value="">Please choose an option...</option>
            {
              this.validHouseholdNumbers.map(no => (
                <option value={no}>Household {no}</option>
              ))
            }
          </select>
        </div>
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

    // Temporary locking measures
    const locked = false;

    if(locked) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Grey Gym</h1>
            <p className="text-xl mb-2">Unfortunately, Grey Gym is closed due to coronavirus restrictions currently in place in Durham.</p>
          </div>
        </div>
      );
    }

    const { membership, householdNumber } = this.state;

    const resolvedType = {
      "full_year": "Full Year",
      "single_term": "Single Term"
    }

    let displayedPurchaseDiv = null;

    if(membership !== null) {
      displayedPurchaseDiv = (
        <div className="flex flex-col justify-center text-center px-4 lg:px-0 mb-2 w-full flex-1">
          <h2 className="text-4xl font-semibold pb-2">Your Membership</h2>
          <div className="text-left mx-auto">
            <p>Expires On: {dateFormat(new Date(membership.expiresAt), "dd/mm/yyyy")}</p>
            <p>Type: {resolvedType[membership.type]}</p>
            <p>Purchased On: {dateFormat(new Date(membership.createdAt), "dd/mm/yyyy")}</p>
          </div>
        </div>
      );
    } else {
      if(householdNumber === "") {
        displayedPurchaseDiv = this.renderHouseholdDiv();
      } else {
        displayedPurchaseDiv = this.renderPurchaseDiv();
      }
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Grey Gym</h1>
        </div>
        <div className="flex flex-col lg:flex-row lg:justify-between">
          <div className="mx-auto px-4 lg:px-0 mb-2 w-full lg:flex-1 lg:mx-16">
            <h2 className="font-semibold text-4xl pb-4 text-left">Information</h2>
            <p className="py-1">Grey College Gym is located in Oswald Block with 3 different fitness rooms:</p>
            <ul className="p-2 list-inside">
              <li>-	<span className="font-semibold">Cardio Room</span> - complete with: Exercise Bikes, Indoor Rowing Ergos, Treadmill and a Punching Bag.</li>
              <li>-	<span className="font-semibold">Main Weights Room</span> - complete with the: Shoulder Press, Leg Extension, Leg Curl, Leg Press and Smith machines. Multiple benches (including a Scott bench) with Bars, Dumbbells and Kettle Bells.</li>
              <li>-	<span className="font-semibold">Henry Dyson Room (Weights Room)</span> – complete with: Cable Station, Squat Rack and Treadmill.</li>
            </ul>
            <p className="py-1">The Gym Opening Times are from 08:00 until 22:00, 7 days per week.</p>
            <p className="py-1">For Easter Term 2021, users of the gym will need their ‘household leader’ to book ‘household’ gym slots as, unfortunately, the gym is too small to offer individual socially distanced exercise. Therefore, there must be a minimum of 2 people in your ‘household’ with an active gym membership.</p>
            <p className="py-1">Please be considerate to residents living above the Gym by not playing loud music early in the morning and evening.</p>
            <p className="py-1">Gym members will need to complete the DUO induction training, quiz and PARQ form before being granted access to the Gym. DUO > Grey College > Grey JCR > Grey College Gym</p>
            <p className="py-1">The Gym is run and equipment owned by the JCR, please contact the FACSO, Will, at <a href="mailto:grey.treasurer@durham.ac.uk" className="underline font-semibold" target="_blank" rel="noopener noreferrer">grey.treasurer@durham.ac.uk</a> with any questions.</p>
          </div>
          { displayedPurchaseDiv }
        </div>
      </div>
    );
  }
}

GymInformationPage.contextType = authContext;

export default GymInformationPage;
