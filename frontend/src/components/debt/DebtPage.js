import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import GenericCartableItem from '../cart/GenericCartableItem';
import qs from 'qs';

class DebtPage extends React.Component {
  constructor(props) {
    super(props);

    const queryString = qs.parse(props.location.search, { ignoreQueryPrefix: true });

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      hasDebt: false,
      debt: null,
      fromCheckout: queryString && queryString.hasOwnProperty("checkout")
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
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
            {
              !this.state.fromCheckout ? (<p className="py-1 text-justify">Debts must be paid off before you are able to purchase anything else.</p>) :
              (<p className="py-1 text-justify">You must add the debt item to your cart before you can checkout.</p>)
            }
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
