import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

class ViewBarItemPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.match.params.id,
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      sizes: [],
      drink: {},
      errorAdding: null,
      disabled: false,
      buttonText: "Add To Bag",
      size: ""
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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
      content = await api.get(`/bar/drink/${this.state.id}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { drink } = content.data;

    const sizes = drink.BarDrinks.map(item => {
      return {
        drinkId: item.id,
        sizeId: item.BarDrinkSize.id,
        price: Number(item.price),
        name: item.BarDrinkSize.name
      }
    });

    this.setState({ loaded: true, status: 200, sizes, drink });
  }

  addToBag = () => {

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

    const { drink } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <div className="flex flex-col justify-center text-left align-middle w-full md:w-3/4 mx-auto">
            <div className="p-2">
              <Link to="/bar/">
                <button
                  className="px-4 py-2 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >← Back to the menu</button>
              </Link>
            </div>
            <div className="flex flex-row justify-center mx-2">
              <div className="w-full flex flex-col-reverse md:flex-row text-lg">
                <div className="w-full md:w-1/2 flex justify-center flex-col mb-4 flex-grow-0 self-start">
                  <div className="mb-4">
                    <img
                      src={`/uploads/images/bar/${drink.image}`}
                      alt={drink.name}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/2 text-left md:p-4 flex flex-col">
                  <div className="pb-4">
                    <h1 className="font-semibold text-5xl pb-2">{drink.name}</h1>
                    <p className="font-semibold text-3xl">Price determined by size {drink.BarDrinkType.allowsMixer ? "and mixer" : ""}</p>
                    <p className="font-medium">{drink.description}</p>
                  </div>
                  <div className="pb-4 flex flex-row">
                    <label htmlFor="size" className="w-40 inline-block font-semibold">Size:</label>
                    <select
                      name="size"
                      className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
                      onChange={this.onInputChange}
                      value={this.state.size}
                      required={true}
                      disabled={this.state.disabled}
                    >
                      <option value="" disabled={true} hidden={true}>Choose Size...</option>
                      {this.state.sizes.map((size, i) => (
                        <option key={i} value={size.sizeId}>{size.name} (£{size.price.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                  {
                    drink.BarDrinkType.allowsMixer ? (
                      <div>
                        Mixer goes here
                      </div>
                    ) : null
                  }
                  Others
                  <div>
                    <button
                      className="px-4 py-2 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      onClick={this.addToBag}
                      disabled={this.state.disabled || !drink.available || this.state.closed}
                    >{drink.available ? this.state.buttonText : "Out of Stock"}</button>
                  </div>
                  <div className="text-center p-4 underline">
                    { this.state.errorAdding !== null ? <p>{this.state.errorAdding}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ViewBarItemPage.contextType = authContext;

export default ViewBarItemPage;
