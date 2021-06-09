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
                <h1 className="font-semibold text-5xl pb-4 text-center">Grey College JCR</h1>
              </div>
              <div className="text-2xl">
                <p>Welcome to the new Grey College JCR website!</p>
              </div>
              {loggedIn ? null : (
                <div className="text-xl">
                  <p>To get started, login using your Durham CIS account.</p>
                </div>
              )}
              <img
                src="/images/grey_crest.svg"
                alt="Grey College Crest"
                className="pt-4 w-4/5 mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

HomePage.contextType = authContext;

export default HomePage;
