import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
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

    this.setState({ loaded: true, status: 200, isMember });
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

    if(this.state.isMember) {
      return (
        <Redirect to="/" />
      );
    }

    // Need to block if they have a membership

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Become a JCR Member</h1>
          <div className="flex md:flex-row flex-col justify-start">
            <div className="flex-shrink-0 flex-grow text-justify border-red-900 border-solid border-b-2 py-4 md:w-1/2 md:px-12 md:mb-0 md:border-b-0">
              <h2 className="text-3xl font-semibold pb-2 text-center">Why am I seeing this?</h2>
              <p className="mb-2">According to our database, you are not a JCR or MCR member. If you believe that you have previously paid the JCR membership levy for the duration expected, please <a href={`mailto:grey.treasurer@durham.ac.uk?subject=JCR Membership Levy: Already Purchased (${this.context.username})`} rel="noopener noreferrer" target="_blank" className="font-semibold underline">contact the FACSO.</a></p>
              <p className="mb-2">If you are not a member of the JCR or the MCR, please select an option from below to pay your membership levy online. Once paid your membership status will be granted instantly.</p>
              <p className="mb-2">The £60 annual amount includes your £10 pre-purchased ticket to Grey Day and a £50 donation to the Grey College JCR Trust.</p>
              <div className="mb-2">
                <h2 className="text-xl font-semibold pb-2 text-center">Year Abroad and Industrial Placements</h2>
                <p>For students on a degree course which includes a study year abroad or an industrial placement, please <a href={`mailto:grey.treasurer@durham.ac.uk?subject=JCR Membership Levy: Year Abroad / Placement (${this.context.username})`} rel="noopener noreferrer" target="_blank" className="font-semibold underline">contact the FACSO</a> to ensure your degree end date aligns with the database.</p>
              </div>
            </div>
            <div className="flex-shrink-0 flex-grow text-justify border-red-900 border-solid border-b-2 py-4 mb-4 md:w-1/2 md:px-12 md:mb-0 md:border-b-0">
              <h2 className="text-3xl font-semibold pb-2 text-center">What does the JCR offer to members?</h2>
              <p>Having a JCR membership gives you access to a number of benefits within college, a few are:</p>
              <div className="w-auto mx-auto my-2">
                <ul className="list-inside list-disc text-left text-xl">
                  <li>Compete for the JCR's sports teams in college sport</li>
                  <li>Access to the JCR's societies and committees</li>
                  <li>Priority booking and preferential members{"'"} rates to events organised by the JCR (such as Balls, Bops and Formal Dinners)</li>
                  <li>Access to JCR organised stash orders</li>
                  <li>Preferential rate on membership of the college gym</li>
                  <li>Access JCR equipment (musical instruments, sports, tech)</li>
                  <li>Vote at JCR meetings, and stand for elected office</li>
                  <li>Access the JCR-run welfare signposting service</li>
                </ul>
              </div>
              <p>See the <a href="https://www.dur.ac.uk/resources/grey.college/admissions/Grey_JCRAlternativeHandbook2020.pdf" rel="noopener noreferrer" target="_blank" className="font-semibold underline">Grey JCR Alternative Handbook</a> for more information!</p>
            </div>
          </div>
          <div className="mb-2">
          </div>
          <div className="mb-2">
            <p className="font-semibold mb-2 text-xl">After payment, please logout and back in to see the changes!</p>
          </div>
          <div className="flex flex-row flex-wrap justify-center">
            <GenericCartableItem
              price={60}
              name="1 Year Membership"
              image="/images/grey_crest.svg"
              description="(expires 01/08/2023)"
              cartData={{
                shop: "jcr_membership",
                name: "1 Year JCR Membership",
                basePrice: 60,
                quantity: 1,
                submissionInformation: {
                  type: "one_year"
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
              price={120}
              name="2 Year Membership"
              image="/images/grey_crest.svg"
              description="(expires 01/08/2024)"
              cartData={{
                shop: "jcr_membership",
                name: "2 Year JCR Membership",
                basePrice: 120,
                quantity: 1,
                submissionInformation: {
                  type: "two_year"
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
              price={180}
              name="3 Year Membership"
              image="/images/grey_crest.svg"
              description="(expires 01/08/2025)"
              cartData={{
                shop: "jcr_membership",
                name: "3 Year JCR Membership",
                basePrice: 180,
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
            <GenericCartableItem
              price={225}
              name="4 Year Membership"
              image="/images/grey_crest.svg"
              description="(expires 01/08/2026)"
              cartData={{
                shop: "jcr_membership",
                name: "4 Year JCR Membership",
                basePrice: 225,
                quantity: 1,
                submissionInformation: {
                  type: "four_year"
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
