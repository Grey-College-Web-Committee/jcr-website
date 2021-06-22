import React from 'react';
import { Link } from 'react-router-dom';
import authContext from '../../utils/authContext.js';

class CommonFooter extends React.Component {
  render () {
    return (
      <footer className="w-full bg-grey-900 border-red-900 border-t-4 py-4 px-4 text-center justify-between flex-shrink-0 text-white flex flex-col sm:text-left sm:py-2 sm:flex-row" style={{backgroundImage: "url('/images/footer-bg.png')", backgroundPosition: "30% 50%", backgroundRepeat: "no-repeat"}}>
        <div>
          <p>© Grey College Junior College Room {new Date().getYear() + 1900}</p>
          <a href="https://register-of-charities.charitycommission.gov.uk/charity-search/-/charity-details/5019056/" target="_blank" rel="noopener noreferrer"><p className="underline">Registered Charity Number: 1142887</p></a>
          <a href="https://www.greyassociation.co.uk/" target="_blank" rel="noopener noreferrer"><p className="underline">Grey Association</p></a>
          <a href="https://www.durham.ac.uk/colleges-and-student-experience/colleges/grey/"><p className="underline">Durham University: Grey College</p></a>
        </div>
        <div className="sm:text-right flex flex-col sm:items-end">
          <Link to="/cookies"><p className="underline">Cookie Policy</p></Link>
          <Link to="/contributors"><p className="underline">Contributors and Image Attributions</p></Link>
          <a href="https://github.com/Grey-College-Web-Committee/grey-shop" target="_blank" rel="noopener noreferrer">
            <div className="flex flex-row items-center justify-center sm:justify-start">
              <span className="mr-2 underline">Contribute on GitHub</span>
              <img
                src="/images/GitHub-Mark-Light-32px.png"
                className="h-4"
                alt="GitHub logo"
              />
            </div>
          </a>
        </div>
      </footer>
    )
  }
}

CommonFooter.contextType = authContext;

export default CommonFooter;
