import React from 'react';
import { Redirect, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

class GymTermsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    try {
      await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status", isMember: false });
      return;
    }

    this.setState({ loaded: true, status: 200 });
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
        <div className="container mx-auto text-justify pt-4 md:p-4 md:w-3/5 w-full">
          <div className="flex flex-row justify-start mb-2">
            <Link to="/gym">
              <button
                className="px-4 py-2 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >← Back to the Gym</button>
            </Link>
          </div>
          <h1 className="font-semibold text-5xl pb-4 text-center">Gym: Terms and Conditions</h1>
          <p className="py-1">The JCR reserves the right to revoke access and membership to Grey Gym at their absolute discretion.</p>
          <p className="underline py-1">Students should ensure that they:</p>
          <ul className="list-inside p-2">
            <li>- Always exercise with at least one other person in their ‘household’</li>
            <li>- Have completed the DUO induction and do not allow other students who have not completed the gym induction and hold an active membership, access to the Gym</li>
            <li>- Clean to the best of their ability before and after a session</li>
            <li>- Never exercise with people who are not a member of their ‘household’</li>
            <li>- Always book a gym session and ensure that they leave promptly after their session finishes</li>
          </ul>
          <p className="py-1">Students who contravene the above points may be liable to action taken under the College Gym Discipline Policy and their access may be withdrawn, without refund.</p>
          <p className="py-1">Gym memberships are non-refundable after 14 days of signing up. If you decided to cancel within the 14-day period, the JCR will deduct the duration of gym membership used until cancellation.</p>
        </div>
      </div>
    );
  }
}

GymTermsPage.contextType = authContext;

export default GymTermsPage;
