import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import StashSelectable from './StashSelectable';

class OrderStashPage extends React.Component {
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
      content = await api.get("/stash/stock");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { stock } = content.data;

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
              this.state.stock.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();

                return aName > bName ? 1 : (aName < bName ? -1 : 0);
              }).map((item, i) => (
                <div className="flex-1 flex flex-row justify-center" key={i}>
                  <StashSelectable
                    {...item}
                  />
                </div>
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
