import React from 'react';
import authContext from '../../utils/authContext.js';
import HomeSlideshow from './HomeSlideshow';

class HomePage extends React.Component {
  render () {
    const loggedIn = this.context !== undefined && this.context !== null;

    /**
    <div className="flex justify-center items-center">
      <div className="container mx-auto text-center p-4">
        <div className="flex flex-row justify-center">
          <div>
          </div>
        </div>
      </div>
    </div>
    */

    return (
      <HomeSlideshow />
    );
  }
}

HomePage.contextType = authContext;

export default HomePage;
