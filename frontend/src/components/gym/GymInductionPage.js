import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import Cart from '../cart/Cart';
import GenericCartableItem from '../cart/GenericCartableItem';

const quiz = [
  {
    text: "What is the minimum capacity of EACH room?",
    options: ["1", "2", "3"]
  },
  {
    text: "Where is the fire alarm meeting point?",
    options: ["Outside Oswald", "Grey Lawn", "Fountain's Hall"]
  },
  {
    text: "Where can you find the first aid kit?",
    options: ["Corridor between gym rooms", "Cardio Room", "Henry Dyson Room"]
  },
  {
    text: "What must you NOT do when using the leg press?",
    options: ["Adjust the seat", "Keep a straight back", "Lock your knees"]
  },
  {
    text: "What do you do if you notice any faulty equipment?",
    options: ["Use it", "Put it back and ignore it", "Send an email to the gym managers (found on the wall)"]
  },
  {
    text: "What do you do if the treadmill is going too quickly or in an emergency?",
    options: ["Slow down using the speed dial", "Lower the incline settings", "Press the big red button"]
  },
  {
    text: "How many fire exits are there?",
    options: ["4", "2", "3"]
  },
  {
    text: "Do you need a negative LFT result to enter the gym?",
    options: ["Yes", "No"]
  },
  {
    text: "What is the maximum capacity of the cardio room?",
    options: ["6", "12", "8"]
  },
  {
    text: "What do you do when you're finished with a piece of equipment?",
    options: ["Wipe down and tidy up", "Leave the weights where you last used them", "Celebrate with a pint of Huel"]
  }
];
const quizAnswers = [1, 2, 0, 2, 2, 2, 0, 0, 1, 0];

const parq = [
  {
    text: "Do you have a heart condition that you should only do physical activity recommended by a doctor?",
    options: ["No", "Yes"]
  },
  {
    text: "Do you feel pain in your chest when you do physical activity?",
    options: ["No", "Yes"]
  },
  {
    text: "In the past month, have you had chest pain when not doing physical activity?",
    options: ["No", "Yes"]
  },
  {
    text: "Do you lose balance because of dizziness or do you ever lose consciousness?",
    options: ["No", "Yes"]
  },
  {
    text: "Do you have a bone or joint problem that could be worsened by a change in physical activity?",
    options: ["No", "Yes"]
  },
  {
    text: "Is your doctor currently prescribing medication for your blood pressure or heart condition?",
    options: ["No", "Yes"]
  },
  {
    text: "Do you know of any other reason why you shouldn’t take part in physical activity?",
    options: ["No", "Yes"]
  }
]

const membershipOptions = [
  {
    price: 18,
    nonMemberPrice: 23,
    name: "Michaelmas Term Gym Membership",
    image: "/images/gym/dumbbell.png",
    description: "(expires 10/12/2021)",
    displayName: "Michaelmas Term Gym Membership",
    submissionInformation: {
      type: "single_term"
    }
  },
  {
    price: 50,
    nonMemberPrice: 70,
    name: "Full Year Gym Membership",
    image: "/images/gym/dumbbell.png",
    description: "(expires 01/07/2022)",
    displayName: "Full Year Gym Membership",
    submissionInformation: {
      type: "full_year"
    }
  }
];

