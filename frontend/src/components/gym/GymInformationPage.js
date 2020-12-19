import React from 'react';
import authContext from '../../utils/authContext.js';
import GenericCartableItem from '../cart/GenericCartableItem';

class GymInformationPage extends React.Component {
  render () {
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
        <div className="flex flex-col">
          <div className="mx-auto mb-2">
            <p>Some information about the gym here...</p>
          </div>
          <div className="mx-auto flex flex-row flex-wrap">
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
                image: "/images/cart/placeholder.png"
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
                image: "/images/cart/placeholder.png"
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

GymInformationPage.contextType = authContext;

export default GymInformationPage;
