import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import BarDropdown from './BarDropdown';

class BarOrderingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      baseDrinks: [],
      byType: {},
      hasScrolled: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  componentDidUpdate = () => {
    if(this.state.loaded) {
      this.scrollToLastPosition();
    }
  }

  scrollToLastPosition = () => {
    if(this.state.hasScrolled) {
      return;
    }

    this.setState({ hasScrolled: true });

    setTimeout(() => {
      window.requestAnimationFrame(() => {
        const y = localStorage.getItem("bar_scroll_position");
        window.scrollTo(0, y);
        localStorage.removeItem("bar_scroll_position");
      });
    });
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status", isMember: false });
      return;
    }

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
      return;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/bar");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { baseDrinks } = content.data;

    // Now sort into types
    const byType = {};

    baseDrinks.forEach((base, i) => {
      const typeName = base.BarDrinkType.name;
      let inType = [];

      if(Object.keys(byType).includes(typeName)) {
        inType = byType[typeName];
      }

      inType.push(base);
      byType[typeName] = inType;
    });

    // TODO: Sort by type name

    this.setState({ loaded: true, status: 200, baseDrinks, byType });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/membership" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">College Bar</h1>
          {
            Object.keys(this.state.byType).map((typeName, i) => (
              <BarDropdown
                title={typeName}
                groupItems={this.state.byType[typeName]}
                key={i}
                identifier={typeName}
              />
            ))
          }
        </div>
      </div>
    );
  }
}

BarOrderingPage.contextType = authContext;

export default BarOrderingPage;
