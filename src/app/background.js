/* global chrome */
import { firebase } from '../common/firebase'
import 'firebase/auth'
import 'firebase/firestore'

import googleAuthUser from './bg-handlers/google-auth-user'

let UserState = {}

const log = (...msg) => console.log(...msg)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
  case 'GOOGLE_AUTH_USER':
    googleAuthUser({ chrome })
    break

  case 'VERIFY_USER':
    log('VERIFY_USER // Got request to verify users email address')
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
    log('GET_USER // Fetching user')
    const user = firebase
          .auth()
          .currentUser

    if (user) log('GET_USER // User already authenticated, reloading')
    if (user) user.reload()

    if (!user) return sendResponse(null)

    log('GET_USER // Sending user response', user)
    return sendResponse({
      user,
      profile: UserState.userProfile
    })
  }
    // ----------------------------------------

  case 'GET_TEAM': {
    log('GET_TEAM // Fetching team for user')

    const teamId = (UserState.team || {}).id
    const uid = (UserState.user || {}).uid

    if (teamId !== uid) log('GET_TEAM // Team ID did not match users current team')
    if (teamId !== uid) return sendResponse({})

    log('GET_TEAM // Team found', UserState.team)
    return sendResponse(UserState.team)
  }

    // ----------------------------------------
    /**
     * GET_PAGE
     * Immediately return the page data from UserState
     */
  case 'GET_PAGE': {
    const { href } = message
    log('GET_PAGE // Fetching page data for ', message)

    const page = (UserState.pages || [])
          .find((page) => page.href === href)

    if (!page) log('GET_PAGE // Page not found')
    if (!page) return sendResponse({})

    log('GET_PAGE // Page found', page)
    return sendResponse(page)
  }
    // ----------------------------------------

  case 'CREATE_THREAD': {
    const { commentData, threadData, ctx } = message
    log(`CREATE_THREAD // Creating thread on page ${ctx.pageId} @(${threadData.pageX}, ${threadData.pageY})`)

    const page = (UserState.pages || [])
          .find((page) => page.id === ctx.pageId)

    if (!page) log('CREATE_THREAD // Page not found')
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

  case 'CREATE_PAGE': {
    const { ctx, href } = message
    log(`CREATE_PAGE // Creating page ${href} for ${ctx.teamId}`)

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

  case 'DELETE_THREAD':
    break

  case 'ADD_COMMENT': {
    const { commentData, threadData, ctx } = message
    log(`ADD_COMMENT // Adding comment to ${threadData.id}`)

    const page = (UserState.pages || [])
          .find((page) => page.id === ctx.pageId)

    if (!page) log('ADD_COMMENT // Page not found')
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
    log(`PAGE_CHANGE // Publishing change to ${tabs.length} tabs`)
    log('PAGE_CHANGE // ', page)

    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, {
      type: 'PUB_PAGE',
      page
    }))
  })
}

const publishAuthUpdate = (user, type = `CHANGE`) => {
  chrome.tabs.query({}, tabs => {
    log(`AUTH_${type} // Publishing change to ${tabs.length} tabs`)
    log(`AUTH_${type} // `, user)

    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, {
      type: 'PUB_USER',
      user
    }))
  })
}

const publishTeamUpdate = (href, team, users) => {
  chrome.tabs.query({ url: href }, tabs => {
    log(`TEAM_CHANGE // Publishing change to ${tabs.length} tabs`)
    log('TEAM_CHANGE // ', team, users)

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
  log(`LISTEN // Currently there are ${listeners.length} listeners`)
  log(`LISTEN // listening to /users/${user.uid}`)
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

  log(`LISTEN // listening to /teams/${teamId}/pages`)
  listeners.push(
    db
      .collection(`/teams/${teamId}/pages`)
      .onSnapshot(pagesSnapshot => {
        log('PAGES_SNAPSHOT // Page snapshot updated')
        const pages = readSnapshot(pagesSnapshot)
        UserState = { ...UserState, pages }

        pages.forEach(publishPageUpdate)
      }, err => console.error('PAGES_SNAPSHOT // Subscription failed', err))
  )

  log(`LISTEN // listening to /teams/${teamId}`)
  listeners.push(
    db
      .collection('/teams')
      .doc(teamId)
      .onSnapshot(async teamSnapshot => {
        log(`TEAM_SNAPSHOT // ${teamId} // Teams updated`)
        const team = { id: teamSnapshot.id, ...teamSnapshot.data() }

        // if user permission within a team has changed then refresh data
        if (
          ((UserState.team || {}).members || {})[user.uid] !== team.members[user.uid]
        ) {
          log('TEAM_SNAPSHOT // Your team permissions have changed, refreshing listeners')

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
      }, err => console.error('TEAM_SNAPSHOT // Subscription failed', err))
  )
}

window.onload = () => {
  firebase
    .auth()
    .onAuthStateChanged(user => {
      log('AUTH_CHANGE // ', user)
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

      log('TAB_CHANGE // Tab updated, publishing events')
      UserState.user && publishAuthUpdate(UserState.user, 'UPDATE')
      UserState.team && publishTeamUpdate(tab.url, UserState.team, UserState.users)
      page && publishPageUpdate(page)
    })
  })
}
