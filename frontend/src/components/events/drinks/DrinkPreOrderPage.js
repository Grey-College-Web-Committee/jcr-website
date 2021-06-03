import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

class DrinkPreOrderPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      household: -1,
      sharingName: "",
      dietary: "none",
      wine: "none",
      softDrink: "none"
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/events/drinks");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let { existing } = content.data;

    if(existing === null) {
      this.setState({ loaded: true, status: 200 });
      return;
    }

    const { household, dietary, sharingWith: sharingName, wine, softDrink } = existing;

    this.setState({ loaded: true, status: 200, household, dietary, sharingName, wine, softDrink });
  }

  makeDisplayName = (user) => {
    const upperCaseFirstName = user.firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

    const upperCaseLastName = user.surname;
    const specialCaseList = ["MC", "MAC"];
    const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

    let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

    // Fix special cases like McDonald appearing as Mcdonald
    if(foundSpecialCase.length !== 0) {
      const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
      lastName = upperCaseLastName.substring(c.length);
      lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
    }

    // Fix hyphens
    if(lastName.includes("-")) {
      let capNext = false;
      let newLastName = [];

      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }

        newLastName.push(lastName[i]);
        capNext = lastName[i] === "-";
      }

      lastName = newLastName.join("")
    }

    // Fix apostrophes
    if(lastName.includes("'")) {
      let capNext = false;
      let newLastName = [];

      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }

        newLastName.push(lastName[i]);
        capNext = lastName[i] === "'";
      }

      lastName = newLastName.join("")
    }

    return `${firstName} ${lastName}`;
  }

  submitPreOrder = async () => {
    this.setState({ disabled: true });

    const { household, dietary, wine, sharingName, softDrink } = this.state;

    if(!this.canSubmit()) {
      alert("You must fill out the required fields");
      return;
    }

    let result;

    try {
      result = await api.post("/events/drinks", {
        household, dietary, wine, sharingWith: sharingName, softDrink
      });
    } catch (error) {
      alert("There was an issue saving your data");
      return;
    }

    this.setState({ submitted: true });
  }

  canSubmit = () => {
    const { household, dietary, wine, sharingName } = this.state;

    if(household === -1 || household === "-1") {
      return false;
    }

    if(dietary === "none") {
      return false;
    }

    if(wine !== "none" && sharingName.length === 0) {
      return false;
    }

    return true;
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

    const expiryDate = new Date("2021-06-04T11:00:00Z");

    if(new Date() > expiryDate) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Preferences and Wine Pre-Ordering</h1>
            <div className="w-full md:w-3/5 mx-auto text-center text-lg">
              <p>Preferences can no longer be edited</p>
            </div>
          </div>
        </div>
      )
    }

    if(this.state.submitted) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Preferences and Wine Pre-Ordering</h1>
            <div className="w-full md:w-3/5 mx-auto text-center text-lg">
              <p>Your preferences have been updated.</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Preferences and Wine Pre-Ordering</h1>
          <div className="w-full md:w-3/5 mx-auto text-left">
            <p className="mb-1">For the upcoming 'enhanced' dinner (on 8th and 9th June 2021) for livers-in you can purchase a bottle of wine that <span className="font-semibold">must be shared between two people</span> from the same household. Each bottle is £10 and payment will be taken on the night. You can also purchase bottles of J2O for £1.20. Payment will also be taken on the night.</p>
            <p className="mb-1">Please also fill in your dietary requirements.</p>
            <p className="mb-1">You can edit your preferences as many times as you like before 4th June at midday.</p>
            <fieldset>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={this.makeDisplayName(this.context)}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={true}
                  autoComplete=""
                  maxLength={255}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="household" className="flex flex-row justify-start text-xl font-semibold">Household (Required)</label>
                <select
                  name="household"
                  className="w-full h-8 border border-gray-400 disabled:opacity-50"
                  onChange={this.onInputChange}
                  value={this.state.household}
                  disabled={this.state.disabled}
                >
                  <option value={-1} disabled={true} hidden={true}>Choose Household...</option>
                  {
                    [...Array(28).keys()].map(i => i + 1).map(household => (
                      <option value={household} key={household}>Household {household}</option>
                    ))
                  }
                </select>
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Dietary Requirements (Required)</label>
                <select
                  name="dietary"
                  className="w-full h-8 border border-gray-400 disabled:opacity-50"
                  onChange={this.onInputChange}
                  value={this.state.dietary}
                  disabled={this.state.disabled}
                >
                  <option value="none" disabled={true} hidden={true}>Choose Dietary Requirements...</option>
                  <option value="meat">Meat</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="wine" className="flex flex-row justify-start text-xl font-semibold">Wine Choice</label>
                <select
                  name="wine"
                  className="w-full h-8 border border-gray-400 disabled:opacity-50"
                  onChange={this.onInputChange}
                  value={this.state.wine}
                  disabled={this.state.disabled}
                >
                  <option value="none">None</option>
                  <option value="red">Red (£10)</option>
                  <option value="white">White (£10)</option>
                </select>
              </div>
              <div className={`pt-2 pb-2 border-b-2 ${this.state.wine === "none" ? "hidden" : ""}`}>
                <label htmlFor="sharingName" className="flex flex-row justify-start text-xl font-semibold">Person you are sharing with (Required)</label>
                <input
                  type="text"
                  name="sharingName"
                  value={this.state.sharingName}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                  maxLength={255}
                  onChange={this.onInputChange}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="wine" className="flex flex-row justify-start text-xl font-semibold">Soft Drink Choice</label>
                <select
                  name="softDrink"
                  className="w-full h-8 border border-gray-400 disabled:opacity-50"
                  onChange={this.onInputChange}
                  value={this.state.softDrink}
                  disabled={this.state.disabled}
                >
                  <option value="none">None</option>
                  <option value="J2O Apple and Raspberry">J2O Apple and Raspberry (£1.20)</option>
                  <option value="J2O Apple and Mango">J2O Apple and Mango (£1.20)</option>
                  <option value="J2O Orange and Passionfruit">J2O Orange and Passionfruit (£1.20)</option>
                </select>
              </div>
              <div>
                <button
                  className="px-4 py-1 rounded text-xl bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled || !this.canSubmit()}
                  onClick={this.submitPreOrder}
                >Save</button>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    );
  }
}

DrinkPreOrderPage.contextType = authContext;

export default DrinkPreOrderPage;
