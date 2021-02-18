import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import GenericCartableItem from '../cart/GenericCartableItem';

class DebtPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      hasDebt: false,
      debt: null
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
      content = await api.get("/debt");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, ...content.data });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/membership" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    // Doesn't actually have debt
    if(!this.state.hasDebt) {
      return (
        <Redirect to="/" />
      );
    }

    const { debt } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Your Debt</h1>
          <div className="flex flex-col items-center text-lg">
            <p className="py-1 text-justify">Due to excessive amounts of debt the JCR no longer uses the debting system. Instead, everything must now be paid for upfront on the website.</p>
            <p className="py-1 text-justify">You currently owe a debt to the JCR.</p>
            <p className="py-1 text-justify">Debt Reason: {debt.description}</p>
            <GenericCartableItem
              price={debt.debt}
              name="JCR Debt"
              image="./images/cart/placeholder.png"
              cartData={{
                shop: "debt",
                name: "JCR Debt",
                basePrice: debt.debt,
                quantity: 1,
                submissionInformation: {},
                components: [],
                image: "./images/cart/placeholder.png",
                upperLimit: 1
              }}
              disableOnCondition={(items) => {
                return items.filter(item => item.shop === "debt").length !== 0;
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

DebtPage.contextType = authContext;

export default DebtPage;
