import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import NewFileForm from './NewFileForm';
import FileRow from './FileRow';
import NewFolderForm from './NewFolderForm';
import FolderRow from './FolderRow';

class ManageJCRFilesPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      files: [],
      folders: []
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

    let result;

    try {
      result = await api.get("/jcr/structure");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    const { structure } = result.data;
    const { folders, files } = this.parseStructure(structure);

    // Load any required data for the page here

    this.setState({ loaded: true, structure, folders, files });
  }

  parseSubfolder = (parentStr, folder, parentId) => {
    let parts = [];

    // Add itself
    parts.push({
      id: folder.details.id,
      display: `${parentStr} > ${folder.details.name}`,
      name: folder.details.name,
      description: folder.details.description,
      parent: parentId
    });

    // If it's a leaf then it has no subfolders
    if(folder.leaf === true) {
      return parts;
    }

    // Then add its children recursively
    folder.subFolders.forEach(sub => {
      parts = parts.concat(this.parseSubfolder(`${parentStr} > ${folder.details.name}`, sub, folder.details.id));
    });

    return parts;
  }

  parseFilesInFolder = (folder) => {
    let parts = [];

    folder.files.forEach(file => {
      parts.push({
        id: file.id,
        name: file.name,
        description: file.description,
        parent: folder.details.id,
        realFileName: file.realFileName
      });
    });

    if(folder.leaf === true) {
      return parts;
    }

    // Then add its children recursively
    folder.subFolders.forEach(sub => {
      parts = parts.concat(this.parseFilesInFolder(sub));
    });

    return parts;
  }

  parseStructure = (structure) => {
    let folders = [];
    let files = [];

    structure.files.forEach(file => {
      files.push({
        id: file.id,
        name: file.name,
        description: file.description,
        parent: null,
        realFileName: file.realFileName
      });
    });

    // We want to build the names of the folders including their parents
    // and collect their children files
    structure.subFolders.forEach(folder => {
      // Start with the base subfolders
      folders = folders.concat(this.parseSubfolder("[Base]", folder, null));
      files = files.concat(this.parseFilesInFolder(folder));
    });

    return { folders, files };
  }

  onFolderCreated = (folder) => {
    let { folders } = this.state;

    console.log({folder, folders});

    let parent = [];

    if(folder.parent !== null) {
      parent = folders.filter(f => Number(f.id) === Number(folder.parent));
    }

    if(parent.length !== 0) {
      folders.push({ id: folder.id, display: `${parent[0].display} > ${folder.name}`});
    } else {
      folders.push({ id: folder.id, display: `[Base] > ${folder.name}`});
    }

    // Might need a refresh ID
    this.setState({ folders });
  }

  onFileCreated = (file) => {
    let { files } = this.state;
    files.push(file);
    this.setState({ files });
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
          <NewFileForm
            folders={this.state.folders}
            onCreate={this.onFileCreated}
          />
          <NewFolderForm
            folders={this.state.folders}
            onCreate={this.onFolderCreated}
          />
          <div>
            <h2 className="font-semibold text-2xl pb-2 text-left">Existing Files</h2>
            <table className="mx-auto border-2 text-left border-red-900 w-full mt-4">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Description</th>
                  <th className="p-2 font-semibold">File</th>
                  <th className="p-2 font-semibold">Folder</th>
                  <th className="p-2 font-semibold">Save</th>
                  <th className="p-2 font-semibold">Delete</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.files.map((file, id) => (
                    <FileRow
                      key={id}
                      file={file}
                      folders={this.state.folders}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="font-semibold text-2xl pb-2 text-left">Existing Folders</h2>
            <p className="font-semibold text-left py-1">Changing the details of a folder will reload the page to avoid issues with propagating the file system structure.</p>
            <p className="py-1 text-left">You also cannot change the subdirectory structure as it could introduce loops in the system and make files unreachable!</p>
            <table className="mx-auto border-2 text-left border-red-900 w-full mt-4">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Description</th>
                  <th className="p-2 font-semibold">Structure</th>
                  <th className="p-2 font-semibold">Save</th>
                  <th className="p-2 font-semibold">Delete</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.folders.map((folder, id) => (
                    <FolderRow
                      key={id}
                      folder={folder}
                      folders={this.state.folders}
                    />
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

export default ManageJCRFilesPage;
