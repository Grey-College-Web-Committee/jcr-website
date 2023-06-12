import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import BarCart from './BarCart';

class ViewBarItemPage extends React.Component {
  constructor(props) {
    super(props);

    this.barCart = new BarCart();
    this.state = {
      id: this.props.match.params.id,
      loaded: false,
      status: 0,
      error: "",
      sizes: [],
      drink: {},
      errorAdding: null,
      disabled: false,
      buttonText: "Add To Order",
      size: "",
      mixer: "",
      currentPrice: 0,
      mixers: [],
      addedCount: 0,
      tableNumberSet: localStorage.getItem("table_bar") !== null,
      cordial: "",
      cordials: []
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), errorAdding: null })
  }

  onSelectMixerOrSizeOrCordial = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), errorAdding: null }, () => {
      const { mixer, mixers, size, sizes, cordial, cordials } = this.state;
      let newPrice = 0;

      if(mixer !== "") {
        const mixerId = Number(mixer);
        const mixerRecords = mixers.filter(m => m.id === mixerId);

        if(mixerRecords.length === 1) {
          newPrice += Number(mixerRecords[0].price);
        }
      }

      if(cordial !== "") {
        const cordialId = Number(cordial);
        const cordialRecords = cordials.filter(m => m.id === cordialId);

        if(cordialRecords.length === 1) {
          newPrice += Number(cordialRecords[0].price);
        }
      }

      if(size !== "") {
        const drinkId = Number(size);
        const sizeRecords = sizes.filter(s => s.drinkId === drinkId);

        if(sizeRecords.length === 1) {
          newPrice += Number(sizeRecords[0].price);
        }
      }

      this.setState({ currentPrice: newPrice });
    })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    try {
      await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status" });
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

    const { drink, mixers, cordials } = content.data;

    const sizes = drink.BarDrinks.map(item => {
      return {
        drinkId: item.id,
        sizeId: item.BarDrinkSize.id,
        price: Number(item.price),
        name: item.BarDrinkSize.name
      }
    });

    this.setState({ loaded: true, status: 200, sizes, drink, mixers, cordials });
  }

  addToBag = () => {
    this.setState({ disabled: true });
    // refresh the cart
    this.barCart.get();

    const { size, mixer, sizes, mixers, drink, cordial, cordials } = this.state;
    let components = [];

    if(size === "") {
      this.setState({ disabled: false, errorAdding: "You must select a size" });
      return;
    }

    const drinkId = Number(size);
    const sizeRecords = sizes.filter(s => s.drinkId === drinkId);

    if(sizeRecords.length !== 1) {
      this.setState({ disabled: false, errorAdding: "You must select a size" });
      return;
    }

    components.push({
      name: `Size: ${sizeRecords[0].name}`,
      price: Number(sizeRecords[0].price),
      quantity: 1,
      submissionInformation: {
        type: "size",
        drinkId: sizeRecords[0].drinkId
      }
    });

    if(drink.BarDrinkType.allowsMixer) {
      if(mixer === "") {
        this.setState({ disabled: false, errorAdding: "You must select a mixer (or set it to none)" });
        return;
      }

      const mixerId = Number(mixer);

      if(mixerId === -1) {
        components.push({
          name: `Mixer: None`,
          price: 0,
          quantity: 1,
          submissionInformation: {
            type: "mixer",
            isNone: true,
            mixerId: -1
          }
        });
      } else {
        const mixerRecords = mixers.filter(m => m.id === mixerId);

        components.push({
          name: `Mixer: ${mixerRecords[0].name}`,
          price:  Number(mixerRecords[0].price),
          quantity: 1,
          submissionInformation: {
            type: "mixer",
            isNone: false,
            mixerId: mixerId
          }
        });
      }
    }

    if(drink.BarDrinkType.allowsCordial) {
      if(cordial === "") {
        this.setState({ disabled: false, errorAdding: "You must select a cordial (or set it to none)" });
        return;
      }

      const cordialId = Number(cordial);

      if(cordialId === -1) {
        components.push({
          name: `Cordial: None`,
          price: 0,
          quantity: 1,
          submissionInformation: {
            type: "cordial",
            isNone: true,
            cordialId: -1
          }
        });
      } else {
        const cordialRecords = cordials.filter(m => m.id === cordialId);

        components.push({
          name: `Cordial: ${cordialRecords[0].name}`,
          price:  Number(cordialRecords[0].price),
          quantity: 1,
          submissionInformation: {
            type: "cordial",
            isNone: false,
            cordialId: cordialId
          }
        });
      }
    }

    const image = `/uploads/images/bar/${drink.image}`;

    this.barCart.addToCartRaw({
      name: drink.name,
      basePrice: 0,
      quantity: 1,
      submissionInformation: { id: drink.id },
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
        buttonText: "Add to Order"
      });
    }, 1200);
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
                <div className="w-full md:w-1/2 text-left md:p-4 flex flex-col">
                  <div className="pb-4">
                    <h1 className="font-semibold text-5xl pb-2">{drink.name}</h1>
                    {this.state.currentPrice === 0 ? <p className="font-semibold text-xl">Price determined by size{drink.BarDrinkType.allowsMixer && drink.BarDrinkType.allowsCordial ? ", mixer and cordial" : (drink.BarDrinkType.allowsMixer ? " and mixer" : (drink.BarDrinkType.allowsCordial ? " and cordial" : ""))}</p> : <p className="font-semibold text-xl">£{this.state.currentPrice.toFixed(2)}</p>}
                    <p>{drink.description}</p>
                  </div>
                  <div className="pb-4 flex flex-row">
                    <label htmlFor="size" className="w-40 inline-block font-semibold">Size:</label>
                    <select
                      name="size"
                      className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
                      onChange={this.onSelectMixerOrSizeOrCordial}
                      value={this.state.size}
                      disabled={this.state.disabled}
                    >
                      <option value="" disabled={true} hidden={true}>Choose Size...</option>
                      {this.state.sizes.map((size, i) => (
                        <option key={i} value={size.drinkId}>{size.name} (£{size.price.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                  {
                    drink.BarDrinkType.allowsMixer ? (
                      <div className="pb-4 flex flex-row">
                        <label htmlFor="mixer" className="w-40 inline-block font-semibold">Mixer:</label>
                        <select
                          name="mixer"
                          className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
                          onChange={this.onSelectMixerOrSizeOrCordial}
                          value={this.state.mixer}
                          disabled={this.state.disabled}
                        >
                          <option value="" disabled={true} hidden={true}>Choose Mixer...</option>
                          <option value="-1">None (+£0.00)</option>
                          {this.state.mixers.map((mixer, i) => (
                            <option
                              key={i}
                              disabled={!mixer.available}
                              className={mixer.available ? "" : "bg-gray-100"}
                              value={mixer.id}
                            >{mixer.name} (+£{Number(mixer.price).toFixed(2)})</option>
                          ))}
                        </select>
                      </div>
                    ) : null
                  }
                  {
                    drink.BarDrinkType.allowsCordial ? (
                      <div className="pb-4 flex flex-row">
                        <label htmlFor="cordial" className="w-40 inline-block font-semibold">Cordial:</label>
                        <select
                          name="cordial"
                          className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
                          onChange={this.onSelectMixerOrSizeOrCordial}
                          value={this.state.cordial}
                          disabled={this.state.disabled}
                        >
                          <option value="" disabled={true} hidden={true}>Choose Cordial...</option>
                          <option value="-1">None (+£0.00)</option>
                          {this.state.cordials.map((cordial, i) => (
                            <option
                              key={i}
                              disabled={!cordial.available}
                              className={cordial.available ? "" : "bg-gray-100"}
                              value={cordial.id}
                            >{cordial.name} (+£{Number(cordial.price).toFixed(2)})</option>
                          ))}
                        </select>
                      </div>
                    ) : null
                  }
                  <div>
                    <button
                      className="px-4 py-2 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      onClick={this.addToBag}
                      disabled={this.state.disabled || !drink.available || this.state.closed || !this.state.tableNumberSet}
                    >{drink.available ? this.state.buttonText : "Out of Stock"}</button>
                  </div>
                  {
                    !this.state.tableNumberSet ? (
                      <div className="text-center p-1 underline">
                        <p>You cannot add this to your bag until you set your table number.</p>
                      </div>
                    ) : null
                  }
                  <div className="text-center p-1 underline">
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
