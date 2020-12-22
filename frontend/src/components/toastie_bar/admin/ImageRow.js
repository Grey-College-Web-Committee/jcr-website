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
	  imageName: null,
	  imageUrl: null,
	  picturesToUpload: [],
	  disabled: false
	}
	this.onDrop = this.onDrop.bind(this);
	this.onUpload = this.onUpload.bind(this);
  }

  componentDidMount = async() => {
    this.getImage();
  }

  onInputChange = e => {
	this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  getImage = async() => {
	let query;
    try {
      query = await api.get(`/toastie_bar/stock/${this.state.id}`);
    } catch (error) {
      alert(error);
    }
	const imageName = query.data.stockItem.imageName;
	console.log(imageName);
	if (imageName !== null){
		const imageUrl = `../uploads/images/toastie_bar/${imageName}`;
		const imageCode = <img alt={this.state.name} src={imageUrl}/>;
		this.setState({ imageUrl:imageCode, imageName });
	}
	else{
		this.setState({imageName:null, imageUrl: null});
	}
  }

  onUpload = async () => {
	const productId = this.state.id;
    this.setState({ disabled: true });
	const pictures = this.state.picturesToUpload;

    if(pictures.length === 0) { // No picture to upload
      this.setState({ disabled: false });
      return;
    }

    // Send to the server
    const file = pictures[0]
    const formData = new FormData();
    formData.append('file', file); // appending file
    let query;
    try {
      query = await api.post(`/toastie_bar/upload/${productId}`, formData);
    } catch (error) {
      alert("An error occurred adding this colour option");
      this.setState({ disabled: false });
      return;
    }
    await this.getImage();
	this.setState({ picturesToUpload: [], disabled: false });
	alert(query.data.message);
	return;
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
	return (
	  <tr className="border-b border-red-900">
		<td className="sm:w-40 p-2 border-r text-center border-gray-400">
		  <span disabled={this.state.disabled} className="w-full px-2 text-center font-semibold disabled:opacity-50">{this.state.name}</span>
		</td>
		<td className="w-64 p-2 border-r border-gray-400">
		  {this.state.imageName === null ? "No image":this.state.imageUrl}
		</td>
		<td className="p-2 shadow w-40 border-r border-gray-400">
		 <div>
		    <ImageUploader
			  fileContainerStyle={{ padding: "0px", margin: 1+"px", maxWidth: "440px"}}
			  buttonStyles={{border: "1px solid #BE2B2E", color:"black", background: "transparent", margin: 2+"px "+0, padding: "6px"}}
			  withIcon={false}
			  withLabel={false}
			  withPreview={false}
			  buttonText={this.state.imageName === null ? "Select new image":"Replace Image"}
			  onChange={this.onDrop}
			  imgExtension={['.jpg', '.gif', '.png']}
			  maxFileSize={2097152}
			  fileSizeError=" is larger than filesize limit (2MB)"
			  fileTypeError=" is not a supported file type: .jpg, .gif or .png"
			  singleImage={true /* not allowed to upload multiple, for now... */}
		    />
		    {this.readyToUploadMessage()}
		    <button
		      type="button"
		      onClick={this.onUpload}
		      disabled={this.state.picturesToUpload.length > 0 ? false:true}
		      className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
		    >Upload</button>
		  </div>
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
  key: PropTypes.number,
  //updateFunc: PropTypes.func.isRequired
};

export default ImageRow;
