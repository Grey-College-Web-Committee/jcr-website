import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import NewFolderForm from './NewFolderForm';

class ManageJCRFilesPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
    };

    // Change this to your permission
    this.requiredPermission = "jcr.files";
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

    let folderRes;

    try {
      folderRes = await api.get("/jcr/folders");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    const { folders: unmappedFolders } = folderRes.data;

    const folders = [];

    for(const folder of unmappedFolders) {
      const { createdAt, description, id, name, parent, updatedAt } = folder;
      folders.push({ createdAt, description, id, name, parent, updatedAt });
    }

    // Load any required data for the page here

    this.setState({ loaded: true, folders });
  }

  onFolderCreated = (folder) => {
    let { folders } = this.state;
    folders.push(folder);
    // Might need a refresh ID
    this.setState({ folders });
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
          <h1 className="font-semibold text-5xl pb-4">Manage Files</h1>
          <NewFolderForm
            folders={this.state.folders}
            onCreate={this.onFolderCreated}
          />
        </div>
      </div>
    );
  }
}

export default ManageJCRFilesPage;
