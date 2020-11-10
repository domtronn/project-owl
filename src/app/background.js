/* global chrome */
import { firebase } from '../common/firebase'
import 'firebase/auth'
import 'firebase/firestore'

import googleAuthUser from './bg-handlers/google-auth-user'
import sw from './utils/switch'

let UserState = {}

const log = (...msg) => console.log(...msg)
const logGreen = (...msg) => console.log(...msg, 'padding: 2px; background-color: #00f5d4; color: #000', '')
const logRed = (...msg) => console.log(...msg, 'padding: 2px; background-color: #ef476f; color: #fff', '')
const logBlue = (...msg) => console.log(...msg, 'padding: 2px; background-color: #00bbf9; color: #000', '')
const logYellow = (...msg) => console.log(...msg, 'padding: 2px; background-color: #fee440; color: #000', '')
const logMagenta = (...msg) => console.log(...msg, 'padding: 2px; background-color: #9b5de5; color: #fff', '')
const logBoW = (...msg) => console.log(...msg, 'padding: 2px; background-color: #fff; color: #000', '')

/** Smart log based on the scope of the message */
const sLog = (m, ...rest) => sw({
  [m.startsWith('GET')]: _ => logMagenta(`%c${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.startsWith('CREATE')]: _ => logGreen(`%c${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.startsWith('UPDATE')]: _ => logGreen(`%c${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.startsWith('DELETE')]: _ => logRed(`%c${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.includes('_CHANGE')]: _ => logYellow(`%c${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.includes('_PUBLISH')]: _ => logBlue(`%c${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.startsWith('LISTEN')]: _ => logBoW(`%c${m.replace(' // ', ' //%c ')}`, ...rest),
  default: _ => log(m, ...rest)
})(true)

logGreen('%cCREATE%c These message are used for creations')
logRed('%cDELETE%c These message are used for document deletions')
logBlue('%cUPDATE%c These are used for message updates')
log('\n')
logYellow('%cCHANGE%c This is used for changes to a document based on an event')
logMagenta('%cREAD%c This is used for a client request')
log('\n\n')

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
  case 'GOOGLE_AUTH_USER':
    googleAuthUser({ chrome })
    break

  case 'VERIFY_USER':
    sLog('VERIFY_USER // Got request to verify users email address')
    firebase
      .auth()
      .currentUser
      .sendEmailVerification()
    return sendResponse('Sent email verification')

    //  ----------------------------------------
    /**
     * GET_USER
     * Retrieve the user profile for currently authenticated used
     */
  case 'GET_USER': {
    sLog('GET_USER // Fetching user')
    const user = firebase
          .auth()
          .currentUser

    if (user) sLog('GET_USER // User already authenticated, reloading')
    if (user) user.reload()

    if (!user) return sendResponse(null)

    sLog('GET_USER // Sending user response')
    log(user)
    return sendResponse({
      user,
      profile: UserState.userProfile
    })
  }
    // ----------------------------------------

  case 'GET_TEAM': {
    sLog('GET_TEAM // Fetching team for user')

    const teamId = (UserState.team || {}).id
    const uid = (UserState.user || {}).uid

    if (teamId !== uid) sLog('GET_TEAM // Team ID did not match users current team')
    if (teamId !== uid) return sendResponse({})

    sLog('GET_TEAM // Team found')
    log(UserState.team)

    return sendResponse(UserState.team)
  }

  case 'GET_MENTIONS': {
    sLog('GET_MENTIONS // Fetching mentions of current user')
    const pages = UserState.pages
    const uid = UserState.user.uid

    const mentions = pages
          .map(({ href, threads }) => {
            return [
              href,
              Object
                .entries(threads)
                .reduce((acc, [id, { comments }]) => {
                  const mention = comments.find(({ content }) => content.includes(`[[:mention:][${uid}]]`))
                  if (!mention) return acc

                  return acc.concat([[id, mention]])
                }, [])
            ]
          })

    sLog(`GET_MENTIONS // `)
    log(mentions)

    sendResponse(mentions)
  }

    // ----------------------------------------
    /**
     * GET_PAGE
     * Immediately return the page data from UserState
     */
  case 'GET_PAGE': {
    const { href } = message
    sLog('GET_PAGE // Fetching page data for ')
    log(message)

    const page = (UserState.pages || [])
          .find((page) => page.href === href)

    if (!page) sLog('GET_PAGE // Page not found')
    if (!page) return sendResponse({})

    sLog('GET_PAGE // Page found')
    log(page)
    return sendResponse(page)
  }
    // ----------------------------------------

  case 'CREATE_THREAD': {
    const { commentData, threadData, ctx } = message
    sLog(`CREATE_THREAD // Creating thread on page ${ctx.pageId} @(${threadData.pageX}, ${threadData.pageY})`)

    const page = (UserState.pages || [])
          .find((page) => page.id === ctx.pageId)

    if (!page) sLog('CREATE_THREAD // Page not found')
    if (!page) return sendResponse({})

    const newPage = {
      ...page,
      threads: {
        [threadData.id]: {
          ...threadData,
          created: new Date().toISOString(),
          comments: [
            {
              ...commentData,
              created: new Date().toISOString()
            }
          ]
        }
      }
    }

    firebase
      .firestore()
      .collection(`/teams/${ctx.teamId}/pages/`)
      .doc(ctx.pageId)
      .set({ ...newPage, updated: new Date().toISOString() }, { merge: true})
    break
  }

  case 'RESOLVE_THREAD': {
    const { id, ctx } = message
    sLog(`RESOLVE_THREAD // Resolving thread ${id} on page ${ctx.pageId}`)

    const page = (UserState.pages || [])
          .find((page) => page.id === ctx.pageId)

    if (!page) sLog('RESOLVE_THREAD // Page not found')
    if (!page) return sendResponse({})

    const newPage = {
      threads: {
        [id]: {
          updated: new Date().toISOString(),
          resolved: true,
          resolvedBy: ctx.userId,
          resolvedAt: new Date().toISOString()
        }
      }
    }

    sLog('RESOLVE_THREAD // New thread data')
    log(newPage)

    firebase
      .firestore()
      .collection(`/teams/${ctx.teamId}/pages/`)
      .doc(ctx.pageId)
      .set({ ...newPage, updated: new Date().toISOString() }, { merge: true })
    break
  }

  case 'UNRESOLVE_THREAD': {
    const { id, ctx } = message
    sLog(`UNRESOLVE_THREAD // Unresolving thread ${id} on page ${ctx.pageId}`)

      const page = (UserState.pages || [])
            .find((page) => page.id === ctx.pageId)

      if (!page) sLog('UNRESOLVE_THREAD // Page not found')
      if (!page) return sendResponse({})

      const newPage = {
        threads: {
          [id]: {
            updated: new Date().toISOString(),
            resolved: firebase.firestore.FieldValue.delete(),
            resolvedBy: firebase.firestore.FieldValue.delete(),
            resolvedAt: firebase.firestore.FieldValue.delete()
          }
        }
      }

    sLog('UNRESOLVE_THREAD // New thread data')
    log(newPage)

      firebase
        .firestore()
        .collection(`/teams/${ctx.teamId}/pages/`)
        .doc(ctx.pageId)
        .set({ ...newPage, updated: new Date().toISOString() }, { merge: true })
      break
    }

  case 'CREATE_PAGE': {
    const { ctx, href } = message
    sLog(`CREATE_PAGE // Creating page ${href} for ${ctx.teamId}`)

    const newPage = {
      href,
      created: new Date().toISOString(),
      threads: { }
    }

    firebase
      .firestore()
      .collection(`/teams/${ctx.teamId}/pages/`)
      .add(newPage)
    break
  }

  case 'DELETE_THREAD': {
    const { ctx, id } = message
    sLog(`DELETE_THREAD // Deleting thread ${id} on page ${ctx.pageId}`)

    const page = (UserState.pages || [])
          .find((page) => page.id === ctx.pageId)

    if (!page) sLog('DELETE_THREAD // Page not found')
    if (!page) return sendResponse({})

    const newPage = {
      threads: {
        [id]: firebase.firestore.FieldValue.delete()
      }
    }

    sLog('DELETE_THREAD // New thread data')
    log(newPage)

    firebase
      .firestore()
      .collection(`/teams/${ctx.teamId}/pages/`)
      .doc(ctx.pageId)
      .set({ ...newPage, updated: new Date().toISOString() }, { merge: true })

    break
  }

  case 'NEW_OPEN_THREAD': {
    const { url, id } = message
    chrome.tabs.create({ url }, tab => {
      setTimeout(() => chrome.tabs.sendMessage(tab.id, { type: 'OPEN_THREAD', id }), 1000)
    })
    break
  }

  case 'ADD_COMMENT': {
    const { commentData, threadData, ctx } = message
    sLog(`ADD_COMMENT // Adding comment to ${threadData.id}`)

    const page = (UserState.pages || [])
          .find((page) => page.id === ctx.pageId)

    if (!page) sLog('ADD_COMMENT // Page not found')
    if (!page) return sendResponse({})

    const newPage = {
      ...page,
      threads: {
        [threadData.id]: {
          ...threadData,
          updated: new Date().toISOString(),
          comments: []
            .concat(threadData.comments)
            .concat({
              ...commentData,
              created: new Date().toISOString()
            })
        }
      }
    }

    firebase
      .firestore()
      .collection(`/teams/${ctx.teamId}/pages/`)
      .doc(ctx.pageId)
      .set({ ...newPage, updated: new Date().toISOString() }, { merge: true })
    break

  }
    break

  default:
    return sendResponse('Unknown request')
  }
})

