import React from 'react'
import PropTypes from 'prop-types'

class FileDirectory extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: this.props.subFolders.map(_ => false)
    }
  }

  toggleOpen = (i) => {
    let {open} = this.state;
    open[i] = !open[i];
    this.setState({ open });
  }

  render () {
    if(!this.props.parentOpen) {
      return null;
    }

    const topLevel = this.props.topLevel ? this.props.topLevel : false;

    return (
      <div className={`${topLevel ? "": "border-l border-gray-400"} pl-1`}>
        {
          this.props.details && this.props.details.description !== null ? (
            <p className="text-base my-1">{this.props.details.description}</p>
          ) : null
        }
        {
          this.props.subFolders.map((subfolder, i) => (
            <div className="my-1" key={i}>
              <div className="flex flex-row items-center cursor-pointer" onClick={() => this.toggleOpen(i)}>
                <img
                  src={this.state.open[i] ? "/images/files/folder_open.png" : "/images/files/folder_closed.png"}
                  className="h-8 w-8"
                  alt="Folder"
                />
                <span className="ml-2">{subfolder.details.name}</span>
              </div>
              <div className={`px-8 ${this.state.open[i] ? "" : "hidden"}`}>
                <FileDirectory
                  key={i}
                  {...subfolder}
                  parentOpen={this.state.open[i]}
                />
              </div>
            </div>
          ))
        }
        {
          this.props.files.map((file, i) => (
            <a href={`/uploads/jcr/${file.realFileName}/${file.name}`} target="_blank" key={i} rel="noopener noreferrer">
              <div className="flex flex-row my-1 items-center">
                <img
                  src="/images/files/file.png"
                  className="h-8 w-8"
                  alt="File"
                />
                <span className="ml-2">{file.name}</span>
              </div>
            </a>
          ))
        }
      </div>
    );
  }
}

FileDirectory.propTypes = {
  details: PropTypes.any,
  files: PropTypes.array.isRequired,
  leaf: PropTypes.bool.isRequired,
  parentOpen: PropTypes.bool.isRequired,
  subFolders: PropTypes.array.isRequired,
  topLevel: PropTypes.bool.isRequired
}

export default FileDirectory;
