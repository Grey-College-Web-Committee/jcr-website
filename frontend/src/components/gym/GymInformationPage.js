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
          <ul className="my-2 list-inside list-disc">
            <li>Individual Term £23 per term (£27 for non-JCR members)</li>
            <li>Remaining University Year £40 (£50 for non-JCR members)</li>
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
      <div className="flex flex-col">
        <div className="relative">
          <img
            src="/images/gym/gym_banner.jpg"
            className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
            alt="Financial Support Background"
          ></img>
          <img
            src="/images/gym/gym_banner.jpg"
            className="w-full h-auto relative z-0 block lg:hidden"
            alt="Financial Support Background"
          ></img>
          <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
            <div className="flex flex-row align-middle items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold">Gym</h1>
            </div>
          </div>
        </div>
        <div className="mx-auto lg:w-4/5 w-full mt-2">
          <div className="flex flex-col">
            <div className="mx-2 lg:m-0">
              <p className="py-1">Grey College Gym is located in Oswald Block with 3 different fitness rooms:</p>
              <ul className="p-2 list-inside">
                <li>-	<span className="font-semibold">Cardio Room</span> - complete with: Exercise Bikes, Indoor Rowing Ergos, Treadmill and a Punching Bag.</li>
                <li>-	<span className="font-semibold">Main Weights Room</span> - complete with the: Shoulder Press, Leg Extension, Leg Curl, Leg Press and Smith machines. Multiple benches (including a Scott bench) with Bars, Dumbbells and Kettle Bells.</li>
                <li>-	<span className="font-semibold">Henry Dyson Room (Weights Room)</span> – complete with: Cable Station, Squat Rack and Treadmill.</li>
              </ul>
              <p className="py-1">The Gym Opening Times are from <span className="font-semibold">08:00 until 22:00, 7 days per week.</span></p>
              <p className="py-1">Please be considerate to residents living above the Gym by not playing loud music early in the morning and evening.</p>
              <p className="py-1">The Gym is run and equipment owned by the JCR, please contact the FACSO at <a href="mailto:grey.treasurer@durham.ac.uk" className="underline font-semibold" target="_blank" rel="noopener noreferrer">grey.treasurer@durham.ac.uk</a> with any questions.</p>
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
      </div>
    );
  }
}

GymInformationPage.contextType = authContext;

export default GymInformationPage;
