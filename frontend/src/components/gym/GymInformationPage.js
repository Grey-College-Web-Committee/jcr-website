import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import config from '../../config.json';
import LoadingHolder from '../common/LoadingHolder';
import GenericCartableItem from '../cart/GenericCartableItem';
import dateFormat from 'dateformat';

class GymInformationPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      content: []
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/gym/active");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, membership: content.data.membership });
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

    const purchaseDiv = membership === null ? (
      <div className="flex flex-col mx-auto justify-center sm:w-1/2 sm:mr-24 sm:ml-4 px-4 sm:px-0 mb-2 sm:mb-0 w-full">
        <div>
          <h2 className="text-4xl font-semibold pb-2 text-center">Purchase Membership</h2>
        </div>
        <div className="flex flex-row flex-wrap w-full justify-center">
          <GenericCartableItem
            price={40}
            name="Epiphany Term Membership"
            image="/images/cart/placeholder.png"
            description="(expires 20/03/2021)"
            cartData={{
              shop: "gym",
              name: "Epiphany Term Gym Membership",
              basePrice: 40,
              quantity: 1,
              submissionInformation: {
                type: "single_term"
              },
              components: [],
              image: "/images/cart/placeholder.png",
              upperLimit: 1
            }}
            disabled={membership !== null}
            buttonText={membership !== null ? "Already Purchased" : "Add To Bag" }
            disableOnCondition={(items) => {
              return items.filter(item => item.shop === "gym").length !== 0;
            }}
          />
          <GenericCartableItem
            price={80}
            name="Full Year Membership"
            image="/images/cart/placeholder.png"
            description="(expires 01/07/2021)"
            cartData={{
              shop: "gym",
              name: "Full Year Gym Membership",
              basePrice: 80,
              quantity: 1,
              submissionInformation: {
                type: "full_year"
              },
              components: [],
              image: "/images/cart/placeholder.png",
              upperLimit: 1
            }}
            disabled={membership !== null}
            buttonText={membership !== null ? "Already Purchased" : "Add To Bag" }
            disableOnCondition={(items) => {
              return items.filter(item => item.shop === "gym").length !== 0;
            }}
          />
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
