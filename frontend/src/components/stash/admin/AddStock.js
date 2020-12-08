import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';
import ImageUploader from 'react-images-upload';

class AddStock extends React.Component {
  constructor(props) {
	super(props);
	this.state = {
	  name: "",
	  available: true,
	  type: "clothing",
	  customisationAvailable: false,
	  cusotmisationDescription: "",
	  addedPriceForCusotmisation: 0,
	  price: 0,
	  XS: true,
	  S: true,
	  M: true,
	  L: true,
	  XL: true,
	  XXL: true,
	  pictures: [],
	  progress: 0,
	  disabled: false,
	  uploadedLocation: "",
	  uploadDisabled: false
	}
	this.onDrop = this.onDrop.bind(this);
	this.customisationOptions = this.customisationOptions.bind(this);
	this.onInputChange = this.onInputChange.bind(this);
  }

  onUpload = async (productId) => {
	this.setState({ disabled: true });
	const pictures = this.state.pictures;
	if(pictures.length === 0) {
	  alert("You haven't selected any pictures to upload.");
	  this.setState({ disabled: false });
	  return;
	}

	// Send to the server
	const file = pictures[0]
	const formData = new FormData();
	formData.append('file', file); // appending file
	let query;
	try {
	  query=await api.post(`/stash/upload/${productId}`, formData, {
		onUploadProgress: (ProgressEvent) => {
			let progress = Math.round(ProgressEvent.loaded / ProgressEvent.total * 100) + '%';
			this.setState({progress});
		}
	  });
	} catch (error) {
	  alert("An error occurred adding this colour option");
	  this.setState({ disabled: false });
	  return;
	}
	alert(query.data.message);
	this.setState({ pictures: [], disabled: false, uploadedLocation: query.data.name });
  }

  onDrop(pictureFiles, pictureDataURLs) {
	this.setState({
		pictures: pictureFiles
	});
  }

