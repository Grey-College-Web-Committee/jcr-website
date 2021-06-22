import React from 'react';
import { Link } from 'react-router-dom';
import HomeSlideshow from './HomeSlideshow';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import RoleComponent from '../jcr/roles/RoleComponent';

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      execMembers: null
    }
  }

  componentDidMount = async () => {
    let execResult;

    try {
      execResult = await api.get("/jcr/committee/name/exec");
    } catch (error) {
      alert("Unable to load");
      return;
    }

    const { committeeMembers, committee } = execResult.data;

    this.setState({ execMembers: committeeMembers, execCommittee: committee });
  }

  renderExecCommittee = () => {
    const membersByPosition = this.state.execMembers.sort((a, b) => a.position - b.position);

    return (
      <div>
        {
          this.state.execCommittee.description.split("\n").map((line, i) => (
            line.length === 0 ? null : <p key={i} className="py-1 text-lg">{line}</p>
          ))
        }
        <div className="grid grid-cols-3 gap-1 md:grid-cols-6 lg:grid-cols-6 2xl:grid-cols-6 2xl:gap-4 auto-rows-fr py-1">
          {
            membersByPosition.map((entry, i) => (
              <React.Fragment key={i}>
                {entry.JCRRole.JCRRoleUserLinks.map((link, j) => (
                  <RoleComponent
                    key={`${i}-${j}`}
                    role={entry.JCRRole}
                    user={link.User}
                    vacant={false}
                    clickable={false}
                  />
                ))}
                {entry.JCRRole.JCRRoleUserLinks.length === 0 ? (
                  <RoleComponent
                    key={`${i}-vacant`}
                    role={entry.JCRRole}
                    user={null}
                    vacant={true}
                    clickable={false}
                  />
                ): null}
              </React.Fragment>
            ))
          }
        </div>
      </div>
    );
  }

  render () {
    const loggedIn = this.context !== undefined && this.context !== null;
    const { execMembers } = this.state;

    return (
      <div className="flex flex-col">
        <HomeSlideshow />
        <div className="w-full p-2 flex flex-col bg-red-900 text-white items-center">
          <div className="flex flex-col lg:flex-row lg:justify-between w-full lg:w-3/5 p-2">
            <div className="w-full lg:w-1/2 border-white border-opacity-25 border-2 p-2 lg:mx-4 hover:border-opacity-100 transition-all ease-in-out duration-700 lg:my-0 my-2">
              <h2 className="font-semibold text-4xl">Sports and Societies</h2>
              <p className="py-4 text-lg">At Grey, we offer one of the widest range of Sports and Societies (more commonly referred to as 'Sport and Socs') out of any other colleges in Durham. From the mainstream, to the downright bizarre, we are confident that there will be at least one to suit your taste!</p>
              <Link to="/sportsandsocs">
                <button
                  className="bg-white rounded text-grey-500 font-semibold text-2xl p-2 w-full"
                >Find out more!</button>
              </Link>
            </div>
            <div className="w-full lg:w-1/2 border-white border-opacity-25 border-2 p-2 lg:mx-4 hover:border-opacity-100 transition-all ease-in-out duration-700 lg:my-0 my-2">
              <h2 className="font-semibold text-4xl">Events</h2>
              <p className="py-4 text-lg">Stuff here... will have a button??</p>
            </div>
          </div>
        </div>
        <div className="w-full px-2 lg:px-12 py-2 flex flex-col items-center">
          <div className="w-full px-2 lg:px-0 lg:w-3/5 flex flex-col">
            <h2 className="font-semibold text-5xl pb-1">The JCR</h2>
            <p className="py-1 text-lg">Grey JCR, or Junior Common Room, is more than just the room within the college. It is a charitable student run organisation that operates within Grey College to supply a student community. Grey JCR is run by students for all the students of Grey. All of the sports and societies, events and facilities fall under the JCR. The membership fee you pay at the start of your time in Grey goes directly towards improving facilities run by the JCR, as well as the day-to-day budgets of all the sports, societies, and events.</p>
            <p className="py-1 text-lg">The major decision-making regarding how the JCR spends its money, who gets elected to what positions, and any votes/referendums occur during JCR meetings. These are usually around 60 to 90 minutes every few weeks on Sundays. They're quite chilled, where you can turn up with a laptop, have a drink, and buy some snacks. They're open to all JCR members, and you don't have to have any prior experience: getting involved couldn't be easier!</p>
            <p className="py-1 text-lg">You can keep up to date with what is going on in the JCR by checking our social media accounts or reading the regular emails from the JCR such as the Prez Weekly summarising everything happening the following week - these are usually sent on a Friday evening so keep an eye out for them!</p>
            <div className="flex flex-row justify-around py-2">
              <a href="https://www.instagram.com/grey_sabbs" target="_blank" rel="noopener noreferrer">
                <img
                  className="w-14 h-14"
                  src="/images/socials/Instagram_Glyph_Gradient_RGB.png"
                />
              </a>
              <a href="https://www.facebook.com/greycollegejcr" target="_blank" rel="noopener noreferrer">
                <img
                  className="w-14 h-14"
                  src="/images/socials/f_logo_RGB-Blue_100.png"
                />
              </a>
            </div>
            <div>
              { execMembers !== null ? this.renderExecCommittee() : <LoadingHolder /> }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

HomePage.contextType = authContext;

export default HomePage;
