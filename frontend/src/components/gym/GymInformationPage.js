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
      householdHas: false,
      inBasket: this.cart.get().items.filter(item => item.shop === "gym").length !== 0,
      householdNumber: "",
      currentGalleryImage: 0
    };

    this.membershipOptions = [
      {
        price: 20,
        nonMemberPrice: 30,
        name: "Easter Term Gym Membership",
        image: "/images/gym/dumbbell.png",
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
    if(this.state.termsOfUse && this.state.parq && this.state.induction && this.state.householdHas) {
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

    this.setState({ inBasket: false })
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  changeImage = (direction) => {
    let newImage = this.state.currentGalleryImage + direction;
    // we have 5 images

    if(newImage < 0) {
      newImage = 4;
    } else if(newImage >= 4) {
      newImage = 0;
    }

    this.setState({ currentGalleryImage: newImage });
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

    // Change displayed image every 6 seconds
    this.interval = setInterval(() => {
      this.changeImage(1);
    }, 6000);

    this.setState({ loaded: true, status: 200, membership: content.data.membership, isMember });
  }

  renderPurchaseDiv = () => {
    const { membership } = this.state;

    return (
      <React.Fragment>
        <h2 className="text-4xl font-semibold pb-2 text-left">Purchase Membership</h2>
        <div className="flex flex-row">
          <div className="flex flex-col text-left">
            <div className="pb-2">
              <p className="py-1">You must agree to the following conditions before you are able to add a membership to your cart.</p>
              <p className="py-1">Please read the Terms of Use by clicking the red text below.</p>
              <p className="py-1 font-semibold">Selected Household: {this.state.householdNumber}</p>
            </div>
            <div className="pb-2 border-b-2 flex flex-row items-center justify-between">
              <label htmlFor="termsOfUse">I accept the <Link to="/gym/terms"><span className="underline font-semibold text-red-700">Terms of Use of Grey College Gym</span></Link></label>
              <div className="flex flex-col items-center justify-center ml-2">
                <input
                  type="checkbox"
                  name="termsOfUse"
                  checked={this.state.termsOfUse}
                  onChange={this.onInputChange}
                  className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.inBasket}
                  autoComplete=""
                />
              </div>
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-row items-center justify-between">
              <label htmlFor="parq">I have completed an accurate PARQ Health Declaration</label>
              <div className="flex flex-col items-center justify-center ml-2">
                <input
                  type="checkbox"
                  name="parq"
                  checked={this.state.parq}
                  onChange={this.onInputChange}
                  className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.inBasket}
                  autoComplete=""
                />
              </div>
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-row items-center justify-between">
              <label htmlFor="induction">I have completed the online DUO induction training and quiz (with 100% pass mark)</label>
              <div className="flex flex-col items-center justify-center ml-2">
                <input
                  type="checkbox"
                  name="induction"
                  checked={this.state.induction}
                  onChange={this.onInputChange}
                  className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.inBasket}
                  autoComplete=""
                />
              </div>
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-row items-center justify-between">
              <label htmlFor="householdHas">There is somebody else in my household that would like to buy a gym membership or already has purchased one</label>
              <div className="flex flex-col items-center justify-center ml-2">
                <input
                  type="checkbox"
                  name="householdHas"
                  checked={this.state.householdHas}
                  onChange={this.onInputChange}
                  className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.inBasket}
                  autoComplete=""
                />
              </div>
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
                disabled={membership !== null || !this.state.termsOfUse || !this.state.parq || !this.state.induction || !this.state.householdHas}
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
      </React.Fragment>
    );
  }

  renderHouseholdDiv = () => {
    return (
      <React.Fragment>
        <h2 className="font-semibold text-4xl pb-2 text-left">Purchase Membership</h2>
        <p className="py-1">As part of the <Link to="/gym/terms"><span className="underline font-semibold text-red-700">Terms of Use of Grey College Gym</span></Link>, at least one other member of your household must be using the gym with you. Please specify your household number below. This will be used to check that at least two members of the same household have a membership once the gym opens.</p>
        <p className="py-1">Once you have selected your household number you will be able to purchase a membership. If you select the wrong household number you will need to refresh the page!</p>
        <div className="flex flex-col w-auto my-2">
          <p className="mb-2 text-2xl font-semibold">Select your household number</p>
          <p className="pb-2">If you already have a membership in your cart then it will be automatically removed when you select a household.</p>
          <select
            name="householdNumber"
            className="w-64 h-8 border border-gray-400 disabled:opacity-50"
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
      </React.Fragment>
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
        <React.Fragment>
          <h2 className="text-4xl font-semibold pb-2">Your Membership</h2>
          <p className="py-1">You already have an active gym membership. If you want to renew your membership you can do so on this page once your current one expires! If you have any queries please contact the FACSO, Will, using the email above.</p>
          <div className="text-left my-2 text-lg">
            <p>Expires On: {dateFormat(new Date(membership.expiresAt), "dd/mm/yyyy")}</p>
            <p>Type: {resolvedType[membership.type]}</p>
            <p>Household: {membership.household}</p>
          </div>
        </React.Fragment>
      );
    } else {
      if(householdNumber === "") {
        displayedPurchaseDiv = this.renderHouseholdDiv();
      } else {
        displayedPurchaseDiv = this.renderPurchaseDiv();
      }
    }

    return (
      <div className="mx-auto lg:w-4/5 w-full">
        <div className="flex flex-col">
          <h1 className="font-semibold text-5xl py-2 text-center">Grey College Gym</h1>
          <div className="mx-2 lg:m-0">
            <p className="py-1">Grey College Gym is located in Oswald Block with 3 different fitness rooms:</p>
            <ul className="p-2 list-inside">
              <li>-	<span className="font-semibold">Cardio Room</span> - complete with: Exercise Bikes, Indoor Rowing Ergos, Treadmill and a Punching Bag.</li>
              <li>-	<span className="font-semibold">Main Weights Room</span> - complete with the: Shoulder Press, Leg Extension, Leg Curl, Leg Press and Smith machines. Multiple benches (including a Scott bench) with Bars, Dumbbells and Kettle Bells.</li>
              <li>-	<span className="font-semibold">Henry Dyson Room (Weights Room)</span> – complete with: Cable Station, Squat Rack and Treadmill.</li>
            </ul>
            <p className="py-1">The Gym Opening Times are from <span className="font-semibold">09:00 until 22:00, 7 days per week.</span></p>
            <p className="py-1">For Easter Term 2021, users of the gym will need their ‘household leader’ to book ‘household’ gym slots as, unfortunately, the gym is too small to offer individual socially distanced exercise. Therefore, there must be a minimum of 2 people in your ‘household’ with an active gym membership.</p>
            <p className="py-1">Please be considerate to residents living above the Gym by not playing loud music early in the morning and evening.</p>
            <p className="py-1 font-semibold">Gym members will need to complete the DUO induction training, quiz and PARQ form before being granted access to the Gym. DUO > Grey College > Grey JCR > Grey College Gym</p>
            <p className="py-1">The Gym is run and equipment owned by the JCR, please contact the FACSO, Will, at <a href="mailto:grey.treasurer@durham.ac.uk" className="underline font-semibold" target="_blank" rel="noopener noreferrer">grey.treasurer@durham.ac.uk</a> with any questions.</p>
          </div>
          <div className="flex flex-col mx-2 lg:flex-row lg:mx-0 mt-2">
            <div className="flex flex-col flex-1">
              <div className="flex flex-row justify-center">
                <div>
                  <img
                    src={`/images/gym/gym-${this.state.currentGalleryImage}.jpg`}
                    alt="Grey Gym"
                    className="h-auto w-auto border-red-900 border-2"
                  />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex flex-row justify-between text-2xl align-middle">
                  <button
                    onClick={() => {
                      this.changeImage(-1);
                      clearInterval(this.interval);
                    }}
                    className="h-full px-8 lg:pb-1 rounded disabled:bg-gray-400 text-white w-auto font-semibold bg-red-900 disabled:opacity-20"
                  >←</button>
                  <p>{this.state.currentGalleryImage + 1} / 5</p>
                  <button
                    onClick={() => {
                      this.changeImage(1);
                      clearInterval(this.interval);
                    }}
                    className="h-full px-8 lg:pb-1 rounded disabled:bg-gray-400 text-white w-auto font-semibold bg-red-900 disabled:opacity-20"
                  >→</button>
                </div>
              </div>
            </div>
            <div className="flex flex-col flex-1 mx-2 mt-2 lg:my-0 lg:ml-4">
              { displayedPurchaseDiv }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

GymInformationPage.contextType = authContext;

export default GymInformationPage;
