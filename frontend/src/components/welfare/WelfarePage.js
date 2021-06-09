import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import PersonElement from './PersonElement';

const bios = {
  "TUITE": "Hey, my name is Fiona I'm a second year studying human geography. You'll find me playing netball (badly) eating all the college yogurt or colouring in, I do take geography after all...",
  "DOCHERTY": "Hi I’m Lucy, I’m a first year studying Psychology. You can usually find me in Grey bar with my friends (always with a toastie in hand, of course), playing hockey, or in the Billy B trying to understand statistics. I’m so happy to be on the welfare team this year and look forward to meeting you all!",
  "DANDY": "Hi everyone, I’m Joe a second year engineer. I’m so excited to be a part of welfare this year and I can’t wait to meet you all! When I’m not building bridges (or whatever engineers are supposed to be doing) I’m playing dodgeball for both university and Grey teams."
}

class WelfarePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      welfareTeam: []
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status", isMember: false });
      return;
    }

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
      return;
    }

    let result;

    try {
      result = await api.get("/jcr/committee/name/welfare");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error, loaded: false });
    }

    this.setState({ loaded: true, status: 200, welfareTeam: result.data.committeeMembers });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/membership" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    const { welfareTeam } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="mx-auto text-center p-4 md:w-4/5">
          <h1 className="font-semibold text-5xl pb-2">Welfare</h1>
          <div className="text-justify p-2 border-b-2 border-red-900 mb-2">
            <h2 className="text-left font-semibold text-3xl">How do you find us?</h2>
            <p className="mb-2">We run drop-in hours 3 times a week, in the evening/afternoon, during which anyone can drop in to talk to the team member on duty about anything, in confidence. Welfare hours are held in the Welfare Room which is located on the bottom floor of Hollingside, opposite the laundry room. They are <span className="font-semibold">held on Tuesday and Thursday 6.30-8.30pm and Sunday 2-4pm.</span></p>
            <p className="mb-2">We can also be found <a href="https://www.facebook.com/greycollegewelfare/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">on Facebook</a> and <a href="https://www.instagram.com/greywelfare/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">on Instagram</a>.</p>
            <p className="mb-2">So make sure you all look out for the Welfare team: we are here to support you anytime you need it, to make sure everyone enjoys their university experience as much as they can.</p>
          </div>
          <div className="text-justify p-2 border-b-2 border-red-900 mb-2">
            <h2 className="text-left font-semibold text-3xl">Who are we?</h2>
            <p>Click on our profiles to learn a bit more about each of us!</p>
            <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 2xl:gap-4 auto-rows-fr">
              { welfareTeam.map((role, i) => (
                <React.Fragment key={i}>
                  {
                    role.JCRRole.JCRRoleUserLinks.map((person, j) => (
                      <PersonElement
                        key={`${i}-${j}`}
                        role={role.JCRRole}
                        user={person.User}
                        bio={bios[person.User.surname] === undefined ? "" : bios[person.User.surname]}
                      />
                    ))
                  }
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row text-justify md:border-b-2 md:border-red-900 md:mb-2">
            <div className="p-2 flex-1 border-b-2 border-red-900 mb-2 md:border-none md:mb-0">
              <h2 className="text-left font-semibold text-3xl">Anonymous Online Support</h2>
              <p className="mb-2">You can use the <Link to="/welfare/message/" className="font-semibold underline">anonymous online support system</Link> to send an anonymous message to the Senior Welfare Officers from whom you should receive a reply from within 24 hours. You could report an incident (such as egging, drink spiking) to enable us to warn other students about it. You could ask us a question if you prefer not to talk directly. Or you can simply use it as an easy way of sending us your thoughts. Here are a few of the things you might want to write about:</p>
              <ul className="mb-2">
                <li>Request information like leaflets, names of charities, phone numbers etc.</li>
                <li>Tell us you'd like to see more coverage of a certain issue, illness or disability.</li>
                <li>Let us know you are worried about a friend.</li>
                <li>Suggest how we could improve campaign weeks (SHAG week, Stressless, Alcohol Awareness)</li>
                <li>Request certain supplies, and we can leave it in a discreet place for you.</li>
              </ul>
            </div>
            <div className="p-2 flex-1 border-b-2 border-red-900 mb-2 md:border-none md:mb-0">
              <h2 className="text-left font-semibold text-3xl">Sexual Health</h2>
              <h3 className="text-left font-semibold text-xl">Pregnancy Tests</h3>
              <p className="mb-2">Free pregnancy tests can be taken from the welfare room at any time during drop in. The test is very simple and only takes a few minutes. Please contact the anonymous online support system if you would like a test out of drop in hours or would like them to help you.</p>
              <h3 className="text-left font-semibold text-xl">Condoms and Dental Dams</h3>
              <p className="mb-2">Condoms, lube and dental dams are all free, and are available in a range of sizes and types, including female and latex-free. They can be picked up in drop-ins or by messaging the anonymous online support system.</p>
            </div>
          </div>
          <div className="text-justify">
            <h2 className="text-left font-semibold text-3xl px-2">Get Involved</h2>
            <div className="flex flex-col md:flex-row text-justify md:border-b-2 md:border-red-900 md:mb-2">
              <div className="flex-1 p-2 border-b-2 border-red-900 mb-2 md:border-none md:mb-0">
                <h3 className="text-left font-semibold text-xl">College Welfare Team</h3>
                <p className="mb-2">Would you like to get involved in welfare? Whilst at Durham, there are several opportunities to get involved in welfare: be at Grey, through Nightline or Durham SU.</p>
                <p className="mb-2">The new Welfare team will be picked during the second term of the year (Epiphany). The Senior Officers are elected in second term and anyone can run. If you would like to apply to be on the Welfare team or run for the role as a Welfare Officer – feel free to get in touch with the current team to answer any questions you might have.</p>
              </div>
              <div className="flex-1 p-2 border-b-2 border-red-900 mb-2 md:border-none md:mb-0">
                <h3 className="text-left font-semibold text-xl">Nightline</h3>
                <p className="mb-2">Nightline is a listening service run by students for students and is open every night of term between 9pm and 7am. They are there to listen to you about anything on your mind such as friends, relationships, stress, late night thoughts, and more.</p>
                <p className="mb-2">Nightline is based on 5 principles: confidentiality, anonymity, non-advisory, non-judgmental, and non-aligned. So, you can be ensured that every conversation remains between the caller and volunteer and that your identity will remain anonymous. As well, they are non-directive/non-advisory respecting your right to make your own decisions, and are both non-judgmental and non-aligned respecting each person's thoughts, beliefs, and actions.</p>
                <p className="mb-2">You can contact them by calling their number which is found on DUO and the back of your campus card or online via their instant messaging system which can be found on <a href="https://durhamnightline.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">their website</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

WelfarePage.contextType = authContext;

export default WelfarePage;
