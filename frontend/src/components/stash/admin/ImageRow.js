import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig.js';
import dateFormat from 'dateformat';
import ImageUploader from 'react-images-upload';

class ImageRow extends React.Component {
  constructor(props) {
	super(props);

	this.state = {
	  id: this.props.item.id,
	  name: this.props.item.name,
	  currentImages: [],
	  picturesToUpload: [],
	  progress: 0,
	  imagesDisplayFragments: [],
	  readyToUpload: false,
	  disabled: false
	}
	this.onDrop = this.onDrop.bind(this);
	this.onRemove = this.onRemove.bind(this);
  }

  onInputChange = e => {
	this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  componentDidMount = async () => {
	this.getAllImages();
  }

  createCodeFragments(){
	var length = this.state.currentImages.length;
	let codeSnippet = [];
	if (length !== 0){
	  for (var i=0; i < length; i++){
		codeSnippet.push(<tr><td><img src={this.state.currentImages[i].source}/></td>{this.getRemovalButtonCode(this.state.currentImages[i].name)}</tr>);
	  }
	}
	this.setState({ imagesDisplayFragments: codeSnippet });
  }

  getAllImages = async () => {
	this.setState({ currentImages: [] })
	let query;
	try {
	  let itemId = this.state.id;
	  query = await api.get(`/stash/allImageNames/${itemId}`);
	} catch (error) {
	  alert("An error occurred getting the details of images");
	  return;
	};
	const images = query.data.images;
	var length = images.length;
	if (length !== 0){
	  for (var i=0; i < length; i++){
		let newImg = await this.getImage(images[i].name);
		if (newImg !== null && newImg !== undefined){
		  const newImages = this.state.currentImages;
		  newImages.push(newImg);
		  this.setState({ currentImages: newImages });
		} 
	  }
	  this.createCodeFragments();
	}
  }

  getRemovalButtonCode(i){
    return(
	  <td className="w-auto p-1">
        <button
		  value={i}
          onClick={this.onRemove}
          disabled={this.state.disabled}
          className="px-2 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        >Remove</button>
      </td>
	)
  }
	
  getImage = async (imageName) => {
	let img = { name: "", source: "" };
	try {
	  let productId = this.state.id;
	  await api.get(`/stash/image/${imageName}/${productId}`, { responseType: 'arraybuffer' }).then(response => {
		const image = btoa(
		  new Uint8Array(response.data).reduce( (data, byte) => data + String.fromCharCode(byte), '' ),
		);
		img = { name: imageName, source: `data:${response.headers['content-type'].toLowerCase()};base64,${image}` };
	  });
    } catch (error) {
	  alert("An error occurred getting this image.");
	  return null;
	};
	return img;
  }

  onRemove = async (e) => {
	let index = -1;
	for (var i = 0; i < this.state.currentImages.length; i++){
	  if (this.state.currentImages[i].name === e.target.value){
		index = i; 
		break; 
	  }
	}
	if (index !== -1) {
	  const ImgToDelete = this.state.currentImages[i];
	  this.state.currentImages.splice(index);
	  await this.setState({ currentImages: [] });
		this.createCodeFragments();
		try {
		  let imageName = ImgToDelete.name;
		  let productId = this.state.id;
		  await api.delete(`/stash/image/${imageName}/${productId}`)
		  .then((response) => {
			this.getAllImages(); 
		  });
		} catch (error) {
		  alert("An error occurred removing this image.");
		return null;
	  };
	}
	else{ alert( "Unable to delete" ); }
  }

  onUpload = async () => {
	const productId = this.state.id;
	this.setState({ disabled: true, progress: 0+"%" });
	const pictures = this.state.picturesToUpload;
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
	this.setState({ picturesToUpload: [], disabled: false });
	this.getAllImages();
  }

  onDrop(pictureFiles, pictureDataURLs) {
	this.setState({
		picturesToUpload: pictureFiles
	});
  }

  readyToUploadMessage(){
    if (this.state.picturesToUpload.length > 0){
      let fileName = this.state.picturesToUpload[0].name.toString();
      return fileName+" is ready to upload";
    }
    return ""
  }

  render () {
	const colour = this.props.item.id % 2 === 0 ? "bg-red-100" : "bg-white";
	return (
	  <tr className={`${colour}`}>
		<td className="sm:w-40 p-2 border-r text-center border-gray-400">
		  <span disabled={this.state.disabled} className="w-full px-2 text-center font-semibold disabled:opacity-50">{this.state.name}</span>
		</td>
		<td className="w-64 p-2 border-r border-gray-400">
		  <table>
			  <tbody>{this.state.imagesDisplayFragments}</tbody>
		  </table>
		  
		</td>
		<td className="shadow w-40 border rounded p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
		
		  <ImageUploader
			fileContainerStyle={{padding: 0+"px", margin: 0+"px", maxWidth: "440px"}}
			buttonStyles={{border: "1px solid #BE2B2E", color:"black", background: "transparent", margin: 3+"px "+0}}
			withIcon={false}
			withLabel={false}
			withPreview={false}
			buttonText="Select new image"
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
		<button 
		  type="button"
		  onClick={this.onUpload}
		  disabled={this.state.picturesToUpload.length > 0 ? false:true}
		  className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
		>Upload</button>
		</td>
		<td className="hidden sm:table-cell p-2 border-r border-gray-400 text-center">
          {dateFormat(this.state.updatedAt, "dd/mm/yyyy HH:MM:ss")}
        </td>
	  </tr>
	)
  }
}

ImageRow.propTypes = {
  item: PropTypes.object.isRequired,
  key: PropTypes.number
};

export default ImageRow;