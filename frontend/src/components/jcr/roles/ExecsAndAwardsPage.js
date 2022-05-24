import React from 'react';
import { Link, Redirect } from 'react-router-dom';

const information = {
  "2022/23": {
    year: "2022/23",
    exec: [
      {
        role: "President",
        name: "Izzy Cowell"
      },
      {
        role: "FACSO",
        name: "Jonny Tiplady"
      },
      {
        role: "Vice President",
        name: "Asa Schuman"
      },
      {
        role: "Chair",
        name: "Becca Whiting"
      },
      {
        role: "MCR President",
        name: "To Be Elected"
      },
      {
        role: "Senior Welfare Officers",
        name: "Scarlett Spillane and Amy Cottrill"
      },
      {
        role: "Website Editor",
        name: "Finlay Boyle"
      },
      {
        role: "Technical Manager",
        name: "Ben Hacker"
      },
      {
        role: "Sports and Societies Officer",
        name: "Katy Brewster"
      },
      {
        role: "Communications Officer",
        name: "Georgie Gadian",
      },
      {
        role: "Events Manager",
        name: "Jess Donaldson"
      },
      {
        role: "Secretary",
        name: "Grace Harvey"
      },
      {
        role: "Bar Manager",
        name: "Jacob Cowley"
      },
      {
        role: "Representatives Officer",
        name: "Cerys Griffiths"
      },
      {
        role: "Students' Union Officer",
        name: "To Be Elected"
      },
    ],
    awards: {
      pras: ["Awarded at Phoenix Ball 2023"],
      hlms: ["Awarded at Phoenix Ball 2023"],
      howick: "Awarded at Phoenix Ball 2023.",
      leadership: "Awarded at PGN 2023.",
      unsung: "Awarded at PGN 2023."
    }
  },
  "2021/22": {
    year: "2021/22",
    exec: [
      {
        role: "President",
        name: "Hannah Richards"
      },
      {
        role: "FACSO",
        name: "Sophie Grantham"
      },
      {
        role: "Vice President",
        name: "James Marshall"
      },
      {
        role: "Chair",
        name: "Becca Whiting"
      },
      {
        role: "MCR President",
        name: "Laurence Wayne"
      },
      {
        role: "Senior Welfare Officers",
        name: "Fiona Tuite and Lucy Docherty"
      },
      {
        role: "Website Editor",
        name: "Finlay Boyle"
      },
      {
        role: "Technical Manager",
        name: "Ben Hacker"
      },
      {
        role: "Sports and Societies Officer",
        name: "James O'Neill"
      },
      {
        role: "Communications Officer",
        name: "Not Filled"
      },
      {
        role: "Events Manager",
        name: "Izzy Cowell"
      },
      {
        role: "Secretary",
        name: "James Lee"
      },
      {
        role: "Bar Managers",
        name: "Will Hicks and Caitlin Tan"
      },
      {
        role: "Representatives Officer",
        name: "Isobel Warwick"
      },
      {
        role: "Students' Union Officer",
        name: "Monique Devaux"
      },
    ],
    awards: {
      pras: ["Awarded at Phoenix Ball 2022"],
      hlms: ["Awarded at Phoenix Ball 2022"],
      howick: "Awarded at Phoenix Ball 2022.",
      leadership: "James Marshall",
      unsung: "Finlay Boyle and Ben Hacker"
    },
    sas: {
      awards: {
        sport: "Rugby",
        society: "Bad Film Society",
        committee: "Representatives Committee",
        team: "Men's D's Football",
        special: "Catering Team"
      },
      committees: [
        {
          name: "Art Committee",
          colours: ["Liv Sharpley"],
          commendations: []
        },
        {
          name: "Bar Committee",
          colours: ["Will Hicks", "Caitlin Tan", "Ewan Copsey", "George Lawless", "Vic Amberg", "Ben Gourley"],
          commendations: ["Jacob Cowley", "Joe Anderson", "Dany Punnoose", "Stan Bradley"]
        },
        {
          name: "Charities Committee",
          colours: ["James MacLennan"],
          commendations: []
        },
        {
          name: "Charity Fashion Show",
          colours: ["Bella Arthur", "Ella Mabon", "Amy Cottrill"],
          commendations: ["Jonny Tiplady", "Lucy Docherty", "Izzy Cowell"]
        },
        {
          name: "Environment and Ethics",
          colours: ["Harriet Kirsopp"],
          commendations: ["Liv Sharpley", "Isobel Warwick"]
        },
        {
          name: "Events Committee",
          colours: ["Izzy Cowell"],
          commendations: ["Beth Sugden", "Sophia Massam", "Faith Thopmson", "Evie Boyer"]
        },
        {
          name: "Finance Committee",
          colours: ["Hannah Harrison"],
          commendations: ["Henry Stone"]
        },
        {
          name: "Formals Committee",
          colours: ["James Marshall"],
          commendations: ["Alina Lascu"]
        },
        {
          name: "JCR Executive",
          colours: ["James Marshall", "Becca Whiting", "James Lee", "Xander Wilkinson"],
          commendations: []
        },
        {
          name: "JCR Officers",
          colours: ["Patrick Chorley"],
          commendations: []
        },
        {
          name: "MCR",
          colours: ["Laurence Wayne", "Kirsty Buchan", "Elliott Myers", "Jennifer Talbot"],
          commendations: ["Victor So", "Issy Lee", "Megan Law", "Liv Bennison", "Joe Hall"]
        },
        {
          name: "Music",
          colours: ["Charlie Moore"],
          commendations: ["Emily Vaughan-Williams", "Ben Hacker"]
        },
        {
          name: "Representatives",
          colours: ["Isobel Warwick", "Georgia Mckie", "Noé Amiel", "Thea Stedman Jones", "James Gascoyne", "Alina Lascu"],
          commendations: ["Joe Studholme", "Asa Schuman"]
        },
        {
          name: "Toastie Bar",
          colours: ["Eve Quinn", "Ellen Knight", "Ben French"],
          commendations: ["Nicola Gittins", "Bryan Huitson", "Sophie Grantham"]
        },
        {
          name: "Technical Services",
          colours: ["Ben Hacker", "Taylor Yang"],
          commendations: ["James Gascoyne", "Joe Haynes"]
        },
        {
          name: "Website Committee",
          colours: ["Finlay Boyle"],
          commendations: ["Sohini Khan"]
        },
        {
          name: "Welfare",
          colours: ["Fiona Tuite", "Lucy Docherty", "Amy Cottrill", "Hannah Gordon", "Joe Dandy", "Scarlett Spillane", "Emilie Tenbroek", "Emily Vaughan-Williams", "Johnny Mead", "Will Harvey"],
          commendations: []
        },
      ],
      sports: [
        {
          name: "Badminton",
          colours: ["Rishi Siddani", "Jen Talbot"],
          commendations: ["Tom Clapp", "Joe Tobyn"]
        },
        {
          name: "Basketball",
          colours: ["Joe Falconer", "Aleksandra Higson"],
          commendations: ["Joel Miller", "Anna Chorlton"]
        },
        {
          name: "Boat Club",
          colours: ["Patrick Chorley", "Liv Sharpley", "Suki West", "Ed Bowman", "Caroline de Saint-Seine", "Dea Begaj"],
          commendations: ["Isobel Warwick", "Antanas Weston", "Terence Ho", "Ellen Knight", "Nic Friend", "Eleanor Benson", "Archie Baker", "Ellie Wild", "Grace Harvey", "Gemma Parker", "Dan Warton"]
        },
        {
          name: "Cheer",
          colours: ["Tally Daley", "Beryl Chau", "Qishin Wan"],
          commendations: ["Emily Fyfe", "Eleanor Royle", "Chloe Paulding", "Judith Holmes"]
        },
        {
          name: "Climbing",
          colours: ["Michaela Serieux"],
          commendations: ["Aleksandra Higson", "Caroline de Saint-Seine", "Ben Brereton"]
        },
        {
          name: "Cricket",
          colours: ["Ewan Copsey", "Josh Friend"],
          commendations: ["Matt Arrowsmith", "Nick Stark"]
        },
        {
          name: "Men's Football",
          colours: ["Ethan Whiting", "Will Hicks", "Alex Zimaras", "Will Roberts", "Noah Callow", "Ewan Copsey"],
          commendations: ["Tom Steer", "Matthew Brunton", "Jack Hainey", "Jacob Catterall"]
        },
        {
          name: "Women’s Football",
          colours: ["Ellie Gibb", "Emily Gordon"],
          commendations: ["Katie Barlow", "Johanna Järvi"]
        },
        {
          name: "Hockey",
          colours: ["Matthew Abrahams", "Katy Brewster", "Xander Wilkinson", "Eddie Farrell", "Alice Taylor"],
          commendations: ["Gabriel Lane", "Inigo Fox-Crockett", "Lara Eastaugh", "Joe Studholme", "Nick Thornton", "Tom Thornycroft"]
        },
        {
          name: "Mixed Lacrosse",
          colours: ["Charles Noble", "Laurence Wayne", "Emily Turner", "Connor Copeland", "Emma King"],
          commendations: ["Alex Ashman", "Mia Thompson", "Emily Harrison", "Harry Manley", "Jack Gamble"]
        },
        {
          name: "Netball",
          colours: ["Issy Ronan", "Naomi Pierce", "Hannah Mules"],
          commendations: ["Lauren Pears", "Bella Arthur", "Martha Witt", "Jess Rofe"]
        },
        {
          name: "Pool",
          colours: ["Joe McCallion", "Charlie Moore", "Nic Friend", "Lucas Esson", "Joe Tobyn"],
          commendations: ["John Sommerville", "Lily Whear", "William Craig"]
        },
        {
          name: "Men’s Rugby",
          colours: ["George Lawless", "Edward Kellett", "Luke Bagnall", "Dany Punnoose", "Sam Smith", "Jacob Cowley"],
          commendations: ["Dan Towler", "Ben Gourley", "John Sommerville"]
        },
        {
          name: "Women’s Rugby",
          colours: ["Brittney Slavin", "Abbie Jones"],
          commendations: ["Laura Byrnes"]
        },
        {
          name: "Squash",
          colours: ["Joe Piekos", "Ollie Huang"],
          commendations: ["Jesse Crampton", "Marie Spatz"]
        },
        {
          name: "Tennis",
          colours: ["Rob Butler", "Edwin Cattermole"],
          commendations: ["Harriet Robson"]
        },
        {
          name: "Ultimate Frisbee",
          colours: ["Johnny Mead", "Abi West"],
          commendations: ["Nick Starck", "Anith Sathananthan", "Lois Flower"]
        },
        {
          name: "Volleyball",
          colours: ["Dan Champion", "Guilherme Cunha"],
          commendations: []
        }
      ],
      societies: [
        {
          name: "Bad Film",
          colours: ["Asa Schuman", "Scarlett Spillane"],
          commendations: ["Eve Quinn", "Georgia Mckie"]
        },
        {
          name: "Choir",
          colours: ["Rebecca Banks", "Lillyella Stevens", "Andrew Li", "Ben Hacker"],
          commendations: ["Emily Jeffries", "Vijaylakshmi Nath", "Matthew Taylor", "Emily Keogh"]
        },
        {
          name: "Darts",
          colours: ["John Sommerville", "Ewan Copsey", "Joseph Falconer"],
          commendations: ["Charlie Moore", "Nick Stark"]
        },
        {
          name: "Walking",
          colours: ["Dan Du Val", "Sam James"],
          commendations: []
        },
        {
          name: "Yoga",
          colours: ["Helena Lewis"],
          commendations: []
        }
      ]
    }
  },
  "2020/21": {
    year: "2020/21",
    exec: [
      {
        role: "President",
        name: "Sam Dornan"
      },
      {
        role: "FACSO",
        name: "William Morrice"
      },
      {
        role: "Vice President",
        name: "Karan Patel"
      },
      {
        role: "Chair",
        name: "Xander Wilkinson"
      },
      {
        role: "MCR President",
        name: "Nathan Hall"
      },
      {
        role: "Senior Welfare Officers",
        name: "Hannah Richards and Luke Hopkins"
      },
      {
        role: "Website Editor",
        name: "Amy Hudspith"
      },
      {
        role: "Technical Manager",
        name: "Ben Hacker"
      },
      {
        role: "Sports and Societies Officer",
        name: "Giles Barron"
      },
      {
        role: "Communications Officer",
        name: "Ellen Knight"
      },
      {
        role: "Events Manager",
        name: "Ellie Reid"
      },
      {
        role: "Secretary",
        name: "James Lee"
      },
      {
        role: "Bar Manager",
        name: "Andy McDonald"
      },
      {
        role: "Representatives Officer",
        name: "Theo Burman"
      },
      {
        role: "Students' Union Officer",
        name: "Kathryn Ellison"
      },
    ],
    awards: {
      pras: ["Kathryn Ellison", "Megan Stuart", "Sam Graham", "Ned Vessey", "Josh Friend", "Jacob Bradbury", "Finlay Boyle"],
      hlms: ["Luke Hopkins", "Andrew McDonald", "Amy Allison", "Luke Wilson", "Giles Barron", "Emily Price", "Rosie Scott", "Lottie Price", "Ellen Knight", "Will Morrice", "Sam Dornan"],
      howick: "Karan Patel",
      unsung: null,
      leadership: null
    },
    sports: null,
    socs: null
  }
}

class ExecsAndAwardsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedYear: "2021/22"
    }
  }

  renderYear = (selected) => {
    const { year, exec, awards, sas } = information[selected];

    let allClubs = sas ? sas.sports.concat(sas.societies).concat(sas.committees) : null;

    if(allClubs) {
      allClubs.sort((a, b) => {
        return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0)
      });
    }

    return (
      <div className="text-left">
        <h2 className="font-semibold text-4xl mb-1">{year}</h2>
        <div className="mb-1">
          <h3 className="font-semibold text-3xl mb-1">JCR Executive Committee</h3>
          <ul>
            {
              exec.map((role, j) => (
                <li key={j}>
                  <span className="font-medium">{role.role}</span>: {role.name}
                </li>
              ))
            }
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-3xl mb-1">Awards</h3>
          <p>
            <span className="font-medium">Howick Plate: </span>
            { awards.howick }
          </p>
          { awards.leadership ? (
            <p>
              <span className="font-medium">Excellence in Leadership: </span>
              { awards.leadership }
            </p>
          ) : null }
          { awards.unsung ? (
            <p>
              <span className="font-medium">Unsung Hero: </span>
              { awards.unsung }
            </p>
          ) : null }
          <p>
            <span className="font-medium">Honorary Life Memberships: </span>
            {
              awards.hlms.map((person, j) => (
                <span key={j}>{j === 0 ? "" : ", "}{person}</span>
              ))
            }
            .
          </p>
          <p>
            <span className="font-medium">Presidential Recognition Awards: </span>
            {
              awards.pras.map((person, j) => (
                <span key={j}>{j === 0 ? "" : ", "}{person}</span>
              ))
            }
            .
          </p>
        </div>
        {
          sas ? (
            <div className="mt-1">
              <h3 className="font-semibold text-3xl mb-1">Sports, Societies, and Committees</h3>
              <div>
                <p>
                  <span className="font-medium">Sport of the Year: </span>
                  { sas.awards.sport }
                </p>
                <p>
                  <span className="font-medium">Society of the Year: </span>
                  { sas.awards.society }
                </p>
                <p>
                  <span className="font-medium">Committee of the Year: </span>
                  { sas.awards.committee }
                </p>
                <p>
                  <span className="font-medium">Team of the Year: </span>
                  { sas.awards.team }
                </p>
                { sas.awards.special ? (
                  <p>
                    <span className="font-medium">Special Recognition Award: </span>
                    { sas.awards.special }
                  </p>
                ) : null }
              </div>
              <div className="mt-1">
                <h4 className="font-semibold text-2xl mb-1">Colours and Commendations</h4>
                {
                  allClubs.map((club, i) => (
                    <div className="mb-1" key={i}>
                      <h5 className="font-semibold text-lg">{club.name}</h5>
                      <p>
                        <span className="underline">Colours:</span>
                        <span> </span>
                        {
                          club.colours.map((person, j) => (
                            <span key={j}>{j === 0 ? "" : ", "}{person}</span>
                          ))
                        }
                        .
                      </p>
                      { club.commendations && club.commendations.length !== 0 ? (
                        <p>
                          <span className="underline">Commendations:</span>
                          <span> </span>
                          {
                            club.commendations.map((person, j) => (
                              <span key={j}>{j === 0 ? "" : ", "}{person}</span>
                            ))
                          }
                          .
                        </p>
                      ) : null }
                    </div>
                  ))
                }
              </div>
            </div>
          ) : null
        }
      </div>
    )
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), disabled: true }, this.loadCommittee);
  }

  render () {
    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Execs and Awards</h1>
          <div className="text-left">
            <p className="text-left pb-1">This page lists all JCR Executive Committees and JCR award recipients from 2020/21 onwards. Generally those listed will have held their position from the end of Epiphany term for a year but the terms of office for some positions do differ slightly and their terms may overlap through multiple executive committees.</p>
            <p className="text-left">Colours and commendations are presented at the President's Guest Night annually and are given in recognition of significant contributions to a specific sport, society, or committee within the JCR. At the end of the year, at Phoenix Ball, Presidential Recognition Awards are given to individuals who have made a significant contribution to life at Grey, and they can be awarded to any year group. Honorary Life Memberships go to those who have made an outstanding contribution to Grey life during their time here, these can only be given out to finalists. The final and most prestigious award, the Howick Plate, goes to the one individual graduating that has really given the most to their time at Grey and has made an outstanding contribution.</p>
          </div>
          <div className="flex flex-row items-center text-2xl my-4 font-semibold">
            <span>View Year:</span>
            <select
              value={this.state.selectedYear}
              onChange={this.onInputChange}
              name="selectedYear"
              className="my-1 md:my-0 md:ml-2 w-auto border border-gray-400 disabled:opacity-50"
            >
              {
                Object.keys(information).map((year, i) => (
                  <option key={i} value={year}>{year}</option>
                ))
              }
            </select>
          </div>
          <div className="flex flex-col border p-2">
            {
              this.renderYear(this.state.selectedYear)
            }
          </div>
        </div>
      </div>
    );
  }
}

export default ExecsAndAwardsPage;
