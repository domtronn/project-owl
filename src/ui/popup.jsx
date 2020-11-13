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

import Skeleton from '../common/components/skeleton'
import { Button } from '../common/components/button'

import sw from '../app/utils/switch'

import {
  MdCreate as Plus
} from 'react-icons/md'

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

const PopupSkel = () => (
  <>
    <div style={{ margin: '32px 0' }}>
      <Skeleton.Avatar size='lg' style={{ margin: '24px auto' }} />
      <Skeleton.Text style={{ margin: '16px auto' }} width={220} size='md' />
      <Skeleton.Text style={{ margin: '16px auto' }} width={180} size='md' />
      <Skeleton.Text style={{ margin: '16px auto' }} width={200} size='md' />
      <Skeleton.Text style={{ margin: '16px auto' }} width={210} size='lg' />
    </div>
  </>
)

const Popup = () => {
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState(states.LOADING)

  const [user, setUser] = useState()
  const [team, setTeam] = useState()
  const [pages, setPages] = useState()

  const [currPage, setCurrPage] = useState()

  useEffect(() => {
    // Set the current page URL used for create new page button
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const { origin, pathname } = new URL(tab.url)
      setCurrPage(origin + pathname)
    })
  }, [])

  useEffect(() => {
    onMessage.addListener((message) => {
      switch (message.type) {
      case 'PUB_USER':
        setUser({ ...user, ...message.user })
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
      setLoading(false)
      setState(
        user && user.uid
          ? states.DASHBOARD
          : states.LOGIN
      )
    })
  }, [])

  console.log(loading)

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
        ),

        [states.LOADING]: () => (
          <>
            <PopupSkel />
          </>
        )
      })(state)}

      {
        state !== states.LOGIN && user && user.emailVerified && pages && pages.length && !pages.includes(currPage) && (
          <Button
            variant='primary'
            onClick={() => sendMessage({
              type: 'CREATE_PAGE',
              href: currPage,
              ctx: {
                teamId: team.id,
                userId: user.uid
              }
            })}
          >
            Create new page
            <Plus style={{ marginBottom: -2, marginLeft: 6, marginRight: -11 }} />
          </Button>
        )
      }

      {
        state !== states.LOGIN && user && user.emailVerified && (
          <Button
            onClick={() => {
              setLoading(true)
              setState(states.LOADING)
              firebase
                .auth()
                .signOut()
                .then(() => {
                  setLoading(false)
                  setState(states.LOGIN)
                })
            }}
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
