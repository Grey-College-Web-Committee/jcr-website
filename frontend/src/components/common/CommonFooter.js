import React from 'react';
import { Link } from 'react-router-dom';

class CommonFooter extends React.Component {
  render () {
    return (
      <footer className="w-full border-red-900 border-t-4 py-4 px-4 text-center justify-between flex-shrink-0 text-white mt-4 flex flex-col lg:text-left lg:py-2 lg:flex-row" style={{backgroundColor: "#1B1C1D", backgroundImage: "url('/images/footer-bg.png')", backgroundPosition: "30% 50%", backgroundRepeat: "no-repeat"}}>
        <div>
          <p>© Grey College {new Date().getYear() + 1900}</p>
          <Link to="/cookies"><p className="underline">Cookie Policy</p></Link>
        </div>
        <div className="lg:text-right flex flex-col lg:items-end">
          <Link to="/contributors"><p className="underline">Contributors and Image Attributions</p></Link>
          <a href="https://github.com/Grey-College-Web-Committee/grey-shop" target="_blank" rel="noopener noreferrer">
            <div className="flex flex-row items-center justify-center lg:justify-start">
              <span className="mr-2 underline">Contribute on GitHub</span>
              <img
                src="/images/GitHub-Mark-Light-32px.png"
                className="h-4"
              />
            </div>
          </a>
        </div>
      </footer>
    )
  }
}

export default CommonFooter;
