import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

class ErrorPage extends React.Component {
  constructor(props) {
    super(props);

    let code;

    if(this.props.code) {
      code = this.props.code;
    } else {
      code = this.props.match.params.code;
    }

    this.state = {
      code
    };
  }

  getErrorContent = (code) => {
    if(code === undefined || code === null) {
      code = "404";
    }

    let intCode = parseInt(code);

    if(isNaN(intCode)) {
      intCode = 404;
    }

    const errors = [
      {
        codes: [ 400 ],
        title: "Bad Request",
        description: "There was an issue with the action you were trying to perform. Please try again later.",
        redirect: {
          url: "/",
          text: "Click here to return home"
        }
      },
      {
        codes: [ 401 ],
        title: "Not Logged In",
        description: "You must be logged in to perform this action.",
        redirect: {
          url: "/accounts/login",
          text: "Click here to login"
        }
      },
      {
        codes: [ 403 ],
        title: "Unauthorised Access",
        description: "You do not have permission to perform this action.",
        redirect: {
          url: "/",
          text: "Click here to return home"
        }
      },
      {
        codes: [ 404 ],
        title: "Page Not Found",
        description: "The page you tried to reach doesn't exist.",
        redirect: {
          url: "/",
          text: "Click here to return home"
        }
      },
      {
        codes: [ 500 ],
        title: "Server Error",
        description: "Something went wrong. Please try again later.",
        redirect: {
          url: "/",
          text: "Click here to return home"
        }
      }
    ];

    let filtered = errors.filter(error => error.codes.includes(intCode));

    if(filtered.length === 0) {
      filtered = errors.filter(error => error.codes.includes(404));
    }

    return filtered[0];
  }

  render () {
    const error = this.getErrorContent(this.state.code);

    return (
      <div className="flex justify-center items-center">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">{error.title}</h1>
          <p>{error.description}</p>
          <Link to={error.redirect.url}>
            <button
              className="px-4 py-1 mt-4 rounded bg-red-900 text-white w-64 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >
              {error.redirect.text}
            </button>
          </Link>
        </div>
      </div>
    );
  }
}

ErrorPage.propTypes = {
  code: PropTypes.oneOf([PropTypes.string, PropTypes.number])
}

export default ErrorPage;
