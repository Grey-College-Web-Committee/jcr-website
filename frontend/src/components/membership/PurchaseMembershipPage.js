import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import config from '../../config.json';
import LoadingHolder from '../common/LoadingHolder';
import GenericCartableItem from '../cart/GenericCartableItem';

class PurchaseMembershipPage extends React.Component {
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
      content = await api.get("/some/path");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, content: content });
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

    // Need to block if they have a membership

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Purchase Membership</h1>
          <div>
            <p>You are currently not a JCR member.</p>
            <p>If you have recently created an account on the new website the JCR may not have verified your membership yet. Please contact...</p>
            <p>If you don't have a membership please select an option from below to purchase your membership.</p>
            <p>Once purchased your membership will be granted instantly. Please logout and back in to see the changes!</p>
          </div>
          <div className="flex flex-row flex-wrap justify-center">
            <GenericCartableItem
              price={10}
              name="Annual Membership"
              image="/images/grey_crest.svg"
              description="(expires 01/09/2021)"
              cartData={{
                shop: "jcr_membership",
                name: "Annual JCR Membership",
                basePrice: 10,
                quantity: 1,
                submissionInformation: {
                  type: "single_year"
                },
                components: [],
                image: "/images/grey_crest.svg",
                upperLimit: 1
              }}
              buttonText={"Add To Bag"}
              disableOnCondition={(items) => {
                return items.filter(item => item.shop === "jcr_membership").length !== 0;
              }}
            />
            <GenericCartableItem
              price={15}
              name="3 Year Membership"
              image="/images/grey_crest.svg"
              description="(expires 01/09/2023)"
              cartData={{
                shop: "jcr_membership",
                name: "3 Year JCR Membership",
                basePrice: 15,
                quantity: 1,
                submissionInformation: {
                  type: "three_year"
                },
                components: [],
                image: "/images/grey_crest.svg",
                upperLimit: 1
              }}
              buttonText={"Add To Bag"}
              disableOnCondition={(items) => {
                return items.filter(item => item.shop === "jcr_membership").length !== 0;
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

PurchaseMembershipPage.contextType = authContext;

export default PurchaseMembershipPage;
