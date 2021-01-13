import React from 'react';
import { Prompt, Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import Cart from '../../cart/Cart';

class ViewStashItemPage extends React.Component {
  constructor(props) {
    super(props);

    this.cart = new Cart();
    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      item: null,
      stashId: this.props.match.params.id,
      size: "",
      shieldOrCrest: "-1",
      underShieldText: "-1",
      colour: "-1",
      colourPreview: {
        primaryColour: null,
        secondaryColour: null
      },
      rightBreastOption: "-1",
      rightBreastText: "",
      backPersonalisationOption: "-1",
      backPersonalisationText: "",
      errorAdding: null,
      disabled: false,
      buttonText: "Add To Bag",
      addedCount: 0,
      currentImage: 0,
      multipleImages: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), errorAdding: null });
  }

  onInputChangeCB = (e, callback) => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), errorAdding: null }, callback);
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
      content = await api.get(`/stash/item/${this.state.stashId}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, item: content.data.item, multipleImages:content.data.item.StashStockImages.length>1 });

    // Change displayed image every 6 seconds
    this.interval = setInterval(() => {
      this.changeImage(1);
    }, 6000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  onColourChange = () => {
    const colourObj = this.state.item.StashItemColours.filter(colour => colour.colourId === Number(this.state.colour))[0].StashColour;
    this.setState({
      colourPreview: {
        primaryColour: colourObj.colour,
        secondaryColour: colourObj.twoTone ? colourObj.secondaryColour : null
      }
    });
  }

  getCurrentImage() {
    const StashStockImages = this.state.item.StashStockImages;
    const name = this.state.item.name;
    const imageUrl = `/uploads/images/stash/${StashStockImages[this.state.currentImage].productId}/${StashStockImages[this.state.currentImage].name}`;
    return (
      <img
        src={imageUrl}
        alt={`${name}`}
        className="w-full"
      />
    );
  }

  changeImage(direction) {
    let currentImage = this.state.currentImage;
    currentImage = currentImage+direction;
    if (currentImage < 0){
      currentImage = this.state.item.StashStockImages.length-1;
    }
    else if (currentImage >= this.state.item.StashStockImages.length) {
      currentImage = 0;
    }
    this.setState({ currentImage: currentImage });
  }

  translateSize = (size) => {
    switch(size) {
      case "WS8":
        return "Women's Size 8";
      case "WS10":
        return "Women's Size 10";
      case "WS12":
        return "Women's Size 12";
      case "WS14":
        return "Women's Size 14";
      case "WS16":
        return "Women's Size 16";
      case "WS18":
        return "Women's Size 18";
      default:
        return size;
    }
  }

  addToBag = () => {
    this.setState({ disabled: true });
    // refresh the cart
    this.cart.get();

    const { size, colour, rightBreastOption, rightBreastText, backPersonalisationOption, backPersonalisationText, shieldOrCrest, underShieldText } = this.state;
    const { id, name, price, StashItemColours, StashCustomisations, StashStockImages } = this.state.item;

    let components = [];

    // First check they have selected a size
    if(size === "") {
      this.setState({ disabled: false, errorAdding: "Please select a size" });
      return;
    }

    components.push({
      name: `Size: ${this.translateSize(size)}`,
      price: 0,
      quantity: 1,
      submissionInformation: {
        type: "size",
        size
      }
    });

    if(shieldOrCrest === "-1") {
      this.setState({ disabled: false, errorAdding: "Please select shield or crest" });
      return;
    }

    components.push({
      name: shieldOrCrest === "1" ? "Crest" : "Shield" ,
      price: 0,
      quantity: 1,
      submissionInformation: {
        type: "shieldOrCrest",
        shieldOrCrest
      }
    });

    if(underShieldText === "-1") {
      this.setState({ disabled: false, errorAdding: "Please select the under text" });
      return;
    }

    components.push({
      name: underShieldText === "1" ? "MCR Only: Grey College MCR" : "Standard: Grey College" ,
      price: 0,
      quantity: 1,
      submissionInformation: {
        type: "underShieldText",
        underShieldText
      }
    });

    const colourRequired = StashItemColours.length !== 0;

    if(colourRequired) {
      if(colour === -1 || colour === "-1") {
        this.setState({ disabled: false, errorAdding: "Please select a colour" });
        return;
      }

      const colourObj = StashItemColours.filter(obj => obj.colourId === Number(colour))[0];

      components.push({
        name: `Colour: ${colourObj.StashColour.name}`,
        price: 0,
        quantity: 1,
        submissionInformation: {
          type: "colour",
          colour
        }
      });
    }

    const customisationsAvailable = StashCustomisations.length !== 0

    if(customisationsAvailable) {
      if(rightBreastOption !== "-1") {
        if(rightBreastText.length === 0) {
          this.setState({ disabled: false, errorAdding: "Please enter your personalisation text" });
          return;
        }

        if(rightBreastText.length > 20) {
          this.setState({ disabled: false, errorAdding: "Your personalisation text must be less than 21 characters" });
          return;
        }

        const rightBreastObj = StashCustomisations.filter(cust => cust.customisationChoice === Number(rightBreastOption))[0];

        components.push({
          name: "Right Breast (Personalised)",
          price: Number(rightBreastObj.addedPriceForCustomisation),
          quantity: 1,
          submissionInformation: {
            type: "customisation",
            typeId: rightBreastOption,
            text: rightBreastText
          },
          additionalDisplay: rightBreastText
        });
      }

      if(backPersonalisationOption !== "-1") {
        if(backPersonalisationText.length === 0) {
          this.setState({ disabled: false, errorAdding: "Please enter your personalisation text" });
          return;
        }

        if(backPersonalisationText.length > 20) {
          this.setState({ disabled: false, errorAdding: "Your personalisation text must be less than 21 characters" });
          return;
        }

        const backPersonalisationObj = StashCustomisations.filter(cust => cust.customisationChoice === Number(backPersonalisationOption))[0];

        // Don't like this but 1 is leg personalisation

        const displayChoices = [
          "Back Print",
          "Leg Print",
          "Back Embroidery",
          "Back Embroidery (Personalised)"
        ]

        components.push({
          name: displayChoices[Number(backPersonalisationOption)],
          price: Number(backPersonalisationObj.addedPriceForCustomisation),
          quantity: 1,
          submissionInformation: {
            type: "customisation",
            typeId: backPersonalisationOption,
            text: backPersonalisationText,
          },
          additionalDisplay: backPersonalisationText
        });
      }
    }

    const image = `/uploads/images/stash/${StashStockImages[0].productId}/${StashStockImages[0].name}`;


    this.cart.addToCartRaw({
      shop: "stash",
      name,
      basePrice: Number(price),
      quantity: 1,
      submissionInformation: { id },
      components,
      duplicateHash: null,
      image
    });

    this.setState({ buttonText: "Added ✓", addedCount: this.state.addedCount + 1 });

    setTimeout(() => {
      this.setState({
        disabled: false
      });
    }, 800);

    setTimeout(() => {
      this.setState({
        buttonText: "Add to Bag"
      });
    }, 1200);
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0 && this.state.status !== 403) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/memberships/join" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    const { name, description, price, available, StashSizeChart, StashItemColours, StashCustomisations } = this.state.item;

    delete StashSizeChart.id;
    delete StashSizeChart.createdAt;
    delete StashSizeChart.updatedAt;

    const sizeDiv = (
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
          {Object.keys(StashSizeChart).map((size, i) => (
            StashSizeChart[size] === true ? <option key={i} value={size}>{this.translateSize(size)}</option> : null
          ))}
        </select>
      </div>
    );

    const crestDiv = (
      <div className="pb-4 flex flex-row">
        <label htmlFor="shieldOrCrest" className="w-40 inline-block font-semibold">Shield or Crest:</label>
        <select
          name="shieldOrCrest"
          className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
          onChange={this.onInputChange}
          value={this.state.shieldOrCrest}
          required={true}
          disabled={this.state.disabled}
        >
          <option value="-1" disabled={true} hidden={true}>Please Select...</option>
          <option value="0">Shield</option>
          <option value="1">Crest</option>
        </select>
      </div>
    );

    // Add grad text here
    const crestTextDiv = (
      <div className="pb-4 flex flex-row">
        <label htmlFor="size" className="w-40 inline-block font-semibold">Shield/Crest Text:</label>
        <select
          name="underShieldText"
          className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
          onChange={this.onInputChange}
          value={this.state.underShieldText}
          required={true}
          disabled={this.state.disabled}
        >
          <option value="-1" disabled={true} hidden={true}>Please Select...</option>
          <option value="0">Standard: Grey College</option>
          <option value="1">MCR Only: Grey College MCR</option>
        </select>
      </div>
    )

    const { primaryColour, secondaryColour } = this.state.colourPreview;

    const colourDiv = StashItemColours.length === 0 ? null : (
      <div className="pb-4 flex flex-row">
        <label htmlFor="colour" className="w-40 inline-block font-semibold">Colour:</label>
        <select
          name="colour"
          className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
          onChange={(e) => {
            this.onInputChangeCB(e, this.onColourChange)
          }}
          value={this.state.colour}
          required={true}
          disabled={this.state.disabled}
        >
          <option value={-1} disabled={true} hidden={true}>Choose Colour...</option>
          {StashItemColours.map((colour, i) => (
            <option key={i} value={colour.colourId}>{colour.StashColour.name}</option>
          ))}
        </select>
        <div className="w-auto flex flex-row">
          {primaryColour === null ? null : (
            <div className="w-8 h-8 border-black border ml-2" style={{backgroundColor: primaryColour}}>
            </div>
          )}
          {secondaryColour === null ? null : (
            <div className="w-8 h-8 border-black border ml-2" style={{backgroundColor: secondaryColour}}>
            </div>
          )}
        </div>
      </div>
    );

    const customisationValidChoices = [
      "Back Print: Grey College or Durham University",
      "Leg Print: Grey College or Durham University",
      "Back Embroidery: Grey College or Durham University",
      "Back Embroidery Personalised",
      "Right Breast/Small Item Personalisation"
    ];

    const backCustomisations = StashCustomisations.filter(cust => [0, 1, 2, 3].includes(cust.customisationChoice));
    const backCustomisationsEnabled = backCustomisations.length !== 0;
    const rightBreast = StashCustomisations.filter(cust => cust.customisationChoice === 4);
    const rightBreastEnabled = rightBreast.length !== 0;

    const customisationDiv = StashCustomisations.length === 0 ? null : (
      <div className="pb-2 flex flex-col">
        <h2 className="font-semibold text-xl">Customisation</h2>
        {!rightBreastEnabled ? null : (
          <div>
            <h3 className="font-semibold">Front Personalisation</h3>
            <select
              name="rightBreastOption"
              value={this.state.rightBreastOption}
              className="w-full border border-gray-400 disabled:opacity-50 p-1 mb-4"
              onChange={(e) => {
                this.setState({ rightBreastText: "" })
                this.onInputChange(e)
              }}
              disabled={this.state.disabled}
            >
              <option value="-1">None (+£0.00)</option>
              {
                rightBreast.map((cust, i) => (
                  <option value={cust.customisationChoice}>{customisationValidChoices[cust.customisationChoice]} (+£{Number(cust.addedPriceForCustomisation).toFixed(2)})</option>
                ))
              }
            </select>
            {this.state.rightBreastOption === "4" ? (
              <div>
                <span>Front Personalisation Text</span>
                <input
                  type="text"
                  name="rightBreastText"
                  value={this.state.rightBreastText}
                  className="w-full border border-gray-400 disabled:opacity-50 pl-2 p-1 mb-4"
                  onChange={this.onInputChange}
                  maxLength="20"
                  disabled={this.state.disabled}
                />
              </div>
            ) : null}
          </div>
        )}
        {!backCustomisationsEnabled ? null : (
          <div className="flex flex-col">
            <h3 className="font-semibold">Back Personalisation</h3>
            <select
              name="backPersonalisationOption"
              value={this.state.backPersonalisationOption}
              className="w-full border border-gray-400 disabled:opacity-50 p-1 mb-4"
              onChange={(e) => {
                this.setState({ backPersonalisationText: "" })
                this.onInputChange(e)
              }}
              disabled={this.state.disabled}
            >
              <option value="-1">None (+£0.00)</option>
              {
                backCustomisations.map((cust, i) => (
                  <option value={cust.customisationChoice}>{customisationValidChoices[cust.customisationChoice]} (+£{Number(cust.addedPriceForCustomisation).toFixed(2)})</option>
                ))
              }
            </select>
            {this.state.backPersonalisationOption === "0" || this.state.backPersonalisationOption === "1" || this.state.backPersonalisationOption === "2" ? (
              <div>
                <span>Back Personalisation Text</span>
                <select
                  name="backPersonalisationText"
                  value={this.state.backPersonalisationText}
                  className="w-full border border-gray-400 disabled:opacity-50 p-1 mb-4"
                  onChange={this.onInputChange}
                  disabled={this.state.disabled}
                >
                  <option value="" disabled={true} hidden={true}>Select Option...</option>
                  <option value="Grey College">Grey College</option>
                  <option value="Durham University">Durham University</option>
                </select>
              </div>
            ) : null}
            {this.state.backPersonalisationOption === "3" ? (
              <div>
                <span>Back Personalisation Text</span>
                <input
                  type="text"
                  name="backPersonalisationText"
                  value={this.state.backPersonalisationText}
                  className="w-full border border-gray-400 disabled:opacity-50 pl-2 p-1 mb-4"
                  onChange={this.onInputChange}
                  maxLength="20"
                  disabled={this.state.disabled}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    );

    //const imageUrl = `/uploads/images/stash/${StashStockImages[0].productId}/${StashStockImages[0].name}`;

    return (
      <div className="flex flex-col justify-start">
        <Prompt
          when={this.state.size.length !== 0 && this.state.addedCount === 0}
          message="You haven't added this to your bag yet. Are you sure you want to leave?"
        />
      <div className="md:container mx-auto text-center p-4">
          <div className="flex flex-col justify-center text-left align-middle w-full md:w-3/4 mx-auto">
            <div className="p-2">
              <Link to="/stash/">
                <button
                  className="px-4 py-2 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >← Back to Stash</button>
              </Link>
            </div>
            <div className="flex flex-row justify-center mx-2">
              <div className="w-full flex flex-col-reverse md:flex-row text-lg">
                <div className="w-full md:w-1/2 flex justify-center flex-col mb-4 flex-grow-0 self-start">
                  <div className="mb-4">
                    {this.getCurrentImage()}
                  </div>
                  <div className="flex flex-row justify-between text-2xl align-middle">
                    <button
                      onClick={()=>{this.changeImage(-1);clearInterval(this.interval);}}
                      disabled={this.state.disabled || !this.state.multipleImages}
                      className="h-full px-12 rounded disabled:bg-gray-400 text-white w-auto font-semibold bg-red-900 disabled:opacity-20"
                    >&lt;</button>
                    <p>{this.state.currentImage + 1}/{this.state.item.StashStockImages.length}</p>
                    <button
                      onClick={()=>{this.changeImage(1);clearInterval(this.interval);}}
                      disabled={this.state.disabled || !this.state.multipleImages}
                      className="h-full px-12 rounded disabled:bg-gray-400 text-white w-auto font-semibold bg-red-900 disabled:opacity-20"
                    >&gt;</button>
                  </div>
                </div>
                <div className="w-full md:w-1/2 text-left md:p-4 flex flex-col">
                  <div className="pb-4">
                    <h1 className="font-semibold text-5xl pb-2">{name}</h1>
                    <p className="font-semibold text-3xl">£{Number(price).toFixed(2)}</p>
                    <p className="font-medium">{description}</p>
                  </div>
                  {sizeDiv}
                  {crestDiv}
                  {crestTextDiv}
                  {colourDiv}
                  {customisationDiv}
                  <div>
                    <button
                      className="px-4 py-2 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      onClick={this.addToBag}
                      disabled={this.state.disabled || !available}
                    >{available ? this.state.buttonText : "Out of Stock"}</button>
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

ViewStashItemPage.contextType = authContext;

export default ViewStashItemPage;
