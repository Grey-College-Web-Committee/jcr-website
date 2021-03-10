import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import ImageUploader from 'react-images-upload';

class BarAdminManageDrinks extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      name: "",
      description: "",
      types: [],
      sizes: [],
      sizeCheckboxes: {},
      type: "",
      prices: {},
      imageUpload: null,
      temporaryImageSrc: null,
      baseDrinks: [],
      drinks: [],
      available: true
    };

    // Change this to your permission
    this.requiredPermission = "bar.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Load the data once the element is ready
  componentDidMount = async () => {
    let adminCheck;

    try {
      adminCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify admin status" });
      return;
    }

    // Ensure they are an admin
    if(adminCheck.data.user.permissions) {
      if(adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if(!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    let content;

    try {
      content = await api.get("/bar/admin/summary");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { types, sizes, baseDrinks, drinks } = content.data;
    let sizeCheckboxes = {};
    let prices = {};

    sizes.forEach((size, _) => {
      sizeCheckboxes[size.id] = false;
      prices[size.id] = 0;
    });

    // Load any required data for the page here

    this.setState({ loaded: true, types, sizes, sizeCheckboxes, prices, baseDrinks, drinks });
  }

  createNewDrink = async () => {
    if(!this.canSubmit()) {
      alert("You must fill in the fields first");
      return;
    }

    this.setState({ disabled: true });

    const { name, description, prices, sizeCheckboxes, type, imageUpload, available } = this.state;
    const formData = new FormData();

    formData.append("name", name);
    formData.append("description", description);
    formData.append("prices", JSON.stringify(prices));
    formData.append("sizeCheckboxes", JSON.stringify(sizeCheckboxes));
    formData.append("type", type);
    formData.append("available", available);
    formData.append("image", imageUpload[0]);

    try {
      await api.post("/bar/admin/drink", formData, {
        headers: { "content-type": "multipart/form-data" }
      });
    } catch (error) {
      this.setState({ disabled: false });
      alert("Unable to create the drink");
      return;
    }

    this.setState({ disabled: false, name: "", description: "" });
  }

  canSubmit = () => {
    const tickedSizes = Object.keys(this.state.sizeCheckboxes).filter(id => this.state.sizeCheckboxes[id]);

    if(tickedSizes.length === 0) {
      return false;
    }

    for(const id of tickedSizes) {
      if(Number(this.state.prices[id]) <= 0) {
        return false;
      }
    }

    return (
      (this.state.name !== undefined && this.state.name !== null && this.state.name.length !== 0) &&
      (this.state.type !== undefined && this.state.type !== null && this.state.type.length !== 0) &&
      (this.state.imageUpload !== undefined && this.state.imageUpload !== null && this.state.imageUpload.length !== 0) &&
      (this.state.prices !== undefined && this.state.prices !== undefined) &&
      (this.state.sizeCheckboxes !== undefined && this.state.sizeCheckboxes !== undefined) &&
      (this.state.available !== undefined && this.state.available !== undefined)
    );
  }

  onToggleCheckboxes = (ev, i) => {
    let { sizeCheckboxes } = this.state;
    sizeCheckboxes[i] = !sizeCheckboxes[i];
    this.setState({ sizeCheckboxes });
  }

  onPriceChange = (ev, i) => {
    let { prices } = this.state;
    prices[i] = ev.target.value;
    this.setState({ prices });
  }

  onImageDrop = (image) => {
    // Set the current image when they select one
    this.setState({ imageUpload: image });

    // Use FileReader to generate the base64 data source
    const reader = new FileReader();

    // Problem is it is async and we don't want to wait for it load before rendering the page
    // So we just re-render once it is ready
    reader.onloadend = () => {
      const temporaryImageSrc = [reader.result];
      this.setState({ temporaryImageSrc });
    }

    // Read the image
    reader.readAsDataURL(image[0]);
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
          <h1 className="font-semibold text-5xl pb-4">Manage Drinks</h1>
          <div>
            <h2 className="font-semibold text-2xl pb-2 text-left">Create New Drink</h2>
            <fieldset>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Name</label>
                <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.name.length} characters remaining)</span>
                <input
                  type="text"
                  name="name"
                  value={this.state.name}
                  onChange={this.onInputChange}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                  maxLength={255}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="description" className="flex flex-row justify-start text-xl font-semibold">Description</label>
                <span className="flex flex-row justify-start text-sm mb-2">({1500 - this.state.description.length} characters remaining)</span>
                <textarea
                  name="description"
                  value={this.state.description}
                  onChange={this.onInputChange}
                  className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                  maxLength={1500}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
                <label htmlFor="available" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">Available</label>
                <div className="flex flex-col items-center justify-center ml-2">
                  <input
                    type="checkbox"
                    name="available"
                    checked={this.state.available}
                    onChange={this.onInputChange}
                    className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.props.disabled}
                    autoComplete=""
                  />
                </div>
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="type" className="flex flex-row justify-start text-xl font-semibold">Type</label>
                <span className="flex flex-row justify-start text-sm mb-2">Type of beverage</span>
                <select
                  onChange={this.onInputChange}
                  name="type"
                  className="w-full h-8 border border-gray-400 disabled:opacity-50"
                  value={this.state.type}
                  disabled={this.state.disabled}
                >
                  <option value="" disabled={true} hidden={true}>Choose type...</option>
                  {this.state.types.map((type, id) => (
                    <option value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="type" className="flex flex-row justify-start text-xl font-semibold">Sizes and Prices</label>
                <span className="flex flex-row justify-start text-sm mb-2">Available sizes and prices for the drink (excluding mixers)</span>
                <span className="flex flex-row justify-start text-sm mb-2">Tick the box for an available size and the price box will appear. Minimum of £0.01 required for each available size.</span>
                <ul>
                  {this.state.sizes.map((size, i) => (
                    <li key={i} className="text-left text-lg my-2">
                      <span className="mr-2">{size.name}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 mr-2"
                        onChange={(event) => this.onToggleCheckboxes(event, size.id)}
                        disabled={this.state.disabled}
                        checked={this.state.sizeCheckboxes[size.id]}
                      />
                      {
                        this.state.sizeCheckboxes[size.id] ? (
                          <React.Fragment>
                            <span className="mr-2">Price (£):</span>
                            <input
                              type="number"
                              name="price"
                              value={this.state.prices[size.id]}
                              onChange={(event) => this.onPriceChange(event, size.id)}
                              className="border w-64 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                              disabled={this.state.disabled}
                              autoComplete=""
                              min={0}
                              step={0.01}
                            />
                          </React.Fragment>
                        ) : null
                      }
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pb-2 border-b-2">
                <label htmlFor="imagePosition" className="flex flex-row justify-start text-xl font-semibold">Image</label>
                <ImageUploader
                  withIcon={false}
                  buttonText={"Choose Image"}
                  imgExtension={['.jpg', '.gif', '.png', '.gif']}
                  singleImage={true}
                  onChange={this.onImageDrop}
                  disabled={this.state.disabled}
                />
                {
                  this.state.imageUpload === null ? (
                    <p>No image selected</p>
                  ) : (
                    <div className="flex flex-col items-center">
                      <p>Selected Image:</p>
                      <img
                        src={this.state.temporaryImageSrc}
                        alt="Uploaded Image"
                        className="h-auto w-48"
                      />
                    </div>
                  )
                }
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <button
                  className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled || !this.canSubmit()}
                  onClick={this.createNewDrink}
                >Create New Drink</button>
              </div>
            </fieldset>
          </div>
          <div>
            <h2 className="font-semibold text-2xl pb-2 text-left">Existing Drinks</h2>
            <table className="mx-auto border-2 text-left border-red-900 w-full mt-4">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Description</th>
                  <th className="p-2 font-semibold">Image</th>
                  <th className="p-2 font-semibold">Type</th>
                  <th className="p-2 font-semibold">Sizes and Prices</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.baseDrinks.map((baseDrink, id) => (
                    <tr className="text-center border-b border-gray-400">
                      <td className="p-2 border-r border-gray-400">{baseDrink.name}</td>
                      <td className="p-2 border-r border-gray-400">{baseDrink.description}</td>
                      <td className="p-2 border-r border-gray-400">{baseDrink.image}</td>
                      <td className="p-2 border-r border-gray-400">{baseDrink.typeId}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default BarAdminManageDrinks;
