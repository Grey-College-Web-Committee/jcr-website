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

    return (
      <div>
        {
          this.props.subFolders.sort((a, b) => {
            return a.details.name > b.details.name ? 1 : (a.details.name < b.details.name ? -1 : 0)
          }).map((subfolder, i) => (
            <div className="my-1">
              <div className="flex flex-row items-center cursor-pointer" onClick={() => this.toggleOpen(i)}>
                <img
                  src={this.state.open[i] ? "/images/files/folder_open.png" : "/images/files/folder_closed.png"}
                  className="h-8 w-8"
                />
                <span className="ml-2">{subfolder.details.name}</span>
              </div>
              <div className={`px-6 ${this.state.open[i] ? "" : "hidden"}`}>
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
          this.props.files.sort((a, b) => {
            return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0)
          }).map((file, i) => (
            <a className="" href={`/uploads/jcr/${file.realFileName}`} target="_blank">
              <div className="flex flex-row my-1 items-center">
                <img
                  src="/images/files/file.png"
                  className="h-8 w-8"
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

export default FileDirectory;
