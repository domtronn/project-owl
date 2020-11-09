/* global chrome */
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

import TeamSelector from './pages/team-selector.jsx'

import { Button } from '../common/components/button'

import sw from '../app/utils/switch'

const { sendMessage, onMessage } = chrome.runtime
const { useEffect, useState } = React
const states = {
  LOGIN: 'login',
  REGISTER: 'register',
  VERIFY_EMAIL: 'verify-email',

  CREATE_TEAM: 'create-team',
  JOIN_TEAM: 'join-team',

  DASHBOARD: 'dashboard',

  COMPLETE: 'complete',
  LOADING: 'loading',
}

const Popup = () => {
  const [state, setState] = useState(states.LOADING)
  const [user, setUser] = useState()

  useEffect(() => {
    onMessage.addListener((message) => {
      switch (message.type) {
      case 'GOOGLE_USER':
        setUser(message.user)
        setState(states.DASHBOARD)
        break
      }
    })

    sendMessage({ type: 'GET_USER' }, ({ user = {}, profile = {} }) => {
      console.log('profile', profile)
      setUser({ ...user, ...profile })
      setState(user ? states.DASHBOARD : states.LOGIN)
    })
  }, [])

  useEffect(() => {
    if (!user || !user.uid) return

    user.emailVerified
      ? setState(states.DASHBOARD)
      : setState(states.VERIFY_EMAIL)
  }, [user])

  return (
    <>
      <em>commentable</em>

      {sw({
        [states.LOGIN]: () => (
          <Login
            onRegister={_ => setState(states.REGISTER)}
            onLoginSuccess={_ => setState(states.DASHBOARD)}
          />
        ),

        [states.REGISTER]: () => (
          <Register
            onLogin={_ => setState(states.LOGIN)}
            onRegisterSuccess={_ => setState(states.DASHBOARD)}
          />
        ),

        [states.VERIFY_EMAIL]: () => (
          <>
            <p>Please verify your email address</p>
            <Button
              variant='primary'
              onClick={() => sendMessage({ type: 'VERIFY_USER' })}
            >
              Send verification email
            </Button>
          </>
        ),

        [states.DASHBOARD]: () => (
          <>
            <TeamSelector
              user={user}
            />
          </>
        )
      })(state)}

      {
        user && user.emailVerified && (
          <Button
            onClick={() =>
              firebase
                .auth()
                .signOut()
                .then(() => setState(states.LOGIN))}
          >
            Sign out
          </Button>
        )
      }

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
