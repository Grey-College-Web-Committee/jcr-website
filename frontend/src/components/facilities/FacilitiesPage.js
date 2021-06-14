import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

class FacilitiesPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: []
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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
      content = await api.get("/some/path");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, content: content });
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
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Facilities</h1>
          <div className="py-2 text-left">
            <h2 className="font-semibold text-3xl">The Bar</h2>
            <p className="py-1">Grey Bar is the social hub of the college, with almost all of the events put on by the JCR including it in some way. These events can range from sporting socials to bops and formals or special events such as Informal Ball and Barfest. Barfest is an all-day, themed event in Epiphany term organised by the Bar Committee and is a celebration of bar culture worldwide. We will be boasting a great selection of guest ales, ciders, wines and cocktails alongside some fantastic entertainment. Better yet, Barfest takes place on a six nations weekend which will be live in the bar on our projector. We also have BT sport and will regularly show the biggest and best live sport on offer as well as a PS4 which can be used upon request!</p>
            <p className="py-1">Drinks are amongst the cheapest of all the college bars in Durham with arguably the best selection of draught lagers and ciders and regularly changing ales. We offer a range of bottled ciders, beers, wines, spirits and soft drinks and are always open for suggestions if you would like to see something new and exciting. The bar has and will continue to undergo developments and refurbishment to increase its popularity and better the college bar experience for all students.</p>
            <p className="py-1">Due to Covid-19, table bookings and ordering are taking place through the website. <Link to="/bar/book" className="font-semibold underline">Please click here for more information on opening times and how to book.</Link></p>
            <p className="py-1">Follow our social media pages to get regular updates about what is on in the bar!</p>
            <div className="flex flex-row my-1">
              <a href="https://www.facebook.com/GreyCollegeBar/" target="_blank" rel="noopener noreferrer" className="mr-2">
                <img
                  src="/images/socials/FindUs-FB-RGB.svg"
                  className="h-10 md:h-8 w-auto"
                  alt="Bar Facebook Page"
                />
              </a>
              <a href="https://www.instagram.com/grey_college_bar/" target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/Instagram_Glyph_Gradient_RGB.png"
                  className="h-10 md:h-8 w-auto"
                  alt="Bar Instagram Page"
                />
              </a>
            </div>
          </div>
          <div className="py-2 text-left border-t border-grey-400">
            <h2 className="font-semibold text-3xl">The Gym</h2>
            <p className="py-1">Grey has two gym rooms, one dedicated to weights equipment (see below), and the other to cardio equipment. Membership of the gym can be bought on a yearly or termly basis. For more information on the equipment and memberships, <Link to="/gym" className="font-semibold underline">please see the gym page by clicking here.</Link></p>
          </div>
          <div className="py-2 text-left border-t border-grey-400">
            <h2 className="font-semibold text-3xl">Music Facilities</h2>
            <p className="py-1">Grey has two music practice rooms in Fountain’s Hall for individuals or groups to use. There are also a variety of instruments in College, which any member of Grey can ask for permission to use, free of charge. These instruments are: violin, viola, acoustic guitar, bass guitar, electric guitar, a Cajun and several ukuleles as well as pianos and drum kits.</p>
            <p className="py-1">Music rooms can be booked via <Link to="/bookings" className="font-semibold underline">the room booking service that can be found by clicking here</Link> (you will need to sign in with your Durham University account to access this).</p>
          </div>
          <div className="py-2 text-left border-t border-grey-400">
            <h2 className="font-semibold text-3xl">The Library</h2>
            <div className="py-1">
              <h3 className="font-semibold text-xl">Borrowing and Returning Books</h3>
              <p className="py-1">The college library system is connected to the University library system and so books can be searched for online just as you would search for books in the main library catalogue at: <a href="https://library.dur.ac.uk/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">https://library.dur.ac.uk/</a></p>
              <p className="py-1">Books can be taken out using your campus card by asking the student librarian on duty.</p>
              <p className="py-1">Books are issued on a rolling 3 week loan. We operate exactly the same loan and renewal rules as the Bill Bryson library. If a book is on loan, you can recall it, using the Bill Bryson library recall system. You will receive an automatic email when the book is ready to collect.</p>
              <p className="py-1">Please return books promptly as overdue books collect fines. Return books within the requested time frame if you are asked to as someone else is waiting for it.</p>
              <p className="py-1">Books can be returned to the College Library when it is open or via the drop box in the study area when it is closed. <span className="font-semibold">Please do not return books to the Bill Bryson.</span></p>
              <p className="py-1"></p>
            </div>
            <div className="py-1">
              <h3 className="font-semibold text-xl">Book Requests</h3>
              <p className="py-1">Books can be requested by asking one of the student librarians. Alternatively, you can fill in the online form here: <a href="https://www.dur.ac.uk/grey.college/current/books/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">https://www.dur.ac.uk/grey.college/current/books/</a></p>
              <p className="py-1">Books will be purchased based on the usefulness of the book to college as a whole compared to the price. If the book is a core text for your course or on a module reading list it is high likely to be ordered however, even if it is not do still request it as it may well be ordered in for you. If you have any recommendations for the DVD, music or fiction section do send these in as well!</p>
            </div>
            <div className="py-1">
              <h3 className="font-semibold text-xl">Paid Employment</h3>
              <p className="py-1">The Library employs students to work as Library Assistants, who deal with the day to day running of the Library.</p>
              <p className="py-1">Requests for applications for student librarians will be sent out as and when positions become available so if you are interested in applying keep an eye on your emails!</p>
              <p className="py-1">No previous experience is needed as full training is given.</p>
              <p className="py-1">If you have any further questions or suggestions for the library, please don’t hesitate to contact the Student Services Manager at grey.services@durham.ac.uk</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

FacilitiesPage.contextType = authContext;

export default FacilitiesPage;
