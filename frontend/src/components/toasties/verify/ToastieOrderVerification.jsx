import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

class ToastieOrderVerification extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      verificationCode: this.props.match.params.verificationCode,
      loaded: false,
      success: false,
      verificationResult: "",
      errorStatus: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  componentDidMount = async () => {
    const { verificationCode } = this.state;

    let result;

    try {
      result = await api.post("/toastie/verify", { verificationCode })
    } catch (error) {
      this.setState({ errorStatus: error.response.status });
      return;
    }

    const { success, reason } = result.data;
    this.setState({ success, verificationResult: reason, loaded: true });
  }

  renderResult = () => {
    const { success, verificationResult } = this.state;

    if(success) {
      return (
        <div className="flex flex-col items-center">
          <h2 className="font-semibold text-3xl mb-2">Order Verified</h2>
          <p className="text-lg mb-1">Your order has been sent to the Toastie Bar, you will receive an email notification when it is ready!</p>
          <p className="text-lg">You can safely leave this page, you should also receive an email confirming verification.</p>
        </div>
      )
    }

    let message = "";

    switch(verificationResult) {
      case "closed":
        message = "The Toastie Bar is now closed and is unable to accept this order.";
        break; 
      case "invalid_code":
        message = "This verification link is invalid or the it has expired.";
        break;
      case "already_verified":
      case "already_completed":
        message = "This order has already been verified or completed";
        break;
      case "timeout":
        message = "This order verification link has expired. Please reorder.";
        break;
      default:
        return
    }

    return (
      <div className="flex flex-col items-center">
        <h2 className="font-semibold text-3xl mb-2">Verification Error</h2>
        <p className="text-lg">{message}</p>
      </div>
    )
  }

  render () {
    const { loaded } = this.state;

    if(this.state.errorStatus !== false) {
      return (
        <Redirect to={`/errors/${this.state.errorStatus}`} />
      );
    }

    return (
      <div className="flex flex-col">
        <div className="relative">
          <img
            src="/images/fs_banner.jpg"
            className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
            alt="Generic Banner"
          ></img>
          <img
            src="/images/fs_banner.jpg"
            className="w-full h-auto relative z-0 block lg:hidden"
            alt="Generic Banner"
          ></img>
          <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
            <div className="flex flex-row align-middle items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold">Order Verification</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col my-4 justify-center items-left md:w-3/5 md:mx-auto mx-2">
          {
            !loaded ? (
              <LoadingHolder
                text="Verifying order, please wait..."
              />
            ) : this.renderResult()
          }
        </div>
      </div>
    );
  }
}

ToastieOrderVerification.contextType = authContext;

export default ToastieOrderVerification;
