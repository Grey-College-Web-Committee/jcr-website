import React from 'react';
import authContext from '../../utils/authContext.js';

class HomePage extends React.Component {
  getSlideshowPictures = () => {
    return [
      {
        "desktop_title": "Grey College Charity Fashion Show",
        "mobile_title": "GCCFS",
        "description_text": "Find out more about the annual charity fashion show",
        "button_text": "Find out more →",
        "button_link": "https://www.gccfs.co.uk/",
        "image": "/images/home/gccfs_1900_600.png"
      }
    ];
  }

  render () {
    const loggedIn = this.context !== undefined && this.context !== null;

    const temp = this.getSlideshowPictures()[0];

    /**
    <div className="flex justify-center items-center">
      <div className="container mx-auto text-center p-4">
        <div className="flex flex-row justify-center">
          <div>
          </div>
        </div>
      </div>
    </div>
    */

    return (
      <div className="relative">
        <img
          src={temp.image}
          className="w-full h-auto relative z-0"
        ></img>
      <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-auto flex flex-col items-end text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-between">
          <h2 className="font-bold text-4xl">{temp.desktop_title}</h2>
          <button
            className="font-semibold p-2 text-2xl mt-4 bg-red-900 bg-opacity-50 hover:bg-opacity-75 transition-all focus:outline-none rounded-lg hover:shadow-inner"
          >{temp.button_text}</button>
        </div>
        <div className="absolute z-10 top-0 left-0 w-full h-full flex flex-row justify-between text-white items-center text-2xl hover:z-30">
          <div className="h-full hover:bg-grey-500 hover:bg-opacity-25 cursor-pointer p-4 flex flex-col justify-center">
            ←
          </div>
          <div className="h-full hover:bg-grey-500 hover:bg-opacity-25 cursor-pointer p-4 flex flex-col justify-center">
            →
          </div>
        </div>
        <div className="absolute z-10 top-0 left-0 w-full h-auto flex flex-row justify-center text-white items-center">
          A
        </div>
      </div>
    );
  }
}

HomePage.contextType = authContext;

export default HomePage;
