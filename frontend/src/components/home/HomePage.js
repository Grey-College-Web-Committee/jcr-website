import React from 'react';
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

  renderCommittee = () => {
    const membersByPosition = this.state.execMembers.sort((a, b) => a.position - b.position);

    return (
      <div>
        {
          this.state.execCommittee.description.split("\n").map((line, i) => (
            line.length === 0 ? null : <p key={i} className="py-1">{line}</p>
          ))
        }
        <div className="grid grid-cols-3 gap-1 md:grid-cols-6 lg:grid-cols-6 2xl:grid-cols-8 2xl:gap-4 auto-rows-fr">
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
        <div className="flex flex-col lg:flex-row lg:justify-between border-b-2 lg:border-b-4 border-red-900">
          <div className="w-full lg:w-3/4 p-2 border-t-2 border-red-900 lg:border-0">
            <h2 className="font-semibold text-3xl">Executive Committee</h2>
            {
              execMembers === null ? (
                <LoadingHolder />
              ) : this.renderCommittee()
            }
          </div>
          <div className="w-full lg:w-1/4 border-t-4 lg:border-t-0 border-red-900 lg:border-l-2 border-red-900 p-2">
            <h2 className="font-semibold text-3xl">Social Media</h2>
            <p className="py-1">The JCR operates many social media accounts and there are specific ones for each sport and society in Grey. They are one of the best way to keep up-to-date with what is happening in Grey. Each week, on a Friday evening, the JCR President sends out an email summarising everything important happening in the week ahead so make sure to watch for those!</p>
            <div className="flex flex-col">
              <div className="flex flex-row justify-between border-t-2 border-b-2 py-2">
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-semibold">Grey Sabbs</h3>
                </div>
                <div>
                  <a href="https://www.instagram.com/grey_sabbs/" target="_blank" rel="noopener noreferrer">
                    <img
                      className="w-8 h-8"
                      src="/images/socials/Instagram_Glyph_Gradient_RGB.png"
                      alt="Instagram"
                    />
                  </a>
                </div>
              </div>
              <div className="flex flex-row justify-between border-b-2 py-2">
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-semibold">Grey College</h3>
                </div>
                <div>
                  <a href="https://www.facebook.com/greycollegejcr" target="_blank" rel="noopener noreferrer">
                    <img
                      className="w-8 h-8"
                      src="/images/socials/f_logo_RGB-Blue_100.png"
                      alt="Facebook"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full p-2">
          <h2 className="font-semibold text-3xl">Life at Grey</h2>
          <p className="py-1">Grey College offers a huge amount of opportunities and many of them are organised by the Junior Common Room (JCR) which consists of the majority of students studying at Grey College. Add some stuff... To do:</p>
          <ul>
            <li>Sports</li>
            <li>Events</li>
          </ul>
        </div>
      </div>
    );
  }
}

HomePage.contextType = authContext;

export default HomePage;