setInterval(() => {
  window.USER_STATE = UserState
}, 2500)

let listeners = []

const publishPageUpdate = (page) => {
  chrome.tabs.query({ url: page.href }, tabs => {
    sLog(`PAGE_PUBLISH // Publishing change to ${tabs.length} tabs`)
    log(page)

    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, {
      type: 'PUB_PAGE',
      page
    }))
  })
}

const publishAuthUpdate = (user) => {
  chrome.tabs.query({}, tabs => {
    sLog(`AUTH_PUBLISH // Publishing change to ${tabs.length} tabs`)
    log(user)

    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, {
      type: 'PUB_USER',
      user
    }))
  })
}

const publishTeamUpdate = (href, team, users) => {
  chrome.tabs.query({ url: href }, tabs => {
    sLog(`TEAM_PUBLISH // Publishing change to ${tabs.length} tabs`)
    log(team, users)

    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, {
      type: 'PUB_TEAM',
      team,
      users
    }))
  })
}

const readSnapshot = snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

const initialiseListeners = (user) => {
  const db = firebase.firestore()
  sLog(`LISTEN // Currently there are ${listeners.length} listeners`)
  sLog(`LISTEN // listening to /users/${user.uid}`)
  listeners.push(
    db
      .collection('/users')
      .doc(user.uid)
      .onSnapshot(userSnapshot => {
        const user = userSnapshot.data()

        log('userdoc', user.team)
        log('userstate', UserState.userProfile)
        if (
          !UserState.userProfile ||
            (user &&
             user.team &&
             UserState.userProfile &&
             UserState.userProfile.team !== user.team)
        ) {
          UserState = { ...UserState, userProfile: user }
          publishAuthUpdate(UserState.user, 'UPDATE')

          ;(listeners || []).forEach(unsub => unsub())
          listeners = []
          initialiseListeners(UserState.user)
          return
        }

        publishAuthUpdate(UserState.user, 'UPDATE')
      })
  )

  const teamId = (UserState.userProfile || {}).team
  log('read team id', teamId)
  if (!teamId) return

  sLog(`LISTEN // listening to /teams/${teamId}/pages`)
  listeners.push(
    db
      .collection(`/teams/${teamId}/pages`)
      .onSnapshot(pagesSnapshot => {
        sLog('PAGES_CHANGE // Page snapshot updated')
        const pages = readSnapshot(pagesSnapshot)
        UserState = { ...UserState, pages }

        pages.forEach(publishPageUpdate)
      }, err => console.error('PAGES_CHANGE // Subscription failed', err))
  )

  sLog(`LISTEN // listening to /teams/${teamId}`)
  listeners.push(
    db
      .collection('/teams')
      .doc(teamId)
      .onSnapshot(async teamSnapshot => {
        sLog(`TEAM_CHANGE // ${teamId} // Teams updated`)
        const team = { id: teamSnapshot.id, ...teamSnapshot.data() }

        // if user permission within a team has changed then refresh data
        if (
          ((UserState.team || {}).members || {})[user.uid] !== team.members[user.uid]
        ) {
          sLog('TEAM_CHANGE // Your team permissions have changed, refreshing listeners')

          // Publish empty page data
          publishAuthUpdate(user, 'UPDATE')
          ;(UserState.pages || []).forEach(({ href }) => publishPageUpdate({ href }))

          UserState = { ...UserState, pages: [] }
          listeners.forEach(unsub => unsub())
          listeners = []
          initialiseListeners(user)
        }
        UserState = { ...UserState, team }

        const members = Object.keys(team.members)
        const memberProfiles = await Promise.all(
          members.map(uid => db.collection('/users').doc(uid).get().then(i => ({
            id: uid,
            ...i.data()
          })))
        )

        UserState = { ...UserState, users: memberProfiles.reduce((acc, it) => ({ ...acc, [it.id]: it }), {}) }
        ;(UserState.pages || []).forEach(page => publishTeamUpdate(
          page.href,
          team,
          memberProfiles.reduce((acc, it) => ({ ...acc, [it.id]: it }), {})
        ))
      }, err => console.error('TEAM_CHANGE // Subscription failed', err))
  )
}

window.onload = () => {
  firebase
    .auth()
    .onAuthStateChanged(user => {
      sLog('AUTH_CHANGE // ')
      log(user)

      publishAuthUpdate(user)

      if (user) user.reload()

      UserState = user ? { ...UserState, user } : {}
      ;(listeners || []).forEach(unsub => unsub && unsub())
      user && initialiseListeners(user)
    })

  chrome.tabs.onUpdated.addListener((tab, { status }) => {
    if (status !== 'complete') return

    chrome.tabs.get(tab, tab => {
      const page = (UserState.pages || []).find(page => page.href === tab.url)

      sLog('TAB_CHANGE // Tab updated, publishing events')
      UserState.user && publishAuthUpdate(UserState.user, 'UPDATE')
      UserState.team && publishTeamUpdate(tab.url, UserState.team, UserState.users)
      page && publishPageUpdate(page)
    })
  })
}