class GymInductionPage extends React.Component {
  constructor(props) {
    super(props);

    this.cart = new Cart();
    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      quizResponses: quiz.map(q => -1),
      parqResponses: parq.map(q => -1),
      stage: 0,
      inBasket: this.cart.get().items.filter(item => item.shop === "gym").length !== 0,
      riskAgreed: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;
    let isMember = true;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    // Ensure they are a member
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        isMember = false;
      }
    } else {
      isMember = false;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/gym/active");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, isMember, membership: content.data.membership });
  }

  updateQuizResponses = (e, i) => {
    let quizResponses = [...this.state.quizResponses];
    quizResponses[i] = e.target.value;
    this.setState({ quizResponses });
  }

  checkQuizAnswers = () => {
    const { quizResponses } = this.state;

    console.log(quizResponses, quizAnswers, quizResponses.every((res, index) => res === quizAnswers[index]));
    const correct = quizResponses.length === quizAnswers.length && quizResponses.every((res, index) => Number(res) === quizAnswers[index]);

    if(!correct) {
      this.setState({ quizError: "One or more of your answers is incorrect" });
      return;
    }

    this.setState({ stage: 1 });
  }

  updateParqResponses = (e, i) => {
    let parqResponses = [...this.state.parqResponses];
    parqResponses[i] = e.target.value;
    this.setState({ parqResponses });
  }

  renderStage = () => {
    switch(this.state.stage) {
      case 0:
        return (
          <React.Fragment>
            <p className="pb-1 text-left">Please start by watching the gym induction below prepared by the Gym Managers. If you have any specific questions please contact them at <a className="underline font-semibold" rel="noopener noreferrer" target="_blank" href="mailto:gr-gymmanagers@durham.ac.uk">gr-gymmanagers@durham.ac.uk</a></p>
            <div className="flex flex-row justify-center w-full">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/Di1OE_VJNyc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen/>
            </div>
            <p className="py-1 text-left">Once you have watched the video please fill in the multiple choice quiz below.</p>
            <div className="flex flex-col text-left">
              {
                quiz.map((question, i) => (
                  <div className="mb-1 flex flex-col md:flex-row md:items-center">
                    <h2 className="font-semibold md:mr-2 mb-1 md:mb-0">{i + 1}) {question.text}</h2>
                    <select
                      className="border border-black p-1"
                      value={this.state.quizResponses[i]}
                      onChange={(e) => this.updateQuizResponses(e, i)}
                    >
                      <option value={-1} disabled={true} hidden={true}>Please select an option...</option>
                      {
                        question.options.map((opt, j) => (
                          <option value={j}>{opt}</option>
                        ))
                      }
                    </select>
                  </div>
                ))
              }
            </div>
            <button
              className="mt-1 p-2 text-xl bg-red-900 text-white w-full disabled:opacity-50"
              disabled={this.state.quizResponses.filter(r => Number(r) === -1).length !== 0}
              onClick={this.checkQuizAnswers}
            >Submit Quiz</button>
            <p className="py-1 text-xl text-red-900 font-semibold">{this.state.quizError}</p>
          </React.Fragment>
        );
      case 1:
        return (
          <React.Fragment>
            <p className="pb-1 text-left">You have successfully completed the multiple choice quiz! Please now fill in the PARQ below:</p>
            <div className="flex flex-col text-left">
              {
                parq.map((question, i) => (
                  <div className="mb-1 flex flex-col md:flex-row md:items-center">
                    <h2 className="font-semibold md:mr-2 mb-1 md:mb-0">{i + 1}) {question.text}</h2>
                    <select
                      className="border border-black p-1"
                      value={this.state.parqResponses[i]}
                      onChange={(e) => this.updateParqResponses(e, i)}
                    >
                      <option value={-1} disabled={true} hidden={true}>Please select an option...</option>
                      {
                        question.options.map((opt, j) => (
                          <option value={j}>{opt}</option>
                        ))
                      }
                    </select>
                  </div>
                ))
              }
              <div className="mb-1 flex flex-col md:flex-row md:items-center">
                <h2 className="font-semibold md:mr-2 mb-1 md:mb-0">I have read, understood and accurately completed this questionnaire. I confirm that I am voluntarily engaging in use of the gym, and my participation involves a risk of injury as understood from the induction.</h2>
                <input
                  type="checkbox"
                  checked={this.state.riskAgreed}
                  name="riskAgreed"
                  onChange={this.onInputChange}
                  className="h-10 w-10"
                />
              </div>
            </div>
            <p className="py-1 text-left">If you answered YES to one or more questions, you should consult your doctor to clarify that it is safe for you to become physically active at this current time in your current state of health. If you wish to purchase a membership anyway the JCR FACSO will be notified of your PARQ and may contact you to discuss further.</p>
            <p className="py-1 text-left">If you answered NO to all the questions, it is reasonably safe for you to participate in physical activity.</p>
            <button
              className="mt-1 p-2 text-xl bg-red-900 text-white w-full disabled:opacity-50"
              disabled={this.state.parqResponses.filter(r => Number(r) === -1).length !== 0 || !this.state.riskAgreed}
              onClick={() => this.setState({ stage: 2 })}
            >Submit PARQ</button>
          </React.Fragment>
        )
      case 2:
        return (
          <React.Fragment>
            <p className="pb-1 text-left">Thank you for completing the PARQ you can now purchase a gym membership! Please note, if you leave this page you will have to recomplete the induction quiz and PARQ. You can only add one membership to your bag. If you wish to select a different one please remove the other membership from your basket and you will be able to add a different option.</p>
            <div className="flex flex-row flex-wrap w-full justify-center">
            {
              membershipOptions.map((option, i) => (
                <GenericCartableItem
                  price={this.state.isMember ? option.price : option.nonMemberPrice}
                  name={option.name}
                  image={option.image}
                  description={option.description}
                  cartData={{
                    shop: "gym",
                    name: option.displayName,
                    basePrice: this.state.isMember ? option.price : option.nonMemberPrice,
                    quantity: 1,
                    submissionInformation: option.submissionInformation,
                    components: [
                      {
                        name: "PARQ Completed",
                        price: 0,
                        quantity: 1,
                        submissionInformation: {
                          type: "parq",
                          responses: this.state.parqResponses
                        }
                      }
                    ],
                    image: option.image,
                    upperLimit: 1
                  }}
                  disabled={this.state.membership !== null}
                  buttonText={this.state.membership !== null ? "Already Purchased" : "Add To Bag"}
                  disableOnCondition={(items) => {
                    return items.filter(item => item.shop === "gym").length !== 0;
                  }}
                  callback={() => {
                    this.setState({ inBasket: true })
                  }}
                />
              ))
            }
            </div>
          </React.Fragment>
        )
      default:
        return null;
    }
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

    if(this.state.membership) {
      return (
        <Redirect to="/gym" />
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Gym Induction</h1>
          { this.renderStage() }
        </div>
      </div>
    );
  }
}

GymInductionPage.contextType = authContext;

export default GymInductionPage;
