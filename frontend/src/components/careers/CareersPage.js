import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import config from '../../config.json';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';

class CareersPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      page: 1,
      posts: []
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

    const posts = await this.loadPage();

    if(posts === false) {
      this.setState({ loaded: false, status: 400 });
      return;
    }

    console.log(posts);

    this.setState({ loaded: true, status: 200, posts: posts.rows, count: posts.count });
  }

  loadPage = async () => {
    let contents;

    try {
      contents = await api.get(`/careers/blog/${this.state.page}`);
    } catch (error) {
      return false;
    }

    const { posts } = contents.data;

    if(posts === undefined || posts === null) {
      return false;
    }

    return posts;
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
          <h1 className="font-semibold text-5xl pb-4">Careers</h1>
          <div className="flex flex-col-reverse md:flex-row">
            <div className="w-full md:w-3/5 md:mt-0 mt-4">
              <h2 className="font-semibold text-3xl text-left pb-4">Latest Opportunities and Information</h2>
              { this.state.posts.map((post, i) => (
                <div key={i} className="border text-left">
                  <h3 className="font-semibold text-left text-2xl px-2 py-1">{post.title}</h3>
                  <p className="text-left text-sm px-2 pt-1">Last updated at {dateFormat(post.updatedAt, "dd/mm/yyyy HH:MM")}</p>
                  <div className="px-2 py-1">
                    { post.content.split("\n").map((paragraph, j) => {
                      if(paragraph.length === 0) {
                        return null;
                      }

                      return <p className="pt-1 text-justify" key={j}>{paragraph}</p>
                    }) }
                  </div>
                  <div className="border-t-2 px-2 py-1">
                    <p>Have a question about this post or opportunity? <a href={`mailto:grey.careersalumni@durham.ac.uk?subject=${post.emailSubject}`} className="underline font-semibold">Please get in touch by clicking here!</a></p>
                  </div>
                </div>
              )) }
            </div>
            <div className="w-full md:w-2/5 border md:ml-2 px-2">
              <h2 className="font-semibold text-3xl text-left pb-4">More Information</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

CareersPage.contextType = authContext;

export default CareersPage;
