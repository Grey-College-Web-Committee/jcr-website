import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import config from '../../config.json';
import LoadingHolder from '../common/LoadingHolder';

class MediaPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      media: []
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
    console.log(this.state.media);
  }

  getPartialUrlFromiFrameString(iframe){
    const splitbit = iframe.slice(iframe.indexOf("/tracks/")+8, iframe.indexOf("&color="));
    return splitbit;
  }

  getiFrameFromPartialUrl(partialUrl){
    return (<iframe scrolling="no" width="100%" frameborder="no" allow="autoplay" src={'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/'+partialUrl+'&color=%23990000&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true'}></iframe>)
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
        <div className="w-auto align-center bg-red-900 rounded-full my-3 py-3 px-24">
          <h2 className="font-semibold text-3xl py-3 text-white">Latest JCR Podcast</h2>
          <div className="w-full">
            {this.getiFrameFromPartialUrl(this.state.media[latestPodcastID].mediaLink)}
          </div>
          <div className="font-medium text-2xl pt-3 text-white">{this.state.media[latestPodcastID].mediaTitle}</div>
          <div className="self-center w-auto font-light pb-3 text-white">{this.state.media[latestPodcastID].mediaDescription}</div>
        </div>
      );
    }
    else { return "Nope" }
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
          <h1 className="font-semibold text-5xl pb-4">Media</h1>
          {this.state.media.length > 0 ? this.getLatestJCRPodcast() : <></>}
        </div>
      </div>
    );
  }
}

MediaPage.contextType = authContext;
export default MediaPage;
//{this.getiFrameFromPartialUrl(this.state.media[0].link)}