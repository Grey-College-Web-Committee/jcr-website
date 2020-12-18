import React from 'react';
import authContext from '../../utils/authContext.js';

class HomePage extends React.Component {
  render () {
    const loggedIn = this.context !== undefined && this.context !== null;

    return (
      <div className="flex justify-center items-center">
        <div className="container mx-auto text-center p-4">
          <div className="flex flex-row justify-center">
            <div className="flex flex-col align-middle">
              <div>
                <h1 className="font-semibold text-5xl pb-4 text-center">Grey College JCR Shop</h1>
              </div>
              <div className="text-2xl">
                <p>Welcome to the new Grey College JCR Shop!</p>
              </div>
              {loggedIn ? (
                <div className="text-xl">
                  <p>To get started, click on 'Order Stash' or 'Order Toastie' in the navigation bar.</p>
                </div>
              ) : (
                <div className="text-xl">
                  <p>To get started, login using your Durham CIS account.</p>
                </div>
              )}
              <div>
                <img
                  src="/images/grey_crest.svg"
                  alt="Grey College Crest"
                  className="p-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

HomePage.contextType = authContext;

export default HomePage;
