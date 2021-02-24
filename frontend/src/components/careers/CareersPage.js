import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
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
      page: 1,
      posts: [],
      count: 0,
      postLoadState: "loading"
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

    // Default is to load the first page
    const posts = await this.loadPage(1);

    // No posts, invalid page
    if(posts === false) {
      this.setState({ loaded: false, status: 400 });
      return;
    }

    this.setState({ loaded: true, status: 200, posts: posts.rows, count: posts.count, maxPage: Math.ceil(posts.count / 5), postLoadState: "loaded" });
  }

  loadPage = async (page) => {
    let contents;

    // Gets the data from the server based on the page
    try {
      contents = await api.get(`/careers/blog/${page}`);
    } catch (error) {
      return false;
    }

    const { posts } = contents.data;

    if(posts === undefined || posts === null) {
      return false;
    }

    return posts;
  }

  changePage = async (direction) => {
    // Changes the page and reloads the data
    // Also verifies that the page number is valid
    const newPage = this.state.page + direction;

    if(newPage <= 0 || newPage > this.state.maxPage) {
      return;
    }

    this.setState({ postLoadState: "loading", disabled: true });

    let posts;

    try {
      posts = await this.loadPage(newPage);
    } catch (error) {
      this.setState({ postLoadState: "error" });
      return;
    }

    if(posts === false) {
      this.setState({ postLoadState: "error" });
      return;
    }

    // Update the data and set the maximum page count
    this.setState({ page: newPage, posts: posts.rows, count: posts.count, maxPage: Math.ceil(posts.count / 5), disabled: false, postLoadState: "loaded" });
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

    // With the pages we need to wait for the content to be downloaded
    let postDiv = (
      <div>
        <LoadingHolder />
      </div>
    );

    if(this.state.postLoadState === "loaded") {
      postDiv = (
        <div>
          <div className="pb-2 text-left">
            <button
              onClick={() => this.changePage(-1)}
              className="px-3 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled || this.state.page === 1}
            >←</button>
            <span className="px-2 font-semibold">Page {this.state.page} / {this.state.maxPage}</span>
            <button
              onClick={() => this.changePage(1)}
              className="px-3 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled || this.state.page === this.state.maxPage}
            >→</button>
          </div>
          { this.state.posts.map((post, i) => (
            <div key={i} className="border text-left mb-4">
              <div className="flex flex-row justify-between">
                <h3 className="font-semibold text-left text-2xl px-2 py-1">{post.title}</h3>
                { this.context.permissions.includes("careers.manage") ?
                  <Link to={`/careers/edit/${post.id}`} className="m-1">
                    <button
                      className="px-2 py-1 rounded bg-blue-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    >Edit Post</button>
                  </Link>
                  : null }
              </div>
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
          <div className="pb-2 text-left">
            <button
              onClick={() => this.changePage(-1)}
              className="px-3 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled || this.state.page === 1}
            >←</button>
            <span className="px-2 font-semibold">Page {this.state.page} / {this.state.maxPage}</span>
            <button
              onClick={() => this.changePage(1)}
              className="px-3 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.state.disabled || this.state.page === this.state.maxPage}
            >→</button>
          </div>
        </div>
      );
    } else if (this.state.postLoadState === "error") {
      // Usually occurs if they try and load an invalid page number
      postDiv = (
        <div className="pb-2 text-left">
          <p>There was an error loading the posts. Please try again later.</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <div className="flex flex-col-reverse md:flex-row">
            <div className="w-full md:w-3/5 md:mt-0 mt-4">
              <h2 className="font-semibold text-3xl text-left pb-2">Latest Opportunities and Information</h2>
              { postDiv }
            </div>
            <div className="w-full md:w-2/5 md:ml-2 md:px-2 text-justify">
              <h2 className="font-semibold text-3xl text-left pb-2">Welcome to the Career and Opportunities Information Board!</h2>
              <p className="py-1">This page is where information for upcoming careers events and other opportunities will be posted, whether this be our fortnightly Career Workshop, University-run talks, or job and internship postings.</p>
              <p className="py-1">For more information, or any queries, please don’t hesitate to email <a className="font-semibold underline" href="mailto:grey.careersalumni@durham.ac.uk" rel="noopener noreferrer" target="_blank">grey.careersalumni@durham.ac.uk</a></p>
              <p className="py-1">This year we’ve been working hard to form stronger ties with our Grey alumni, all of whom are very enthusiastic about helping current JCR members on their way to their dream job.</p>
              <p className="py-1">Don’t forget about the fantastic Career Angels service we have at our fingertips! It’s as easy as sending an email before gaining insights and advice on pursuing your career path. <a className="font-semibold underline" href="https://www.greyassociation.co.uk/angels" rel="noopener noreferrer" target="_blank">https://www.greyassociation.co.uk/angels</a>. If you’re looking for more general advice, just send your query to <a className="font-semibold underline" href="mailto:grey.careersalumni@durham.ac.uk" rel="noopener noreferrer" target="_blank">grey.careersalumni@durham.ac.uk</a> and we’ll try and match you to someone best suited to answering your question.</p>
            <a href="https://www.greyassociation.co.uk/angels" rel="noopener noreferrer" target="_blank">
                <button
                  className="my-1 px-4 py-1 rounded bg-green-900 text-white text-xl w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Careers Angels</button>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

CareersPage.contextType = authContext;

export default CareersPage;
