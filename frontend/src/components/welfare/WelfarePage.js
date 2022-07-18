import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import PersonElement from './PersonElement';

const bios = {
  "COTTRILL": "Hi my name is Amy and I study English and History. You can normally find me attempting to play mixed lacrosse, hunting for some mandarin yogurts in the canteen or in the Billy B reading Austen! I’m so excited to be on the welfare team this year and getting more involved in life at Grey!",
  "SPILLANE": "Hi, my name is Scarlett and I study Natural Sciences. You will find me in the library or TLC trying to do my summatives, or in Jimmy’s or Grey bar, avoiding them…. I’m so happy to be part of the welfare team again this year, as one of your senior welfare officers.",
  "SAUNDERS": "Hi I’m Charlie, I’m a first year philosophy student and one of your welfare officers this year! Please feel free to say hello, you can usually find me in the greyhound annoying Nic or sending cute cow photos to my friends!",
  "CUNNINGHAM": "Hiii, my name is Paris and I study Psychology. If I’m not busy with my current hyper-fixation of the week, or mid giving my friends an overly detailed rundown of my current thoughts, then you’ll usually catch me reading, listening to music, or working down at the Queens Head. I’m overjoyed to be on the Welfare team as I’m always happy to lend an ear, or simply have a good ol’ chit chat!",
  "KWAN": "Hi! I'm Olga and I do Philosophy and Psychology. You can usually find me hanging out around the theatres in Durham! You can come talk to me about anything but especially queer or international student-related things – I'm also fluent in Cantonese and Mandarin, for those who feel more comfortable speaking in their native language.",
  "CLARK": "Hi I’m Phoebe and I’m a modern languages student studying German and Spanish. I’m so excited to be part of the welfare team this year, and when I’m back from my year abroad, you might find me attempting to play netball or cox, but more likely I’ll be tucking into a toastie in the JCR 🙂",
  "DONALDSON": "Hey everyone! I’m Jess and I’m one of your welfare officers this year! I study history and aside from complaining about how much I hate my degree, you can usually find me on various committees around college or getting involved with college events. I’m always up for a chat so feel free to have a natter whenever you see me around! 🙂",
  "BODDINGTON": "Hey guys I’m Tom and I study engineering! I’m so excited to be a welfare member this year and be more involved with people around college despite living out. Whilst I’m usually skipping a 9am lecture you can also find me doing some form of sport or bingeing random shows. I’m always up for a chat so feel to say hi.",
  "GADIAN": "Hi, my name is Georgie and I’m a Londoner studying Classics here at Grey. You can always find me walking across Kingsgate bridge or on Level 1 of the Billy B - however, as I’m chatty but short, if I’m with friends you’ll probably hear me before you see me! I’m really looking forward to being on the Welfare team this year and I’m always up for a coffee and a chat!",
  "SABBAGH": "Hello I’m Riannah and I’ll be one of your welfare officers this year 🙂 . I study psychology and you can usually find me in the Billy B drinking multiple iced lattes or in Grey bar eating toasties. I’m always up for a chat so if you see me around college don’t feel afraid to say Hi! I’m so excited to be a part of the welfare team this year!"
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

      return (
        <LoadingHolder />
      );
    }

    const { welfareTeam } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="relative">
          <img
            src="/images/welfare_banner.jpg"
            className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
            alt="Welfare Banner"
          ></img>
          <img
            src="/images/welfare_banner.jpg"
            className="w-full h-auto relative z-0 block lg:hidden"
            alt="Welfare Banner"
          ></img>
          <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
            <div className="flex flex-row align-middle items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold outline">Welfare</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col my-4 justify-center items-left md:w-3/5 md:mx-auto mx-2">
          <div>
            <div className="mb-2">
              <h2 className="text-left font-semibold text-3xl mb-1">What do we do?</h2>
              <p className="mb-2">We provide a <span className="font-semibold">free, confidential, non-judgemental listening and signposting service</span> for all students in Grey College as well as <Link className="font-semibold underline" to="/welfare/message">an anonymous messaging service</Link> and much more! You can find out about everything we offer further down the page. We run drop-ins every week during term time in the Welfare Room (which is located on the bottom floor of Hollingside, opposite the laundary room), where a team member will be on duty who you can talk to about anything, in confidence. Our drop-in times are:</p>
              <div className="flex flex-row lg:justify-start justify-center text-xl">
                <ul className="mb-2 list-inside list-disc">
                  <li>Tuesdays at 6:30pm - 8:30pm</li>
                  <li>Thursdays at 6:30pm - 8:30pm</li>
                  <li>Sundays at 2pm - 4pm</li>
                </ul>
              </div>
              <p className="mb-2">We also run campaign weeks throughout the year focusing on specific issues such as Stressless week near exams, Alcohol Awareness week and SHaG week (Sexual Health and Guidance). You{"'"}ll also find us in Freshers{"'"} Week wearing our blue polos, come and chat to us! To keep up to date with what we're up to check out our social media for the latest information!</p>
              <div className="flex flex-col lg:items-start items-center">
                <a href="https://www.instagram.com/greywelfare/" rel="noopener noreferrer" target="_blank">
                  <div className="flex flex-row items-center my-2">
                    <img
                      src="./images/socials/Instagram_Glyph_Gradient_RGB.png"
                      className="h-8 w-8 mr-2"
                    />
                  <span className="font-semibold">@greywelfare (click to open Instagram)</span>
                  </div>
                </a>
                <a href="https://www.facebook.com/greycollegewelfare" rel="noopener noreferrer" target="_blank">
                  <div className="flex flex-row items-center mt-2">
                    <img
                      src="./images/socials/f_logo_RGB-Blue_100.png"
                      className="h-8 w-8 mr-2"
                    />
                  <span className="font-semibold">@greycollegewelfare (click to open Facebook)</span>
                  </div>
                </a>
              </div>
            </div>
            <div className="mb-2">
              <h2 className="text-left font-semibold text-3xl mb-1">Who are we?</h2>
              <p className="mb-2">The Welfare Team is student-run and led by the two Senior Welfare Officers. We study a variety of subjects and cover all different years of study. Click on our pictures below to find out a bit more about each of us!</p>
              <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 2xl:gap-4 auto-rows-fr">
                { welfareTeam.map((role, i) => (
                  <React.Fragment key={i}>
                    {
                      role.JCRRole.JCRRoleUserLinks.map((person, j) => (
                        <PersonElement
                          key={`${i}-${j}`}
                          role={role.JCRRole}
                          user={person.User}
                          bio={bios[person.User.surname.trim().toUpperCase()] === undefined ? "" : bios[person.User.surname.trim().toUpperCase()]}
                        />
                      ))
                    }
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="mb-2">
              <h2 className="text-left font-semibold text-3xl mb-1">Sexual Health</h2>
              <h3 className="text-left font-semibold text-xl mb-1">Condoms and Dental Dams</h3>
              <p className="mb-2">Condoms, lube and dental dams are all free, and are available in a range of sizes and types, including female and latex-free. They can be picked up in drop-ins or by messaging the anonymous online support system.</p>
              <h3 className="text-left font-semibold text-xl mb-1">Pregnancy Tests</h3>
              <p className="mb-2">Free pregnancy tests can be taken from the welfare room at any time during drop in. The test is very simple and only takes a few minutes. Please contact the anonymous online support system if you would like a test out of drop in hours or would like them to help you.</p>
            </div>
            <div className="mb-2">
              <h2 className="text-left font-semibold text-3xl mb-1">Anonymous Messaging Service</h2>
              <p className="mb-2">You can use the anonymous online support system to send an anonymous message to the Senior Welfare Officers from whom you should receive a reply from within 24 hours. You could report an incident (such as egging, drink spiking) to enable us to warn other students about it. You could ask us a question if you prefer not to talk directly. Or you can simply use it as an easy way of sending us your thoughts. Here are a few of the things you might want to write about:</p>
              <ul className="my-1 list-inside list-disc">
                <li>Request information like leaflets, names of charities, phone numbers etc.</li>
                <li>Tell us you'd like to see more coverage of a certain issue, illness or disability.</li>
                <li>Let us know you are worried about a friend.</li>
                <li>Suggest how we could improve campaign weeks (SHAG week, Stressless, Alcohol Awareness)</li>
                <li>Request certain supplies, and we can leave it in a discreet place for you.</li>
              </ul>
            </div>
            <div className="mb-2">
              <h2 className="text-left font-semibold text-3xl mb-1">Getting Involved</h2>
              <h3 className="text-left font-semibold text-xl mb-1">College Welfare Team</h3>
              <p className="mb-2">Would you like to get involved in welfare? Whilst at Durham, there are several opportunities to get involved in welfare: be at Grey, through Nightline or Durham SU.</p>
              <p className="mb-2">The new Welfare team will be picked during the second term of the year (Epiphany). The Senior Officers are elected in second term and anyone can run. If you would like to apply to be on the Welfare team or run for the role as a Welfare Officer feel free to get in touch with the current team to answer any questions you might have.</p>
              <h3 className="text-left font-semibold text-xl mb-1">Nightline</h3>
              <p className="mb-2">Nightline is a listening service run by students for students and is open every night of term between 9pm and 7am. They are there to listen to you about anything on your mind such as friends, relationships, stress, late night thoughts, and more.</p>
              <p className="mb-2">Nightline is based on 5 principles: confidentiality, anonymity, non-advisory, non-judgmental, and non-aligned. So, you can be ensured that every conversation remains between the caller and volunteer and that your identity will remain anonymous. As well, they are non-directive/non-advisory respecting your right to make your own decisions, and are both non-judgmental and non-aligned respecting each person's thoughts, beliefs, and actions.</p>
              <p className="mb-2">You can contact them by calling their number which is found on the back of your campus card or online via their instant messaging system which can be found <a className="font-semibold underline" rel="noopener noreferrer" target="_blank" href="https://durhamnightline.com/">on their website.</a></p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

WelfarePage.contextType = authContext;

export default WelfarePage;