  onInputChange = e => {
	this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  changeCustDesc(newDesc){
	this.setState({ cusotmisationDescription: newDesc })
  }

  saveImage = async(productId) =>{
	if(this.state.pictures.length === 0){
		return;
	}

  }

  saveSelectedColours = async(productId) =>{

	const coloursLength = this.props.colours.length;
	for (var i = 0; i < coloursLength; i++){
	  const colourId = this.props.colours[i].id;
	  
	  const isSelected = this.props.selectedColours[colourId];

	  if (isSelected){ // If colour is a selected colour
		// Add colour option to table on the server
		try {
		  await api.post("/stash/itemColour", { productId, colourId });
		} catch (error) {
		  alert("An error occurred adding this colour option");
		  return;
		};
	  }

	  else{
		// Remove the colour option from the table on the server
		try {
		  await api.delete(`/stash/itemColour/${productId}${colourId}`, { productId, colourId });
		} catch (error) {
		  alert("An error occurred adding this colour option");
		  return;
		};
	  }

	}
  }

  createNewItem = async e => {
	// Prevent refresh on button click and prevent resubmission
	e.preventDefault();
	this.setState({ disabled: true });

	const { name, available, type, customisationAvailable, cusotmisationDescription, addedPriceForCusotmisation, price, XS, S, M, L, XL, XXL, uploadedLocation } = this.state;

	// Validation checks - SORT THE REST OUT LATER
	if(name.length === 0) {
	  alert("You must set a name for the new item.");
	  this.setState({ disabled: false });
	  return;
	}

	if(type.length === 0) {
	  alert("You must set a type for the new item.");
	  this.setState({ disabled: false });
	  return;
	}

	// Add it to the database
	let query;
	try {
	  query = await api.post("/stash/stock", { name, available, type, customisationAvailable, cusotmisationDescription, addedPriceForCusotmisation, price, XS, S, M, L, XL, XXL, uploadedLocation });
	} catch (error) {
	  this.setState({ status: error.response.status, error: error.response.data.error, loaded: true });
	  return;
	}
	const productId = query.data.productId;

	this.saveSelectedColours(parseInt(productId));
	this.onUpload(parseInt(productId));

	// Update the data displayed once we do this
	this.props.updateStockListing();
	this.setState({ name: "", type: "Clothing", price: 0, customisationAvailable: false, cusotmisationDescription: "", addedPriceForCusotmisation: 0, available: true, disabled: false, XS: true, S: true, M: true, L: true, XL: true, XXL: true, pictures: [], progress: "0%", uploadedLocation: "" });
  }

  createColoursSelect(){
	let colours = [];
	let i = 0;
	while ( i < this.state.colours.length){
	  colours.push(<React.Fragment>
		<tr>
		  <td>{this.state.colours[i][0]}</td>
		  <td>
			<input
			  type="checkbox"
			  name={this.state.colours[i][0]}
			  onChange={this.onInputChange}
			  checked={this.state.available}
			/>
		  </td>
		</tr>
	  </React.Fragment>)
	  i++;
	}
	return(colours)
  }

  customisationOptions(){
	if (this.state.customisationAvailable){
		const desc = this.state.cusotmisationDescription;
	  return(
		<React.Fragment>
		  <div className="mx-auto w-max pb-4 border-b-2">
		    <label htmlFor="cusotmisationDescription" className="flex flex-row justify-start pb-2 text-lg font-semibold">Customisation Description</label>
		    <input
		      type="text"
		      name="cusotmisationDescription"
		      onChange={this.onInputChange}
		      value={this.state.cusotmisationDescription}
		      className="shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
		      disabled={this.state.disabled}
		    />
	      </div>
		  <div className="mx-auto w-max pb-4 border-b-2">
            <label htmlFor="addedPriceForCusotmisation" className="flex flex-row justify-start pb-2 text-lg font-semibold">Additional Cost of Customisation (£)</label>
              <input
                type="number"
                name="addedPriceForCusotmisation"
                onChange={this.onInputChange}
                value={this.state.addedPriceForCusotmisation}
                min="0"
                max="100"
                step="0.01"
                className="shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.state.disabled}
              />
          </div>
		</React.Fragment>
	  )
	}
	else{
	  return(<React.Fragment></React.Fragment>)
	}
  }

  imageSelectedButtonText(){
	if (this.state.pictures.length > 0){
	  return "Change Image";
	}
	return "Select Image"
  }

  readyToUploadMessage(){
	if (this.state.pictures.length > 0){
	  let fileName = this.state.pictures[0].name.toString();
	  return fileName+" is ready to upload";
	}
	return ""
  }

  render () {
	return (
	  <React.Fragment>
		<form onSubmit={this.createNewItem}>
		  <fieldset>
			<div className="mx-auto w-max pb-4 border-b-2 border-red-900">
			  <label htmlFor="name" className="flex flex-row justify-start pb-2 text-lg font-semibold">Name</label>
				<input
				  type="text"
				  name="name"
				  onChange={this.onInputChange}
				  value={this.state.name}
				  className="shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
				  disabled={this.state.disabled}
				/>
			  </div>
			  <div className="mx-auto w-max pb-4 border-b-2 border-red-900">
			  	<label htmlFor="type" className="flex flex-row justify-start pb-2 text-lg font-semibold">Category</label>
				<select
				  name="type"
				  onChange={this.onInputChange}
				  value={this.state.type}
				  className="shadow w-64 border rounded p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
				  disabled={this.state.disabled}
				>
				  <option value="clothing">Clothing</option>
				  <option value="accessory">Accessory</option>
				  <option value="other">Other</option>
				</select>
			  </div>
			  
			  <div className="mx-auto w-max pb-4 border-b-2 border-red-900">
			    <label htmlFor="price" className="flex flex-row justify-start pb-2 text-lg font-semibold">Base Price (£)</label>
				<input
				  type="number"
 				  name="price"
				  onChange={this.onInputChange}
			  	  value={this.state.price}
				  min="0"
				  max="100"
				  step="0.01"
				  className="shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
				  disabled={this.state.disabled}
				/>
			  </div>
			  <div className="mx-auto w-max pb-4 border-b-2 border-red-900">
				<label htmlFor="Cusomisable" className="flex flex-row justify-start pb-2 text-lg font-semibold">Customisation Available</label>
				<input
				  type="checkbox"
				  name="customisationAvailable"
				  onChange={this.onInputChange}
				  checked={this.state.customisationAvailable}
				  className="shadow w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
				/>
			  </div>

			  {this.customisationOptions()}

			  <div className="mx-auto w-max pb-4 border-b-2 border-red-900">
				<label htmlFor="sizes" className="flex flex-row justify-start pb-2 text-lg font-semibold">Available Sizes</label>
				<div name="sizes">
				  <table className="shadow w-64 border rounded p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50">
					<thead><tr><th>XS</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>XXL</th></tr></thead>
					<tbody><tr>
					  <td><input type="checkbox" name="XS" onChange={this.onInputChange} checked={this.state.XS} disabled={this.state.disabled}/></td>
					  <td><input type="checkbox" name="S" onChange={this.onInputChange} checked={this.state.S} disabled={this.state.disabled}/></td>
					  <td><input type="checkbox" name="M" onChange={this.onInputChange} checked={this.state.M} disabled={this.state.disabled}/></td>
					  <td><input type="checkbox" name="L" onChange={this.onInputChange} checked={this.state.L} disabled={this.state.disabled}/></td>
					  <td><input type="checkbox" name="XL" onChange={this.onInputChange} checked={this.state.XL} disabled={this.state.disabled}/></td>
					  <td><input type="checkbox" name="XXL" onChange={this.onInputChange} checked={this.state.XXL} disabled={this.state.disabled}/></td>
					</tr></tbody>
				  </table>
				</div>
			  </div>
			  <div className="mx-auto w-max pb-4 border-b-2 border-red-900">
				  <div className="shadow w-64 border rounded p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
					<ImageUploader
					  fileContainerStyle={{padding: 0+"px", margin: 0+"px"}}
					  buttonStyles={{border: "1px solid #BE2B2E", color:"black", background: "transparent", margin: 3+"px "+0}}
					  withIcon={false}
					  withLabel={false}
					  withPreview={false}
					  buttonText={this.imageSelectedButtonText()}
					  onChange={this.onDrop}
					  imgExtension={['.jpg', '.gif', '.png']}
					  maxFileSize={2097152}
					  fileSizeError=" is larger than filesize limit (2MB)"
					  fileTypeError=" is not a supported file type: .jpg, .gif or .png"
					  singleImage={true /* not allowed to upload multiple, for now... */}
					/>
					{this.readyToUploadMessage()}
					<div className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" style={{ width: this.state.progress, height: "2rem", padding: "2px" }}>
					   {this.state.progress}
					</div>
				  </div>
			  </div>
			  <div className="mx-auto w-64 pt-4 border-red-900">
				  Select Available Colours Below
				  <p></p>
				  <input
					type="submit"
					value="Create New Item"
					disabled={this.state.disabled}
					className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
				  />
			  </div>
			<div className="mx-auto pt-4 border-red-900">
			  <span className="w-full">New items are automatically marked available</span>
			</div>
		  </fieldset>
		</form>
	  </React.Fragment>
	)
  }
}

AddStock.propTypes = {
  updateStockListing: PropTypes.func.isRequired,
  selectedColours: PropTypes.object.isRequired,
  colours: PropTypes.array.isRequired
};

export default AddStock;
