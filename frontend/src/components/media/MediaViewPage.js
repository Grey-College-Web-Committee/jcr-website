import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

class MediaPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      media: [],
      selectedMediaIndex: null
    };
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
    this.getAllMedia();
    this.setState({ loaded: true, status: 200 });
  }

  getAllMedia = async () => {
    let content;

    try {
      content = await api.get("/media/all");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let { media } = content.data;

    media.sort((a, b) => {
      return -(a.lastUpdate < b.lastUpdate ? -1 : (a.lastUpdate > b.lastUpdate ? 1 : 0));
    });

    this.setState({ media });
  }

  getPartialUrlFromiFrameString(iframe){
    const splitbit = iframe.slice(iframe.indexOf("/tracks/")+8, iframe.indexOf("&color="));
    return splitbit;
  }

  getiFrameFromPartialUrl(partialUrl){
    return (<iframe className="rounded-lg w-full h-32" align="center" scrolling="no" frameBorder="no" title='podcast' src={'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/'+partialUrl+'&color=%23990000&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true'}></iframe>)
  }

  getVideoiFrameFromPartialUrl(partialUrl){
    return(<iframe src={'https://www.youtube.com/embed/'+partialUrl} className="sm:w-96 sm:h-52 w-64 h-32" frameBorder='no' allowFullScreen title='video'/>)
  }

  getLatestJCRPodcast(){
    let latestPodcastID = null;
    const len = this.state.media.length;
    for (var i = 0; i < len; i++){
      if (this.state.media[i].mediaCategory === "JCR Podcast"){
        latestPodcastID = i;
      }
    }
    if (latestPodcastID != null){
      return (
        <div className="xl:w-8/12 w-11/12 md:rounded-r-full rounded-r-lg bg-red-900 bg-opacity-90 my-3 py-3 px-5 flex float-left text-left justify-start">
          <div className="text-left w-11/12 float-left">
            <h2 className="self-center font-semibold text-3xl py-3 text-white">Latest JCR Podcast</h2>
            <h2 className="self-center font-semibold text-xl pt-3 pb-1 text-white">{this.state.media[latestPodcastID].mediaTitle}</h2>
            {this.getiFrameFromPartialUrl(this.state.media[latestPodcastID].mediaLink)}
            <p className="self-center w-auto font-light pb-3 pt-1 text-white flex-shrink">{this.state.media[latestPodcastID].mediaDescription}</p>
          </div>
        </div>
      );
    }
    else { 
      return ( 
        <div className="xl:w-8/12 w-11/12 md:rounded-r-full rounded-r-lg bg-red-900 bg-opacity-90 my-3 py-3 px-5 flex float-left text-left justify-start">
          <div className="text-left w-11/12 float-left">
            <h2 className="self-center font-semibold text-3xl py-3 text-white">JCR Podcast - Coming Soon!</h2>
            <p className="self-center w-auto font-light pb-3 pt-1 text-white flex-shrink">At least, I hope it's coming soon as that's the only reason I created this page...</p>
          </div>
        </div>
      );
    }
  }

  getLatestGMPodcast(){
    let latestPodcastID = null;
    const len = this.state.media.length;
    for (var i = 0; i < len; i++){
      if (this.state.media[i].mediaCategory === "Grey Matter Podcast"){
        latestPodcastID = i;
      }
    }
    if (latestPodcastID != null){
      return (
        <div className="xl:w-8/12 w-11/12 md:rounded-l-full rounded-l-lg bg-gray-400 my-3 py-3 px-5 flex float-right text-right justify-end">
          <div className="text-right w-11/12 float-right">
            <h2 className="font-semibold text-3xl py-3 text-gray-900">Latest Grey Matter Podcast</h2>
            <h2 className="font-semibold text-xl pt-3 pb-1 text-gray-900">{this.state.media[latestPodcastID].mediaTitle}</h2>
            {this.getiFrameFromPartialUrl(this.state.media[latestPodcastID].mediaLink)}
            <p className="w-auto font-light pb-3 pt-1 text-gray-900 flex-shrink">{this.state.media[latestPodcastID].mediaDescription}</p>
          </div>
        </div>
      );
    }
    else { 
      return ( 
        <div className="xl:w-8/12 w-11/12 md:rounded-l-full rounded-l-lg bg-gray-400 my-3 py-3 px-5 flex float-right text-right justify-end">
          <div className="text-right w-11/12 float-right">
            <h2 className="font-semibold text-3xl py-3 text-gray-900">Grey Matter Podcast - Coming Soon!</h2>
            <p className="w-auto font-light pb-3 pt-1 text-gray-900 flex-shrink">Keep your eyes peeled and your ears ready to be blessed by the sweet sound of satirical sarcasm. </p>
          </div>
        </div>
      );
    }
  }

  getLatestVideo(){
    let latestVideoID = null;
    const len = this.state.media.length;
    for (var i = 0; i < len; i++){
      if (this.state.media[i].mediaType === "Video"){
        latestVideoID = i;
      }
    }
    if (latestVideoID != null){
      return (
        <div className="md:w-11/12 w-full lg:rounded-full rounded-lg bg-red-900 bg-opacity-90 my-4 py-3 flex text-center justify-center">
          <div className="items-center content-center justify-center text-center flex flex-row md:flex-nowrap flex-wrap px-3 lg:w-10/12 w-full">
            <div className="w-auto text-left float-left pr-3">
              <h2 className="font-semibold text-3xl py-3 text-white">Latest JCR Video</h2>
              <h2 className="font-semibold text-xl pt-3 pb-1 text-white">{this.state.media[latestVideoID].mediaTitle}</h2>
              <p className="w-auto font-light pb-3 pt-1 text-white flex-shrink">{this.state.media[latestVideoID].mediaDescription}</p>
            </div>
            <div className="w-auto">
              {this.getVideoiFrameFromPartialUrl(this.state.media[latestVideoID].mediaLink)}
            </div>
          </div>
        </div>
      );
    }
    else { return <></> }
  }

  showSelectedItem(){
    if (this.state.selectedMediaIndex === null){ return <></> }
    const media = this.state.media[this.state.selectedMediaIndex]
    if(media.mediaType === "Video"){
      return (
        <div className="md:w-11/12 w-full lg:rounded-full rounded-lg bg-red-900 bg-opacity-90 my-4 py-3 flex text-center justify-center">
          <div className="items-center content-center justify-center text-center flex flex-row md:flex-nowrap flex-wrap px-3 lg:w-10/12 w-full">
            <div className="w-auto text-left float-left pr-3">
              <h2 className="font-semibold text-3xl py-3 text-white">Selected Video</h2>
              <h2 className="font-semibold text-xl pt-3 pb-1 text-white">{media.mediaTitle}</h2>
              <p className="w-auto font-light pb-3 pt-1 text-white flex-shrink">{media.mediaDescription}</p>
            </div>
            <div className="w-auto">
              {this.getVideoiFrameFromPartialUrl(media.mediaLink)}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="md:w-11/12 w-full lg:rounded-full rounded-lg bg-red-900 bg-opacity-90 my-4 py-3 flex text-center justify-center">
        <div className="text-center w-10/12">
            <h2 className="font-semibold text-3xl py-3 text-white">Selected Podcast</h2>
            <h2 className="font-semibold text-xl pt-3 pb-1 text-white">{media.mediaTitle}</h2>
            {this.getiFrameFromPartialUrl(media.mediaLink)}
            <p className="w-auto font-light pb-3 pt-1 text-white flex-shrink">{media.mediaDescription}</p>
          </div>
      </div>
    );
  }

  selectItem(id) {
    if (this.state.selectedMediaIndex === id){
      this.setState({ selectedMediaIndex: null });
    }
    else{
      this.setState({ selectedMediaIndex: id });
    }
  }

  getMediaList(){
    return(
      <div>
        <div className="flex flex-col justify-center text-center items-center w-full">
          <h2 className="font-semibold text-4xl pt-3">All Media</h2>
          <p className="pb-4 font-light text-l">And there's more! Why not click an item below to enjoy more from our media selection?</p>
          <div className="w-full flex flex-row flex-wrap justify-center items-end">
            {this.state.media.map((media, i) => (
              <button
                onClick={() => this.selectItem(i)}
                className="md:w-4/12 w-11/12 h-full flex-auto mb-3 px-1 pb-1 pt-auto rounded-lg hover:bg-red-900 hover:text-white"
              >
                <div className="p-2 pt-auto border-b border-red-900 flex flex-col justify-evenly items-center">
                  <h2 className="w-auto font-semibold text-3xl">{media.mediaTitle}</h2>
                  <p className="w-auto font-light text-xl">{media.mediaCategory}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
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
      <div className="flex flex-col justify-center w-full">
        <div className="mx-0 text-center pt-4">
          <h1 className="font-semibold text-5xl pb-4">Media</h1>
          {this.state.media.length > 0 ? this.getLatestJCRPodcast() : <></>}
          {this.state.media.length > 0 ? this.getLatestGMPodcast() : <></>}
        </div>
        <div className="text-center flex justify-center w-full px-4">
          {this.state.media.length > 0 ? this.getLatestVideo() : <></>}
        </div>
        <div className="text-center flex flex-col justify-center items-center w-full px-4">
          {this.state.media.length > 0 ? this.getMediaList() : <p>No Media to Show Yet!</p>}
          {this.showSelectedItem()}
        </div>
      </div>
    );
  }
}

MediaPage.contextType = authContext;
//{this.getiFrameFromPartialUrl(this.state.media[0].link)}
export default MediaPage;
