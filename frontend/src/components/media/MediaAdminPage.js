import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';

class MediaAdminPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      media: [],
      title: "",
      type: "Podcast",
      category: "JCR Podcast",
      description: "",
      link: ""
    };

    // Change this to your permission
    this.requiredPermission = "media.manage";
  }

  onInputChange = e => {
    if (e.target.name === "link"){
      if (this.state.type === "Podcast"){
        const url = this.getPodcastUrlFromiFrameString(e.target.value);
        this.setState({ link: url });
        return;
      }
    }
    if (e.target.name === "type"){
      if (e.target.value === "Podcast"){
        const url = this.getPodcastUrlFromiFrameString(this.state.link);
        this.setState({ type: "Podcast", category: "JCR Podcast" });
        return;
      }
      this.setState({ type: "Video", category: "JCR Events Video" });
      return;
    }
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  getPodcastUrlFromiFrameString(iframe){
    const splitbit = iframe.slice(iframe.indexOf("/tracks/")+8, iframe.indexOf("&color="));
    return splitbit;
  }

  getAllMedia = async () => {
    let content;

    try {
      content = await api.get("/media/all");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let { media } = content.data;

    media.sort((a, b) => {
      return -(a.lastUpdate < b.lastUpdate ? -1 : (a.lastUpdate > b.lastUpdate ? 1 : 0));
    });

    this.setState({ media });
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
      console.log("nope")
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    // Once the component is ready we can query the API
    this.getAllMedia();
    console.log(this.state.media)
    this.setState({ loaded: true, status: 200 });
  }

  createNewItem = async e => {
    // Prevent refresh on button click and prevent resubmission
    e.preventDefault();
    this.setState({ disabled: true });
  
    const { title, type, category, link, description } = this.state;
  
    // Validation checks
    if(title.length === 0) {
      alert("You must set a title for the new item.");
      this.setState({ disabled: false });
      return;
    }
  
    if(type.length === 0) {
      alert("You must set a type for the new item.");
      this.setState({ disabled: false });
      return;
    }
  
    if(category.length === 0) {
      alert("You must set a category for the new item.");
      this.setState({ disabled: false });
      return;
    }
  
    if(link.length === 0) {
      alert("You must set a link for the new item.");
      this.setState({ disabled: false });
      return;
    }
  
    if(description === undefined || description === null) {
      alert("You invalid description for the new item.");
      this.setState({ disabled: false });
      return;
    }
  
    // Add it to the database
    let query;
    try {
      query = await api.post("/media/new", { title, type, category, description, link });
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error, loaded: true });
      return;
    }
    
    this.setState({ title: "", type: "Podcast", category: "JCR Podcast", description: "", link: "", disabled: false });
    this.getAllMedia();
  }

  deleteItem = async(e)=>{
    // Prevent resubmission
    e.preventDefault();
    this.setState({ disabled: true });
    console.log(e.target.value)

    try {
      await api.delete(`/media/item/${e.target.value}`);
    } catch (error) {
      alert("An error occurred deleting this item");
      return;
    }
    this.setState({ disabled: false });
    this.getAllMedia();
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
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Manage Media</h1>
          <div>
            <table className="mx-auto border-2 text-left border-red-900 w-full my-2">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Title</th>
                  <th className="p-2 font-semibold">Type</th>
                  <th className="p-2 font-semibold">Category</th>
                  <th className="p-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {this.state.media.map((media, i) => (
                  <tr className="text-center border-b border-gray-400">
                    <td className="p-2 border-r border-gray-400">{media.mediaTitle}</td>
                    <td className="p-2 border-r border-gray-400">{media.mediaType}</td>
                    <td className="p-2 border-r border-gray-400">{media.mediaCategory}</td>
                    <td className="p-2 border-r border-gray-400">
                      <button
                        value={media.id}
                        onClick={this.deleteItem}
                        disabled={this.state.disabled}
                        className="px-1 py-1 rounded bg-red-900 text-white w-16 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h1 className="font-semibold text-5xl py-4">Add New Media Item</h1>
          Please note, links for podcasts currently need to be embed code of audio files from SoundCloud.
          <p></p>
          <div>
            <form onSubmit={this.createNewItem}>
              <fieldset>
                <table className="mx-auto border-2 content-evenly text-left border-red-900"><tbody>
                  <tr className="content-evenly w-max pt-4">
                    <td className="content-center mx-auto w-auto">
                      <div className="mx-4 py-2  border-b-2 border-red-900">
                        <label htmlFor="name" className="flex flex-row justify-start pb-2 text-lg font-semibold">Media Title</label>
                        Enter title of this media item
                        <p></p>
                        <input
                          type="text"
                          name="title"
                          onChange={this.onInputChange}
                          value={this.state.title}
                          className="shadow w-max border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
                          disabled={this.state.disabled}
                        />
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="mx-4 w-auto text-right p-2 border-b-2 border-red-900">
                        <label htmlFor="manufacturerCode" className="flex flex-row justify-end pb-2 text-lg font-semibold">Link to Media</label>
                        Paste the embed code for the item here
                        <p></p>
                        <input
                          type="text"
                          name="link"
                          onChange={this.onInputChange}
                          value={this.state.link}
                          className="shadow w-72 border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
                          disabled={this.state.disabled}
                        />
                      </div>
                    </td> 
                  </tr>
                  <tr> 
                    <td colSpan={2}>
                      <div className="mx-4 w-auto pb-2 pt-6 border-b-2 border-red-900">
                        <label htmlFor="description" className="flex flex-row justify-start pb-2 text-lg font-semibold">Description of Item</label>
                        <textarea
                          name="description"
                          onChange={this.onInputChange}
                          value={this.state.description}
                          className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
                          disabled={this.state.disabled}
                        />
                      </div>
                    </td> 
                  </tr>
                  <tr> 
                    <td>
                      <div className="mx-4 w-max pb-2 pt-6 border-b-2 border-red-900">
                        <label htmlFor="type" className="flex flex-row justify-start pb-2 text-lg font-semibold">Type</label>
                        <select
                          name="type"
                          onChange={this.onInputChange}
                          value={this.state.type}
                          className="shadow w-64 border rounded p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
                          disabled={this.state.disabled}
                          >
                          <option value="Podcast">Podcast</option>
                          <option value="Video">Video</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="mx-4 w-auto pb-2 pt-6 border-b-2 border-red-900">
                        <label htmlFor="category" className="flex flex-row justify-end pb-2 text-lg font-semibold">Category</label>
                        <select
                          name="category"
                          onChange={this.onInputChange}
                          value={this.state.category}
                          className="shadow w-64 border rounded p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-400 disabled:opacity-50"
                          disabled={this.state.disabled}
                          >
                          {this.state.type === "Podcast" ? <option value="JCR Podcast">JCR Podcast</option> : (this.state.type === "Video" ? <option value="JCR Event Video">JCR Events Video</option> : <option value="Other">Other</option>)}
                          {this.state.type === "Podcast" ? <option value="Grey Matter Podcast">Grey Matter Podcast</option> : (this.state.type === "Video" ? <option value="Freshers' Video">Freshers' Video</option> : <></>)}
                          {this.state.type === "Podcast" ? <option value="Other Podcast">Other Podcast</option> : (this.state.type === "Video" ? <option value="Other Video">Other Video</option> : <></>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <div className="rounded-lg content-center text-center m-4 w-auto py-4 pt-6 border-4 border-red-900">
                        <input
                          type="submit"
                          value="Create New Item"
                          disabled={this.state.disabled}
                          className="px-4 py-1 m-4 rounded bg-red-900 text-white w-40 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        />
                      </div>
                    </td> 
                  </tr>
                </tbody></table>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default MediaAdminPage;