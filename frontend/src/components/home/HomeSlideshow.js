import React from 'react';
import PropTypes from 'prop-types';
import data from './HomeSlideshowContent';

class HomeSlideshow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      position: 0,
      autoChangeId: null,
      resumeAutoId: null
    }
  }

  componentDidMount = () => {
    // Force preload the images
    data.forEach(entry => {
      new Image().src = entry.image;
    });

    const autoChangeId = window.setTimeout(this.autoScroll, 5000);
    this.setState({ autoChangeId });
  }

  autoScroll = () => {
    this.moveSlide(1, false);
    const autoChangeId = window.setTimeout(this.autoScroll, 5000);
    this.setState({ autoChangeId });
  }

  moveSlide = (amount, forced) => {
    let { position, autoChangeId, resumeAutoId } = this.state;
    position += amount;

    if(position >= data.length) {
      position = position % data.length;
    }

    if(position < 0) {
      position = data.length - 1;
    }

    if(forced) {
      if(autoChangeId !== null) {
        window.clearTimeout(autoChangeId);
      }

      if(resumeAutoId !== null) {
        window.clearTimeout(resumeAutoId);
      }

      resumeAutoId = window.setTimeout(this.autoScroll, 10000);
    }

    this.setState({ position, resumeAutoId });
  }

  setPosition = (position) => {
    let { autoChangeId, resumeAutoId } = this.state;

    if(autoChangeId !== null) {
      window.clearTimeout(autoChangeId);
    }

    if(resumeAutoId !== null) {
      window.clearTimeout(resumeAutoId);
    }

    resumeAutoId = window.setTimeout(this.autoScroll, 10000);

    this.setState({ position });
  }

  render () {
    const { position } = this.state;
    const selected = data[position];

    return (
      <div className="relative">
        <img
          src={selected.image}
          className="w-full h-auto relative z-0"
        ></img>
        <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-auto flex-col items-end text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-between md:flex hidden">
          <h2 className="font-bold text-4xl">{selected.desktop_title}</h2>
          <a href={selected.button_link} target={selected.button_target}>
            <button
              className="font-semibold p-2 text-2xl mt-4 bg-red-900 bg-opacity-50 hover:bg-opacity-75 transition-all focus:outline-none rounded-lg hover:shadow-inner duration-700 ease-in-out"
            >{selected.button_text}</button>
          </a>
        </div>
        <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-1/4 flex flex-row justify-between text-white bg-grey-500 bg-opacity-75 border-t-2 border-b-2 border-red-900 md:hidden items-center">
          <h2 className="font-bold text-2xl">{selected.mobile_title}</h2>
          <a href={selected.button_link} target={selected.button_target}>
            <button
              className="font-semibold text-lg"
            >{selected.button_text}</button>
          </a>
        </div>
        <div className="absolute z-10 top-0 left-0 w-full h-full flex flex-row justify-between text-white items-center text-2xl hover:z-30">
          <div
            className="h-full md:hover:bg-grey-500 md:hover:bg-opacity-25 cursor-pointer p-4 flex flex-col justify-center"
            onClick={() => this.moveSlide(-1, true)}
          >
            ←
          </div>
          <div
            className="h-full md:hover:bg-grey-500 md:hover:bg-opacity-25 cursor-pointer p-4 flex flex-col justify-center"
            onClick={() => this.moveSlide(1, true)}
          >
            →
          </div>
        </div>
        <div className="absolute z-10 top-0 left-0 w-full h-auto flex flex-row justify-center text-white items-center mt-2">
          {
            data.map((_, i) => {
              return (
                <div
                  key={i}
                  className={`border-2 border-collapse border-white rounded-full w-3 h-3 ml-2 ${position === i ? "bg-white" : "border-opacity-50 cursor-pointer"}`}
                  onClick={() => position !== i && this.setPosition(i)}
                ></div>
              )
            })
          }
        </div>
      </div>
    )
  }
}

export default HomeSlideshow;
