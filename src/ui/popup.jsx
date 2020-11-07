import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { firebase } from '../common/firebase'

import 'firebase/auth'
import 'firebase/firestore'

import '../common/root.css'
import '../styles/normalise.css'
import '../styles/popup.css'

import Login from './pages/login'
import Register from './pages/register'

import { Button } from '../common/components/button'

const states = {
  LOGIN: 'login',
  REGISTER: 'register',
  CREATE_TEAM: 'create-team',
  INVITE_TEAM: 'invite-team',
  COMPLETE: 'complete',
  LOADING: 'loading'
}

const Popup = () => {
  const [state, setState] = React.useState(states.LOADING)

  React.useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_USER' }, user => {
      setState(user ? states.COMPLETE : states.LOGIN)
    })
  }, [])

  return (
    <>
      <em>commentable</em>
      {state === states.LOGIN && (<Login onRegister={_ => setState(states.REGISTER)} onLoginSuccess={_ => setState(states.COMPLETE)} />)}
      {state === states.REGISTER && (<Register onLogin={_ => setState(states.LOGIN)} onRegisterSuccess={_ => setState(states.COMPLETE)} />)}
      {state === states.COMPLETE && (
        <>
          <p>You're logged in and everything is good!</p>
          <Button
            onClick={() =>
              firebase
                .auth()
                .signOut()
                .then(() => setState(states.LOGIN))
            }
          >
            Sign out
          </Button>
        </>
      )}
    </>
  )
}

// --------------
ReactDOM.render(
  <Popup />,
  document.getElementById('root')
)
