import React from 'react'
import PropTypes from 'prop-types'

class SportsAndSocsItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      revealed: false
    }
  }

  render () {
    const { revealed } = this.state;
    const { name, description, email, facebook, instagram, discord, type } = this.props;
    const maxChars = 180;
    const hasShowMore = description.length >= maxChars;

    return (
      <div className="border-gray-400 border text-left p-2 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="text-sm">{type}</p>
          <div className="py-1">
            {
              revealed ? (
                <p>{description}</p>
              ) : (
                <React.Fragment>
                  <p>{description.substring(0, maxChars)}
                    {
                      hasShowMore ? (
                        <React.Fragment>
                          ... <span className="font-semibold underline cursor-pointer" onClick={() => this.setState({ revealed: true })}>show more...</span>
                        </React.Fragment>
                      ) : null
                    }
                  </p>
                </React.Fragment>
              )
            }
          </div>
        </div>
        <div className="border-t border-gray-400 pt-2 flex flex-row justify-end">
          {
            email === undefined || email === null || email.length === 0 ? null : (
              <a className="ml-2" href={`mailto:${email}?subject=${name} - Info`} target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/email.png"
                  className="w-auto h-8"
                  alt="Email"
                />
              </a>
            )
          }
          {
            facebook === null || facebook.length === 0 ? null : (
              <a className="ml-2" href={facebook} target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/f_logo_RGB-Blue_100.png"
                  className="w-auto h-8"
                  alt="Facebook"
                />
              </a>
            )
          }
          {
            instagram === null || instagram.length === 0 ? null : (
              <a className="ml-2" href={instagram} target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/Instagram_Glyph_Gradient_RGB.png"
                  className="w-auto h-8"
                  alt="Instagram"
                />
              </a>
            )
          }
          {
            discord === null || discord.length === 0 ? null : (
              <a className="ml-2" href={discord} target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/icon_clyde_blurple_RGB.png"
                  className="w-auto h-8"
                  alt="Discord"
                />
              </a>
            )
          }
        </div>
      </div>
    )
  }
}

SportsAndSocsItem.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  facebook: PropTypes.string.isRequired,
  instagram: PropTypes.string.isRequired,
  discord: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired
}

export default SportsAndSocsItem;
