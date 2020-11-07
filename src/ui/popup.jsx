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
  const [user, setUser] = React.useState()

  React.useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      switch (message.type) {
      case 'GOOGLE_USER':
        setUser(message.user || {})
        setState(states.COMPLETE)
        break
      }
    })

    chrome.runtime.sendMessage({ type: 'GET_USER' }, user => {
      setUser(user || {})
      setState(user ? states.COMPLETE : states.LOGIN)
    })
  }, [])

  return (
    <>
      <em>commentable</em>

      {state === states.LOGIN && (
        <Login
          onRegister={_ => setState(states.REGISTER)}
          onLoginSuccess={_ => setState(states.COMPLETE)}
        />
      )}

      {state === states.REGISTER && (
        <Register
          onLogin={_ => setState(states.LOGIN)}
          onRegisterSuccess={_ => setState(states.COMPLETE)}
        />
      )}

      {state === states.COMPLETE && (
        <>
          {user.emailVerified && (
            <>
              <p>You're logged in and everything is good!</p>
            </>
          )}

          {!user.emailVerified && (
            <>
              <p>Please verify your email address</p>
              <Button
                variant='primary'
                onClick={() => chrome.runtime.sendMessage({ type: 'VERIFY_USER' })}
              >
                Send verification email
              </Button>
            </>
          )}

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

          <pre>
            {JSON.stringify(user || {}, null, 2)}
          </pre>
        </>
      )}

      <p>
        <a>Terms</a>
        <a>Privacy</a>
      </p>
    </>
  )
}

// --------------
ReactDOM.render(
  <Popup />,
  document.getElementById('root')
)
