import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import StashDropdown from './StashDropdown';

class OrderStashPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      groups: {
        "hoodiesAndLoungewear": {
          title: "Hoodies & Loungewear"
        },
        "jackets": {
          title: "Jackets"
        },
        "jumpersAndFleeces": {
          title: "Jumpers/Fleeces"
        },
        "sports": {
          title: "Sports"
        },
        "tShirts": {
          title: "T-Shirts"
        },
        "accessories": {
          title: "Accessories"
        },
        "other": {
          title: "Other"
        }
      },
      hasScrolled: false
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
      content = await api.get("/stash/stock");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { stock } = content.data;

    stock.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      return aName > bName ? 1 : (aName < bName ? -1 : 0);
    });

    this.setState({ loaded: true, status: 200, stock });
  }

  scrollToLastPosition = () => {
    if(this.state.hasScrolled) {
      return;
    }

    this.setState({ hasScrolled: true });

    setTimeout(() => {
      window.requestAnimationFrame(() => {
        const y = localStorage.getItem("stash_scroll_position");
        window.scrollTo(0, y);
      });
    });
  }

  componentDidUpdate = () => {
    if(this.state.loaded) {
      this.scrollToLastPosition();
    }
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0 && this.state.status !== 403) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/memberships/join" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <div className="mb-2 sm:mb-4 font-semibold">
            <p className="my-2 text-lg sm:text-xl">College Stash Order Window is now Open! (Closes at 23:00 GMT on 31/01/2020)</p>
            <p className="text-sm">We are unable to offer refunds for items after 31/01/2020, as all products are personalised and custom-made, unless they are faulty.</p>
          </div>
          <div className="flex flex-row mb-2 sm:mb-4 justify-between flex-wrap">
            <div className="flex flex-row justify-center flex-grow flex-shrink-0 mb-2">
              <figure>
                <img
                  src="/images/grey_shield.png"
                  alt="Grey Shield"
                  className="sm:h-64 h-32 mx-auto"
                />
                <figcaption className="font-semibold sm:text-lg mx-auto">Grey College Shield</figcaption>
              </figure>
            </div>
            <div className="flex flex-row justify-center flex-grow flex-shrink-0 mb-2">
              <figure>
                <img
                  src="/images/stash_item_description.png"
                  alt="Stash Item Description"
                  className="sm:h-64 h-32 mx-auto"
                />
              <figcaption className="font-semibold sm:text-lg mx-auto">Personalisation Options</figcaption>
              </figure>
            </div>
            <div className="flex flex-row justify-center flex-grow flex-shrink-0 mb-2">
              <figure>
                <img
                  src="/images/grey_crest.svg"
                  alt="Grey Crest"
                  className="sm:h-64 h-32 mx-auto"
                />
                <figcaption className="font-semibold sm:text-lg mx-auto">Grey College Crest</figcaption>
              </figure>
            </div>
          </div>
          <div className="flex flex-row flex-wrap">
            {
              Object.keys(this.state.groups).map((type, i) => (
                <StashDropdown
                  key={i}
                  identifier={type}
                  title={this.state.groups[type].title}
                  groupItems={this.state.stock.filter(item => item.type === type)}
                />
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}

OrderStashPage.contextType = authContext;

export default OrderStashPage;
