import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

class JCRTrustPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
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

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">JCR Trust</h1>
          <div className="text-left pb-2">
            <p className="py-1">Every common room in Durham (JCR/MCR) has two options of how to run themselves, as: a Durham Student Organisation or an Independent Charity. Durham Student Organisations (DSO) are direct subsidiaries of the University, with the University in control and responsible for the finances and policies of the JCR. Independent charities have the freedom and full control over what direction the common room takes for its legal and financial operations.</p>
            <p className="py-1">Grey College JCR is an independent charity trust governed by our own board of trustees. The trustees are similar to a board of governors at a school or the directors of a company. Each trustee takes the on the legal responsibility for the operations of the JCR. The trustee board acts in the best interests for the JCR, following its charitable aims & facilitating the members of the JCR.</p>
          </div>
          {/* <div className="text-left pb-2">
            <h2 className="text-2xl font-semibold">External Trustees</h2>
          </div> */}
          <div className="text-left pb-2">
            <h2 className="text-2xl font-semibold">Alumni Trustees</h2>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Kimmie Fearnside</h3>
              <p className="py-1">Kimmie joined the JCR Trust as an alumni trustee in November 2018. She attended Grey College from 2008-2011, graduating with an honours degree in Law. While at Grey, Kimmie played for the Hockey Club, and within the University held the role as President of the English Law Students Association in her final year, and was otherwise actively involved with various pro bono legal networks.</p>
              <p className="py-1">Following graduation, Kimmie pursued post-graduate studies in Law at Cambridge University, and is now a practicing as a dual qualified English/New York lawyer in London specialising in high value commercial litigation and international arbitration disputes. She started her career at international magic circle law firm Linklaters LLP, where she trained and practiced for five years before moving to a boutique litigation firm, Boies Schiller Flexner (UK) LLP, in their London office. Kimmie grew up in Hong Kong and visits regularly, and calls both Hong Kong and London her home.</p>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Geoffrey Simpson</h3>
              <p className="py-1">Geoff has been a trustee of the Grey JCR Trust since July 2016.</p>
              <p className="py-1">He was educated at Hinckley Grammar School, followed by Grey College from 1969 graduating in 1972 with a BA Honours degree in Geography and adding an MBA degree from Loughborough University in 1989.</p>
              <p className="py-1">Whilst at Grey Geoff was a member of the 70/71 University RFC 2nd XV UAU winning side and the College XV in 69/70 and 71/72 seasons. He captained the Grey RFC in his final year and was awarded “college colours”. A half palatinate was awarded the previous year.</p>
              <p className="py-1">Following graduation, Geoff joined Coopers & Lybrand (now PWC) qualifying as a Chartered Accountant in 1976. Leaving Coopers in 1978 Geoff eventually spent 28 years with “Chubb Security” before retiring in 2013. His responsibilities included financial reporting, budgeting, internal controls and all other accounting and reporting requirements involved in being part of the US conglomerate, United Technologies Corporation.</p>
              <p className="py-1">Since 1978 Geoff and his family have lived in Nottingham but he remains a firm supporter of Leicester Tigers.</p>
              <p className="py-1">Outside of work Geoff has served as the Treasurer of both a Scout Group and later his Parochial Church Council.</p>
              <p className="py-1">As well as his involvement with the Grey JCR Trust Geoff is a part time volunteer at a local Oxfam shop, a member of his local Singing for Fun choir and is an active member of an informal lunch group of Grey and Hatfield contemporaries.</p>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">David Williams (Chair)</h3>
              <p className="py-1">David joined the JCR trust in November 2018</p>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Michael Cannon</h3>
              <p className="py-1">Michael was a former member of Grey College</p>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Steve Yarwood</h3>
              <p className="py-1">Steve was a former member of Grey College</p>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Chris Norman</h3>
              <p className="py-1">Chris was a former member of Grey College</p>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Linda Leaney</h3>
              <p className="py-1">Linda was a former member of Grey College</p>
            </div>
          </div>
          <div className="text-left pb-2">
            <h2 className="text-2xl font-semibold">Internal Trustees</h2>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Isabella Cowell - JCR President</h3>
              <p className="py-1">The JCR President acts as the chief executive officer (CEO) of the JCR overseeing its day-to-day operations. The President also:</p>
              <ul className="list-inside list-disc p-1">
                <li>Acts as a point of contact on all matters affecting the interests of the JCR</li>
                <li>Liaises between the JCR, MCR and SCR</li>
                <li>Represents the JCR to the College Officers</li>
                <li>Undertakes duties that do not fall within the remit of any member of the Executive Committee</li>
                <li>And much more!</li>
              </ul>
              <p className="py-1"></p>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Jonny Tiplady - FACSO</h3>
              <p className="py-1">The Finance & Commercial Services Officer (FACSO) acts as the chief financial officer (CFO) of the JCR. The FACSO also:</p>
              <ul className="list-inside list-disc p-1">
                <li>Runs the day-to-day finances of the JCR</li>
                <li>Oversees the services which the JCR provides</li>
                <li>Internally audit’s the JCR accounts</li>
                <li>Writes and approves budgets for all JCR events of income</li>
                <li>Writes/Oversees JCR Annual Budget</li>
                <li>And much more!</li>
              </ul>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Asa Schuman - Vice President</h3>
              <p className="py-1">The Vice President is the most senior student in the JCR, and their main role is to deputise the president. As well as sitting on the trustee board, the vice president also has joint responsibility for organising freshers’ week with the Senior Frep. The Vice President also has responsibility of organising the college formals which JCR members attend.</p>
            </div>
            <div className="py-1">
              <h3 className="text-xl font-semibold">Sebastian Wade - Student Trustee</h3>
              <p className="py-1">The student trustee is elected at the first meeting of the Michaelmas term in October. The main role of the student trustee is to provide student representation to the trustee board on the current issues facing the JCR. Other responsibilities the student trustee has are:</p>
              <ul className="list-inside list-disc p-1">
                <li>Managing the JCR risk register</li>
                <li>Assisting with common room framework referenda</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

JCRTrustPage.contextType = authContext;

export default JCRTrustPage;
