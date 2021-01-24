import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import PersonElement from './PersonElement';

const welfareTeam = [
  {
    role: "Senior Welfare Officer",
    name: "Luke Hopkins",
    image: "./images/welfare/luke_hopkins.jpg",
    bio: "Hi everyone! I’m Luke, a fourth year reading Risk (MSc), and I’m one of your senior welfare officers! I love being part of Grey College Boat Club, exploring on adventures and just chilling with friends. I am a little country farmer boy from Cornwall, cats and dogs are equal in my eyes so I’m sure we’ll have a lot to talk about. I am so excited to meet all of you soon!"
  },
  {
    role: "Senior Welfare Officer",
    name: "Hannah Richards",
    image: "./images/welfare/hannah_richards.jpg",
    bio: "Hey Grey! I’m Hannah, a third year studying English, Spanish and Art History and am delighted to be your Senior Welfare Officer this year! In my spare time I will usually either be eating or sleeping, but I also love art, baking and my dog. I cant wait to meet you all this coming year!"
  },
  {
    role: "Welfare",
    name: "Olivia Spillane",
    image: "./images/welfare/olivia_spillane.jpg",
    bio: "Hey Grey! I’m Olivia, but everyone calls me Lily. I’m a second year music student, and can’t wait to be a part of the welfare team again. In my spare time, I love to perform, both with college and the university as a whole, so I’m sure I will see a lot of you around!"
  },
  {
    role: "Welfare",
    name: "Samuel James",
    image: "./images/welfare/samuel_james.jpg",
    bio: "Hi! I am Sam, a first year Geology student and I am very exited to be a member of the Grey Welfare Team! When I am not looking at rocks, I tend to spend my life at Grey either playing pool or having a midday nap. Apart from that, I like to draw, listen to music and binge Netflix. I am really looking forward to meeting you all very soon!"
  },
  {
    role: "Welfare",
    name: "Fiona Tuite",
    image: "./images/welfare/fiona_tuite.jpg",
    bio: "Hey, my name is Fiona I'm a second year studying human geography. You'll find me playing netball (badly) eating all the college yogurt or colouring in, I do take geography after all..."
  },
  {
    role: "Welfare",
    name: "Joseph Dandy",
    image: "./images/welfare/joseph_dandy.jpg",
    bio: "Hi everyone, I’m Joe a second year engineer. I’m so excited to be a part of welfare this year and I can’t wait to meet you all! When I’m not building bridges (or whatever engineers are supposed to be doing) I’m playing dodgeball for both university and Grey teams."
  },
  {
    role: "Welfare",
    name: "Lucy Docherty",
    image: "./images/welfare/lucy_docherty.jpg",
    bio: "Hi I’m Lucy, I’m a first year studying Psychology. You can usually find me in Grey bar with my friends (always with a toastie in hand, of course), playing hockey, or in the Billy B trying to understand statistics. I’m so happy to be on the welfare team this year and look forward to meeting you all!"
  },
  {
    role: "Welfare",
    name: "Emily Hassard",
    image: "./images/welfare/emily_hassard.jpg",
    bio: "Hey, I’m Emily a second year Natural Sciences student and I’m super excited to being part of the Welfare Team this year! You’ll most likely see me with a tea or coffee in hand out having a chat but I also enjoy playing hockey and netball for college. I’m really looking forward to this coming year and getting meet you all!"
  },
  {
    role: "Welfare",
    name: "Megan Stuart",
    image: "./images/welfare/megan_stuart.jpg",
    bio: "Hello! I’m Megan, a 3rd year liberal arts student studying Chinese and History. I’ve spent the last year abroad but I can’t wait to get stuck in with college life again. Find me singing in choir, playing netball or generally being a keen bean around Grey!"
  },
  {
    role: "Welfare",
    name: "Eszter Smatrola",
    image: "./images/welfare/eszter_smatrola.jpg",
    bio: "Hey Grey! I’m Eszter, a second year from Hungary and I am studying Psychology and Economics here in Durham. I am super excited to be on the Welfare team this year and I can’t wait to get to know all of you! In my free time I like to take naps, chill in bed binging something on Netflix and going out with my friends. I also like to look at memes and cute puppies on Instagram. I’m so excited to meet you all in person!"
  }
]

class WelfarePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: []
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

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/some/path");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, content: content });
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
              { welfareTeam.map((person, i) => (
                <PersonElement
                  role={person.role}
                  name={person.name}
                  image={person.image}
                  bio={person.bio}
                />
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
            <div class="flex flex-col md:flex-row text-justify md:border-b-2 md:border-red-900 md:mb-2">
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
