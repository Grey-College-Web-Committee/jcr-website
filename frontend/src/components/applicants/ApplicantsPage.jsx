import React from 'react';
import authContext from '../../utils/authContext.js';
import ReactPlayer from 'react-player';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.js?url';
import {Document, Page} from 'react-pdf';
import {pdfjs} from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

class ApplicantsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      numPages: null,
      pageNumber: 1
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  onAskMeLoad = ({ numPages }) => {
    this.setState({ numPages })
  }

  changePage = (e, direction) => {
    e.preventDefault()

    let newPage = this.state.pageNumber + direction;

    if(newPage > this.state.numPages) {
      newPage = this.state.numPages;
    } else if (newPage < 1) {
      newPage = 1;
    }

    this.setState({ pageNumber: newPage })
  }

  render () {
    return (
      <div className="flex flex-col">
        <div className="relative">
          <img
            src="/images/applicants/desktop_applicants_banner.jpg"
            className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
            alt="Applicants Banner"
          ></img>
          <img
            src="/images/applicants/mobile_applicants_banner.jpg"
            className="w-full h-auto relative z-0 block lg:hidden"
            alt="Applicants Banner"
          ></img>
          <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
            <div className="flex flex-row align-middle items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold">Applying to Grey</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col my-4 justify-center items-center md:w-3/5 md:mx-auto mx-2">
          <div className="text-lg mb-2 border-b-2 border-red-900">
            <p className="mb-2">Want to know more about why we love Grey? Have a look at our Q&A video and our handy 'Ask Me About...' pack below featuring our post-offer day helpers who range from freshers, who joined us last year, to postgrads, who are coming to the end of their time here. They answer some of the most common questions about what life is like at Grey from the location and food to the community and sports. If you have anything else you want to know then feel free to ask the post-offer day helpers who will be more than happy to tell you about their time here! <a href="https://www.youtube.com/playlist?list=PLId2HYgr5vJb2foQjYhFJaWY9QAgUFwtP" rel="noopener noreferrer" target="_blank" className="underline">In the meantime, feel free to check out some of our promo videos of some of the highlights of the college calendar including Freshers' Week and Phoenix Ball by clicking here.</a></p>
            <p className="md:text-center mb-2">We hope you enjoy your visit to Durham and we look forward to welcoming you in September!</p>
          </div>
          <div className="flex flex-col justify-center pb-2 border-b-2 border-red-900 w-full">
            <h2 className="text-3xl md:text-5xl font-semibold mb-4 mx-auto">Student Q&A</h2>
            <div className="mx-auto hidden md:block">
              <ReactPlayer url="https://www.youtube.com/watch?v=wVNw_YxIOQI" width="1000px" height="536px" />
            </div>
            <div className="mx-auto md:hidden">
              <ReactPlayer url="https://www.youtube.com/watch?v=wVNw_YxIOQI" width="300px" height="200px" />
            </div>
          </div>
          <div className="flex flex-col my-2 justify-center">
            <h2 className="text-5xl font-semibold mb-4 mx-auto">Ask Me About...</h2>
            <div className="md:hidden">
              <p></p>
              <p className="underline text-lg">
                <a href="https://qrcgcustomers.s3-eu-west-1.amazonaws.com/account18262887/25276512_1.pdf?0.20957975808237705" rel="noopener noreferrer" target="_blank">On smaller screens we recommend opening this document in a separate tab so that it is readable. Please click here to do so! (Opens in a new tab)</a>
              </p>
            </div>
            <div className="md:block hidden">
              <div className="border-2 border-red-900">
                <Document file="https://qrcgcustomers.s3-eu-west-1.amazonaws.com/account18262887/25276512_1.pdf" onLoadSuccess={this.onAskMeLoad}>
                  <Page pageNumber={this.state.pageNumber} />
                </Document>
              </div>
              <div className="flex flex-row justify-between text-lg align-middle items-center mt-2">
                <p>Page {this.state.pageNumber} of {this.state.numPages}</p>
                <div>
                  <button
                    onClick={(e) => this.changePage(e, -1)}
                    className="bg-red-900 px-2 text-white mr-2"
                  >Previous</button>
                  <button
                    onClick={(e) => this.changePage(e, 1)}
                    className="bg-red-900 px-2 text-white"
                  >Next</button>
                </div>
              </div>
              <p className="underline text-lg font-semibold">
                <a href="https://qrcgcustomers.s3-eu-west-1.amazonaws.com/account18262887/25276512_1.pdf?0.20957975808237705" rel="noopener noreferrer" target="_blank">Click here to open this in a new tab...</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ApplicantsPage.contextType = authContext;

export default ApplicantsPage;
