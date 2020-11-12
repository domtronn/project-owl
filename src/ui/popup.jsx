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

import TeamSelector from './pages/team-selector'
import Dashboard from './pages/dashboard'

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
  const [team, setTeam] = useState()
  const [pages, setPages] = useState()

  useEffect(() => {
    onMessage.addListener((message) => {
      switch (message.type) {
      case 'PUB_USER':
        setUser(message.user)
        break
      case 'PUB_PAGES':
        setPages(message.pages)
        break
      case 'PUB_TEAM':
        setTeam(message.team)
        break
      case 'GOOGLE_USER':
        setUser(message.user)
        setState(states.DASHBOARD)
        break
      }
    })

    sendMessage({ type: 'GET_TEAM' }, team => setTeam(team))
    sendMessage({ type: 'GET_PAGES' }, pages => setPages(pages))
    sendMessage({ type: 'GET_USER' }, (payload) => {
      const { user, profile } = payload || {}
      setUser(Object.assign({}, user, profile))
    })
  }, [])

  useEffect(() => {
    sw({
      [user && user.uid]: _ => setState(states.VERIFY_EMAIL),
      [user && user.uid && user.emailVerified]: _ => setState(states.DASHBOARD),
      [state === states.REGISTER]: _ => _,
      default: _ => setState(states.LOGIN)
    })(true)
  }, [user, team, pages])

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
            <Dashboard
              team={team}
              user={user}
              pages={pages}
            />
          </>
        )
      })(state)}

      {
        state !== states.LOGIN && user && user.emailVerified && (
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
