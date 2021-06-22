import React from 'react';
import { Link } from 'react-router-dom';
import HomeSlideshow from './HomeSlideshow';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import RoleComponent from '../jcr/roles/RoleComponent';
import smoothscroll from 'smoothscroll-polyfill';

smoothscroll.polyfill();

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.eventsSection = React.createRef();

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

  scrollToEvents = e => {
    e.preventDefault();

    // Deals with different behaviour on iOS Safari and Google Chrome on desktop
    const screenOffset = window.screen.width <= 700 ? 0 : window.screen.height / 2;

    window.scrollTo({
      top: this.eventsSection.current.offsetTop + screenOffset,
      left: 0,
      behavior: "smooth"
    });
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
            <div className="w-full lg:w-1/2 border-white border-opacity-25 border-2 p-2 lg:mx-4 hover:border-opacity-100 transition-all ease-in-out duration-700 lg:my-0 my-2 flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-4xl">Sports and Societies</h2>
                <p className="py-4 text-lg">At Grey, we offer one of the widest range of Sports and Societies (more commonly referred to as 'Sport and Socs') out of any other colleges in Durham. From the mainstream, to the downright bizarre, we are confident that there will be at least one to suit your taste!</p>
              </div>
              <Link to="/sportsandsocs">
                <button
                  className="bg-white rounded text-grey-500 font-semibold text-2xl p-2 w-full"
                >Find out more!</button>
              </Link>
            </div>
            <div className="w-full lg:w-1/2 border-white border-opacity-25 border-2 p-2 lg:mx-4 hover:border-opacity-100 transition-all ease-in-out duration-700 lg:my-0 my-2 flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-4xl">Events</h2>
                <p className="py-4 text-lg">The JCR organises events throughout the year for the members of the JCR. Most of these are led by the Events Manager and the Events Committee. They offer many events throughout the year such as the Winter Ball, Grey Day, Phoenix Ball, and many others. There are also a few other big events throughout the year such as the The President's Guest Night, the Sportsperson Formal, and the Grey College Charity Fashion Show.</p>
                  <button
                    className="bg-white rounded text-grey-500 font-semibold text-2xl p-2 w-full"
                    onClick={this.scrollToEvents}
                  >See what's on offer</button>
              </div>
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
        <div className="w-full px-2 lg:px-12 py-2 flex flex-col items-center bg-red-900 text-white">
          <div className="w-full px-2 lg:px-0 lg:w-3/5 flex flex-col">
            <h2 className="font-semibold text-5xl pb-1" ref={this.eventsSection}>Events</h2>
            <div className="flex lg:flex-row flex-col justify-between">
              <div className="lg:py-0 pb-2">
                <p className="py-1 text-lg">Events in Grey are organised by students, with a wide variety throughout the year. They're primarily organised by the Events Manager, but everyone can get involved, by being a chair of an event, or just by being a member of Events Committee. Just ask around if you're interested.</p>
                <p className="py-1 text-lg">There are so many events and formals on at Grey throughout the year, some of the highlights of the year are:</p>
                <ul className="p-1 text-lg list-inside list-disc">
                  <li>Themed Bops (such as Neon and Halloween Bop)</li>
                  <li>Informal / Winter Ball</li>
                  <li>Barfest</li>
                  <li>Charity Fashion Show</li>
                  <li>Phoenix Gala</li>
                  <li>Grey Day</li>
                  <li>Phoenix Ball</li>
                  <li>George Palmer Rugby 7s</li>
                </ul>
                <p className="py-1 text-lg">As well as large events throughout the year the JCR also hosts Formals which are fancy dinners organised by the Vice President that occur every few weeks in term time. During these, you'll have to wear your gown so it is the perfect chance to look your best in pictures for your family and friends back home.</p>
                <p className="py-1 text-lg">Formals are really popular, with tickets selling out quickly – a testament to how fun they are! These are often themed events such as a Christmas Formal, Burns' Night, Valentine's, Sportspersons and Stress-Less. Even if you miss out, it's worth heading down to the Greyhound afterwards, as it is always packed with loads of people.</p>
              </div>
              <img
                src="/images/home/events_collage.jpg"
                style={{width: "500px"}}
                className="h-auto hidden lg:block ml-2"
              />
              <img
                src="/images/home/events_collage.jpg"
                className="w-full h-auto lg:hidden"
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
