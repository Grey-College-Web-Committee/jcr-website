import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import { AiOutlineDownload } from 'react-icons/ai';
import { IconContext } from 'react-icons';

class FinancialSupport extends React.Component {
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

  render () {
    return (
      <div className="flex flex-col">
        <div className="relative">
          <img
            src="/images/fs_banner.jpg"
            className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
            alt="Financial Support Background"
          ></img>
          <img
            src="/images/fs_banner.jpg"
            className="w-full h-auto relative z-0 block lg:hidden"
            alt="Financial Support Background"
          ></img>
          <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
            <div className="flex flex-row align-middle items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold">Financial Support</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col my-4 justify-center items-center md:w-3/5 md:mx-auto mx-2">
          <div>
            <p className="mb-2">The JCR wants to ensure that anyone who wants to get involved with college life and the common room is able to, regardless of financial barriers. We understand many of the costs of living in Durham and being at university can add significant financial pressure and can limit the opportunity for equal access for members and prospective members of the JCR. The University, College, and JCR have a variety of different financial support options, this information page aims to include as many of them as possible in one place.</p>
            <p className="mb-2">If you have any further questions about financial support, please contact the JCR President, FACSO, Opportunities{"'"} Officer, or College Student Support.</p>
          </div>
          <div className="mt-2 text-left w-full">
            <h2 className="font-semibold text-2xl mb-1">Grey JCR Hardship Policy</h2>
            <p className="mb-2">Within the JCR, we offer a Hardship Policy that any member (or prospective member) of the JCR is welcome to apply for. The Hardship Policy provides support in the form of reducing immediate upfront costs by providing the option to pay in instalments, partial waiving of fees, or total waiving of fees depending on your financial situation. The policy can be used for the JCR membership levy, purchasing tickets for events, participating in JCR sports and societies, and gym memberships.</p>
            <p className="mb-2">Any applications for the Hardship Policy are <span className="font-semibold">considered confidentially</span> by the hardship sub-committee of the JCR's Board of Trustees (more information about the trustees can be found on <span className="underline font-semibold"><Link to="/jcr/trust">the trust page by clicking here</Link></span>). To apply for this you will need to provide supporting evidence. More information about this can be found within the Hardship Policy document and the accompanying application form below this.</p>
            <p className="mb-2">For further information, please <a className="font-semibold underline" target="_blank" href="mailto:grey.treasurer@durham.ac.uk?subject=Hardship Policy" rel="noopener noreferrer">contact the FACSO by clicking here</a> who will be happy to talk to you about the Hardship Policy. If you want to submit a completed application form, please send this to the FACSO as well.</p>
            <IconContext.Provider value={{ className: "h-8 w-8" }}>
              <div className="border-2 border-red-900 p-2 flex flex-col mt-1">
                <a href="https://greyjcr.co.uk/uploads/jcr/05c112d62094728795d0f885417d8649/JCR%20Hardship20Policy" target="_blank" rel="noopener noreferrer">
                  <div className="flex flex-row items-center py-1 mb-2">
                    <AiOutlineDownload />
                    <span className="ml-2 text-lg">Hardship Policy Information Document</span>
                  </div>
                </a>
                <a href="https://www.greyjcr.co.uk/uploads/jcr/ab467da18d1b5996ba35d8d0a4cb0481/JCR%20Hardship%20Policy%20Application%20Form" target="_blank" rel="noopener noreferrer">
                  <div className="flex flex-row items-center py-1">
                    <AiOutlineDownload />
                    <span className="ml-2 text-lg">Hardship Policy Application Form</span>
                  </div>
                </a>
              </div>
            </IconContext.Provider>
          </div>
          <div className="mt-2 text-left w-full mb-1">
            <h2 className="font-semibold text-2xl">Grey College Financial Support</h2>
            <p className="mb-2">As well as the financial support provided by the JCR, the College also offers financial assistance for individuals and groups of Grey Students for cultural activities, sporting activities, intellectual development, employability development, degree-related travel opportunities, and research-based opportunities in the form of Grey College Trust Awards through donations and endowments from generous Grey College alumni.</p>
            <p className="mb-2">Applications for these are open at specific times of the year. For more information about these awards, and how to apply for them, can be found by contacting the Vice-Master of the college or the Master of the college. Grey currently has an acting Master and a temporary Vice-Master, as such the best people to contact are <a className="font-semibold underline" target="_blank" href="mailto:grey.president@durham.ac.uk?subject=Grey College Trust Awards" rel="noopener noreferrer">the JCR president by clicking here</a> or <a className="font-semibold underline" target="_blank" href="mailto:g.p.swift@durham.ac.uk?subject=Grey College Trust Awards" rel="noopener noreferrer">Dr Peter Swift (the acting Master) by clicking here.</a></p>
          </div>
          <div className="mt-2 text-left w-full mb-1">
            <h2 className="font-semibold text-2xl">Durham University Support</h2>
            <p className="mb-2">The University also has a variety of financial support (although it can be a bit difficult to find as their website is undergoing a redesign!). They have a list of scholarships that are available (click them for more information):</p>
            <ul className="list-inside list-disc my-2">
              <a className="font-semibold underline" target="_blank" href="https://www.durham.ac.uk/study/scholarships/north-east/" rel="noopener noreferrer"><li>North East Scholarship</li></a>
              <a className="font-semibold underline" target="_blank" href="https://www.durham.ac.uk/study/scholarships/undergraduate-scholarships-2022-entry/" rel="noopener noreferrer"><li>Undergraduate Scholarships</li></a>
              <a className="font-semibold underline" target="_blank" href="https://www.durham.ac.uk/study/scholarships/postgraduate-scholarships-2022-entry/" rel="noopener noreferrer"><li>Postgraduate Scholarships</li></a>
              <a className="font-semibold underline" target="_blank" href="https://www.durham.ac.uk/study/scholarships/international/" rel="noopener noreferrer"><li>International Scholarships</li></a>
            </ul>
            <p className="mb-2">For more information about the University's scholarships, <a className="font-semibold underline" target="_blank" href="mailto:scholarships.advice@durham.ac.uk?subject=Scholarship Advice" rel="noopener noreferrer">contact the University by clicking here.</a></p>
            <p className="mb-2">In addition, they have <a className="font-semibold underline" target="_blank" href="https://www.durham.ac.uk/study/scholarships/current-students/" rel="noopener noreferrer">funds for current students that can be found here.</a></p>
            <p className="mb-2">For further information on the University's financial support that is available, <a className="font-semibold underline" target="_blank" href="https://www.dur.ac.uk/student.finance/" rel="noopener noreferrer">please see their webpage by clicking here</a> or <a className="font-semibold underline" target="_blank" href="mailto:financialsupport.undergraduate@durham.ac.uk" rel="noopener noreferrer">contact the Scholarships and Student Financial Support Service at financialsupport.undergraduate@durham.ac.uk</a></p>
          </div>
        </div>
      </div>
    );
  }
}

FinancialSupport.contextType = authContext;

export default FinancialSupport;
