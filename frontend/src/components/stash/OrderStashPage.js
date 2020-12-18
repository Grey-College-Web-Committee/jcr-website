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
      }
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Stash</h1>
          <div className="flex flex-row flex-wrap">
            {
              Object.keys(this.state.groups).map((type, i) => (
                <StashDropdown
                  key={i}
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
