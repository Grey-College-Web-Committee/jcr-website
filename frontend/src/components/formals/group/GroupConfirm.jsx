import React from 'react'
import { Redirect } from 'react-router-dom'
import api from '../../../utils/axiosConfig.js'
import authContext from '../../../utils/authContext.js'
import LoadingHolder from '../../common/LoadingHolder'

class FormalsPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loaded: false,
      status: 0,
      id: ''
    }
  }


  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let id

    try {
      let res = await api.post(`/formals/verify/${this.props.token}`)
      id = res.data.id
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status })
      return
    }

    this.setState({ loaded: true, status: 200, id })
  }

  render() {
    if (!this.state.loaded) {
      if (this.state.status !== 200 && this.state.status !== 0) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        )
      }

      return (
        <LoadingHolder />
      )
    }

    return (
      <Redirect to={`/formals/${this.state.id}/details`} />
    )
  }
}

FormalsPage.contextType = authContext

export default FormalsPage
