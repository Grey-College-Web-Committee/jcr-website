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

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      currentGalleryImage: 0
    };
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
          <h2 className="text-4xl font-semibold mb-1">Your Membership</h2>
          <p className="py-1">You already have an active gym membership. If you want to renew your membership you can do so on this page once your current one expires. If you have any queries please contact the FACSO using the email above.</p>
          <div className="text-left my-2 text-lg">
            <p>Expires On: {dateFormat(new Date(membership.expiresAt), "dd/mm/yyyy")}</p>
            <p>Type: {resolvedType[membership.type]}</p>
          </div>
        </React.Fragment>
      );
    } else {
      displayedPurchaseDiv = (
        <div>
          <h2 className="text-4xl font-semibold mb-1">Purchase Membership</h2>
          <p className="py-1">Prior to purchasing a membership you must complete the online induction which involves watching the gym induction video, completing a short multiple choice quiz (about information provided in the video), and you completing a physical activity readiness questionnaire (PAR-Q). Please click the button below to begin the process. At the end of the induction to purchase a membership, the prices are:</p>
          <ul>
            <li>Michaelmas Term £18 (£23 for non-JCR members) (discounted due to delayed opening)</li>
            <li>Individual Epiphany / Easter Term £22 per term (£27 for non-JCR members)</li>
            <li>Whole Year £50 (£70 for non-JCR members)</li>
          </ul>
          <Link to="/gym/induction">
            <button
              className="my-1 p-2 text-xl bg-red-900 text-white w-full"
            >Begin Induction</button>
          </Link>
        </div>
      )
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
          <div className="flex flex-col mx-2 lg:flex-row lg:mx-0 my-2">
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
