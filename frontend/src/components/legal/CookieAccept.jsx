import React from 'react';
import { Link } from 'react-router-dom';

class CookieAccept extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      display: localStorage.getItem("cookiesApproved") === null || localStorage.getItem("cookiesApproved") !== "true"
    };
  }

  acceptCookies = () => {
    localStorage.setItem("cookiesApproved", "true");
    this.setState({ display: localStorage.getItem("cookiesApproved") === null || localStorage.getItem("cookiesApproved") !== "true" });
  }

  render () {
    if(this.state.display) {
      return (
        <div className="text-white w-full h-auto flex flex-col justify-center items-center text-center md:flex-row p-4 flex-shrink-0" style={{backgroundColor: "#1B1C1D"}}>
          <h2 className="py-1 font-bold md:mr-2 text-lg md:text-base">Cookies<span className="hidden md:inline">:</span></h2>
          <p className="py-1 md:mr-2">This website uses cookies for authentication and payment purposes. For <Link to="/cookies" className="underline">more details click here</Link>.</p>
          <div>
            <button
              className="px-4 py-1 rounded bg-red-900 text-white w-32 h-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 my-2 md:my-0"
              onClick={this.acceptCookies}
            >Accept</button>
          </div>
        </div>
      );
    }

    return null;
  }
}

export default CookieAccept;
