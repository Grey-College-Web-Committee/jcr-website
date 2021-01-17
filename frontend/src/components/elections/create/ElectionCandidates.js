import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class ElectionCandidates extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      manifesto: null,
      disabled: false,
      fileRefreshToken: new Date()
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  }

  onFileSelect = e => {
    this.setState({ [e.target.name]: e.target.files[0] });
  }

  addCandidate = async e => {
    e.preventDefault();
    this.setState({ disabled: true });

    const { name, manifesto } = this.state;

    if(name.length === 0) {
      alert("You must set the candidate's name");
      this.setState({ disabled: false });
      return;
    }

    if(manifesto === null) {
      alert("You must add the candidate's manifesto");
      this.setState({ disabled: false });
      return;
    }

    // Validated so now upload the data
    const formData = new FormData();
    formData.append("name", name);
    formData.append("manifesto", manifesto);
    formData.append("electionId", this.props.electionId);

    let result;

    try {
      result = await api.post("/elections/candidate", formData, {
        headers: { "content-type": "multipart/form-data" }
      });
    } catch (error) {
      alert("Unable to add candidate to the election");
      return;
    }

    this.props.addCandidate(result.data);

    this.setState({
      name: "",
      manifesto: null,
      disabled: false,
      fileRefreshToken: new Date()
    });
  }

  render () {
    if(this.props.disabled) {
      return (
        <p className="text-lg mb-4">Once you have confirmed the election details you will be able to add candidates.</p>
      );
    }

    return (
      <div className="w-full">
        <p className="text-xl">Ensure you have added all candidates as these cannot be changed.</p>
        <p>When you click on 'Add Candidate' they will automatically be added to the election.</p>
        <form onSubmit={this.addCandidate}>
          <fieldset>
            <div className="mx-auto w-full pb-4 border-b-2">
              <label htmlFor="name" className="flex flex-row justify-start pb-2 text-lg font-semibold">Candidate Name</label>
              <input
                type="text"
                name="name"
                value={this.state.name}
                onChange={this.onInputChange}
                className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                placeholder="Candidate name..."
                disabled={this.state.disabled || this.props.disabled}
              />
            </div>
            <div className="mx-auto w-full pb-4 border-b-2 mt-2">
              <label htmlFor="name" className="flex flex-row justify-start pb-2 text-lg font-semibold">Candidate Manifesto</label>
              <input
                type="file"
                name="manifesto"
                onChange={this.onFileSelect}
                disabled={this.state.disabled || this.props.disabled}
                accept=".pdf"
                multiple={false}
                key={this.state.fileRefreshToken}
              />
            </div>
            <div className="mx-auto w-full my-2 border-b-2">
              <input
                type="submit"
                className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.state.disabled || this.props.disabled}
                value="Add Candidate"
              />
            </div>
          </fieldset>
        </form>
      </div>
    );
  }
}

ElectionCandidates.propTypes = {
  disabled: PropTypes.bool.isRequired,
  electionId: PropTypes.number.isRequired,
  addCandidate: PropTypes.func.isRequired
}

export default ElectionCandidates;
