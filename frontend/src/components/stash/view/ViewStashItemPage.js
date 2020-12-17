import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import config from '../../../config.json';
import LoadingHolder from '../../common/LoadingHolder';
import AddToCartButton from '../../cart/AddToCartButton';

class ViewStashItemPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      item: null,
      stashId: this.props.match.params.id,
      size: "",
      colour: -1,
      colourPreview: {
        primaryColour: null,
        secondaryColour: null
      }
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) });
  }

  onInputChangeCB = (e, callback) => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) }, callback);
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get(`/stash/item/${this.state.stashId}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, item: content.data.item });
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

    const { name, price, available, StashSizeChart, StashItemColours, StashStockImages } = this.state.item;

    delete StashSizeChart.id;
    delete StashSizeChart.createdAt;
    delete StashSizeChart.updatedAt;

    const sizeDiv = (
      <div className="pb-4">
        <label htmlFor="size" className="pr-2 w-16 inline-block">Size:</label>
        <select
          name="size"
          className="w-auto h-8 border border-gray-400 disabled:opacity-50"
          onChange={this.onInputChange}
          value={this.state.size}
          required={true}
        >
          <option value="" disabled={true} hidden={true}>Choose Size...</option>
          {Object.keys(StashSizeChart).map((size, i) => (
            StashSizeChart[size] === true ? <option key={i} value={size}>{size}</option> : null
          ))}
        </select>
      </div>
    );

    const { primaryColour, secondaryColour } = this.state.colourPreview;

    const colourDiv = StashItemColours.length === 0 ? null : (
      <div className="pb-4 flex flex-row">
        <label htmlFor="colour" className="pr-2 w-16 inline-block">Colour:</label>
        <select
          name="colour"
          className="w-auto h-8 border border-gray-400 disabled:opacity-50"
          onChange={(e) => {
            this.onInputChangeCB(e, this.onColourChange)
          }}
          value={this.state.colour}
          required={true}
        >
          <option value={-1} disabled={true} hidden={true}>Choose Colour...</option>
          {StashItemColours.map((colour, i) => (
            <option key={i} value={colour.colourId}>{colour.StashColour.name}</option>
          ))}
        </select>
        {primaryColour === null ? null : (
          <div className="w-8 h-8 border-black border ml-2" style={{backgroundColor: primaryColour}}>
          </div>
        )}
        {secondaryColour === null ? null : (
          <div className="w-8 h-8 border-black border ml-2" style={{backgroundColor: secondaryColour}}>
          </div>
        )}
      </div>
    );

    const customisationDiv = null;

    const imageUrl = `/uploads/images/stash/${StashStockImages[0].productId}/${StashStockImages[0].name}`;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <div className="flex flex-row justify-center">
            <div className="w-3/4 flex flex-row text-lg">
              <div className="w-1/2 flex justify-center flex-row border-black border-2 mx-2">
                <img
                  src={imageUrl}
                  alt={`${name}`}
                  className="w-full"
                />
              </div>
              <div className="w-1/2 border-black border-2 mx-2 text-left p-4 flex flex-col">
                <div className="font-semibold pb-4">
                  <h1 className="text-5xl pb-2">{name}</h1>
                  <span className="text-3xl">£{Number(price).toFixed(2)}</span>
                </div>
                {sizeDiv}
                {colourDiv}
                <div>
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
