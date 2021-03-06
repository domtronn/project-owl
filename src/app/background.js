/* global chrome */
import { firebase } from '../common/firebase'
import 'firebase/auth'
import 'firebase/firestore'

import { addedDiff } from 'deep-object-diff'

import googleAuthUser from './bg-handlers/google-auth-user'
import sw from './utils/switch'

let UserState = {}

const BillingState = {
  log: (msg) => sLog(`BILLING // ${msg} -- READS:${BillingState.reads} WRITES:${BillingState.writes} DELETES:${BillingState.deletes}`),
  read: (amt = 1) => {
    BillingState.reads += amt
    BillingState.log(`read ${amt}`)
  },
  write: (amt = 1) => {
    BillingState.writes += amt
    BillingState.log(`write ${amt}`)
  },
  delete: (amt = 1) => {
    BillingState.deletes += amt
    BillingState.log(`delete ${amt}`)
  },
  reads: 0,
  writes: 0,
  deletes: 0
}

const log = (...msg) => console.log(...msg)
const logGreen = (...msg) => console.log(...msg, 'margin-top: 8px; padding: 2px; background-color: #f30089; color: #fff', '')
const logRed = (...msg) => console.log(...msg, 'margin-top: 8px; padding: 2px; background-color: #2d00f7; color: #fff', '')
const logBlue = (...msg) => console.log(...msg, 'margin-top: 8px; padding: 2px; background-color: #bc00dd; color: #fff', '')
const logYellow = (...msg) => console.log(...msg, 'margin-top: 8px; padding: 2px; background-color: #8900f2; color: #fff', '')
const logMagenta = (...msg) => console.log(...msg, 'margin-top: 8px; padding: 2px; background-color: #db00b6; color: #fff', '')
const logBoW = (...msg) => console.log(...msg, 'margin-top: 8px; padding: 2px; background-color: #fff; color: #000', '')

/** Smart log based on the scope of the message */
const sLog = (m, ...rest) => sw({
  // Log green for CREATE & UPDATE
  [m.startsWith('CREATE')]: _ => logGreen(`⭐️ %c${new Date().toISOString()} ${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.startsWith('UPDATE')]: _ => logGreen(`♻️ %c${new Date().toISOString()} ${m.replace(' // ', ' //%c ')}`, ...rest),
  // Log red for DELETES
  [m.startsWith('DELETE')]: _ => logRed(`☠️ %c${new Date().toISOString()} ${m.replace(' // ', ' //%c ')}`, ...rest),

  // Log magenta for INCOMING requests from snapshot changes & clients
  [m.startsWith('GET')]: _ => logMagenta(`✉️ %c${new Date().toISOString()} ${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.includes('_CHANGE')]: _ => logMagenta(`📣 %c${new Date().toISOString()} ${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.includes('_PUBLISH')]: _ => logBlue(`🔊 %c${new Date().toISOString()} ${m.replace(' // ', ' //%c ')}`, ...rest),

  [m.startsWith('LISTEN')]: _ => logBoW(`👂 %c${new Date().toISOString()} ${m.replace(' // ', ' //%c ')}`, ...rest),
  [m.startsWith('BILLING')]: _ => logYellow(`💰 %c${new Date().toISOString()} ${m.replace(' // ', ' //%c ')}`, ...rest),
  default: _ => log(m, ...rest)
})(true)

logGreen('%cCREATE%c These message are used for creations')
logBlue('%cUPDATE%c These are used for message updates')
logRed('%cDELETE%c These message are used for document deletions')
log('\n')
logYellow('%cCHANGE%c This is used for changes to a document based on an event')
logMagenta('%cREAD%c This is used for a client request')
log('\n\n')

chrome.storage.sync.get({ debugMode: false }, ({ debugMode }) => {
  if (debugMode) return

  log('Run this command to enable debugMode - ')
  log('chrome.storage.sync.set({ debugMode: true }, () => console.log(\'DebugMode is set\')) ')
  log('\n\n')
})

chrome.commands.onCommand.addListener((command) => {
  switch (command) {
  case 'toggle-edit-view-mode': {
    chrome.tabs.query({ active: true }, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_MODE' })
      })
    })
    break
  }
  }
})

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
    const uid = (UserState.userProfile || {}).team

    if (teamId !== uid) sLog('GET_TEAM // Team ID did not match users current team')
    if (teamId !== uid) return sendResponse({})

    sLog('GET_TEAM // Team found')
    log(UserState.team)

    return sendResponse(UserState.team)
  }

  case 'GET_PAGES': {
    sLog('GET_PAGES // Fetching a list of pages active for a team')
    const pages = UserState.pages || []

    sendResponse(pages.map(({ href }) => href))
    break
  }

  case 'GET_MENTIONS': {
    sLog('GET_MENTIONS // Fetching mentions of current user')
    const pages = UserState.pages
    const uid = UserState.user.uid

    const mentions = (pages || [])
          .reduce((acc, page) => {
            const { href, threads } = page

            return acc.concat(
              Object
                .entries(threads)
                .reduce((acc, [id, { comments, resolved }]) => {
                  if (resolved) return acc // Filter out resolved threads

                  const mention = comments // Slice reverse to create a copy before seraching to find last comment
                        .slice()
                        .reverse()
                        .find(({ content = '' }) => content.includes(`[[:mention:][${uid}]]`))

                  const lastResponse = comments
                        .slice()
                        .reverse()
                        .find(({ user }) => user === UserState.user.uid)

                  if (!mention) return acc // Filter out threads without a mention
                  if (lastResponse && new Date(lastResponse.created) > new Date(mention.created)) return acc // Filter out mentions if you've responded since the mention

                  return acc.concat({ ...mention, threadId: id, href, user: UserState.users[mention.user] })
                }, [])
            )
          }, [])
          .sort((a, b) => new Date(b.created) - new Date(b))

    sLog(`GET_MENTIONS // `)
    log(mentions)

    sendResponse(mentions)
    break
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

    BillingState.write()
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

    BillingState.write()
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

    BillingState.write()
    firebase
        .firestore()
        .collection(`/teams/${ctx.teamId}/pages/`)
        .doc(ctx.pageId)
        .set({ ...newPage, updated: new Date().toISOString() }, { merge: true })
      break
    }

  case 'CREATE_PAGE': {
    const { ctx, href } = message
    const { origin, pathname } = new URL(href)
    const url = origin + pathname

    sLog(`CREATE_PAGE // Creating page ${url} for ${ctx.teamId}`)

    const newPage = {
      href: url,
      created: new Date().toISOString(),
      threads: { }
    }

    BillingState.write()
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

    BillingState.write()
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
      log(`OPEN_THREAD // created tab ${tab.id}, waiting for complete...`)
      chrome.tabs.onUpdated.addListener(function waitForComplete (ltab, { status }) {
        log(`OPEN_THREAD // Tab ${tab.id}/${ltab} updated with status ${status}`)
        if (ltab !== tab.id) return
        if (status !== 'complete') return

        log(`OPEN_THREAD // ${tab.id} is ready...`)

        setTimeout(() => {
          log(`OPEN_THREAD // Sending open message to ${tab.id} and removing listener...`)
          chrome.tabs.sendMessage(tab.id, { type: 'OPEN_THREAD', id })
          chrome.tabs.onUpdated.removeListener(waitForComplete)
        }, 500)
      })
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

    BillingState.write()
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
  window.BILLING_STATE = BillingState
}, 250)

let listeners = []

const queryTabs = (url) => new Promise((resolve) => {
  chrome.tabs.query({ url }, resolve)
})

const publishMessageToCommentablePages = (msg) => {
  (UserState.pages || []).forEach(({ href }) => {
    Promise
      .all([
        queryTabs(href) // Exact URL matches
        ,queryTabs(href + '?*') // URLs with query params
        ,queryTabs(href + '#*') // URLs with search params
        ,queryTabs(href + '?*#*') // URLS with both query and search params
        ,queryTabs(href + '#*?*') // URLS with both query and search params
      ])
      .then(tabs => {
        const totaltabs = tabs.reduce((acc, it) => acc.concat(it), [])
        if (!totaltabs.length) return

        totaltabs.forEach(tab => chrome.tabs.sendMessage(tab.id, msg))
      })
  })
}

const publishPageUpdate = (page) => {
  const { href } = page
  const message = { type: 'PUB_PAGE', page }

  chrome.runtime.sendMessage({ type: 'PUB_PAGES', pages: (UserState.pages || []).map(({ href }) => href) })
  Promise
    .all([
      queryTabs(href) // Exact URL matches
      ,queryTabs(href + '?*') // URLs with query params
      ,queryTabs(href + '#*') // URLs with search params
      ,queryTabs(href + '?*#*') // URLS with both query and search params
      ,queryTabs(href + '#*?*') // URLS with both query and search params
    ])
    .then(tabs => {
      const totaltabs = tabs.reduce((acc, it) => acc.concat(it), [])
      if (!totaltabs.length) return

      sLog(`PAGE_PUBLISH // Publishing change to ${totaltabs.length} totaltabs`)
      log(page)

      totaltabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message))
    })
}

const publishAuthUpdate = (user) => {
  chrome.tabs.query({}, tabs => {
    sLog(`AUTH_PUBLISH // Publishing change to ${tabs.length} tabs`)
    log(user)

    const message = { type: 'PUB_USER', user }

    chrome.runtime.sendMessage(message)

    if (!user) // User logged out, publish empty data
    {
      chrome.runtime.sendMessage({ type: 'PUB_PAGES', pages: [] })
      chrome.runtime.sendMessage({ type: 'PUB_TEAM', team: null })
    }

    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message))
  })
}

const publishTeamUpdate = (href, team, users) => {
  const { origin, pathname } = new URL(href)
  const url = origin + pathname
  const message = { type: 'PUB_TEAM', team, users }
  chrome.runtime.sendMessage(message)

  Promise
    .all([
      queryTabs(url) // Exact URL matches
      ,queryTabs(url + '?*') // URLs with query params
      ,queryTabs(url + '#*') // URLs with search params
      ,queryTabs(url + '?*#*') // URLS with both query and search params
      ,queryTabs(url + '#*?*') // URLS with both query and search params
    ])
    .then(tabs => {
      const totaltabs = tabs.reduce((acc, it) => acc.concat(it), [])
      if (!totaltabs.length) return

      sLog(`TEAM_PUBLISH // Publishing team data for ${href} to ${totaltabs.length} tabs`)
      log(team, users)

      totaltabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message))
    })
}

const readSnapshot = snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

const focusTab = (url, onFocus, onMiss) =>
      chrome.tabs.query(({ url, currentWindow: true }), (tabs) => {
        const activeTab = tabs[0]

        if (!activeTab) return onMiss()

        chrome.tabs.update(activeTab.id, { active: true })
        onFocus(activeTab.id)
      })

const initialiseListeners = (user) => {
  const db = firebase.firestore()
  sLog(`LISTEN // Currently there are ${listeners.length} listeners`)
  sLog(`LISTEN // listening to /users/${user.uid}`)
  listeners.push(
    db
      .collection('/users')
      .doc(user.uid)
      .onSnapshot(userSnapshot => {
        BillingState.read()

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
      .onSnapshot((pagesSnapshot, ...rest) => {
        BillingState.read(pagesSnapshot.docChanges().length)

        pagesSnapshot
          .docChanges()
          .forEach(({ doc, type }) => {
            if (type !== 'modified') return

            sLog('PAGES_CHANGE // Searching for user mentions')

            const newPage = doc.data()
            const oldPage = UserState.pages.find(({ id }) => id === newPage.id)
            const diff = addedDiff(oldPage, newPage)

            if (!diff.threads) return

            Object
              .entries(diff.threads)
              .forEach(([threadId, { comments }]) => {
                if (!comments) return

                const mention = Object
                      .values(comments)
                      .find(({ content = '' }) => content.includes(`[[:mention:][${UserState.user.uid}]]`))

                if (!mention) return

                sLog(`PUB_MENTION // Found a mention for ${UserState.user.uid}`)
                log(mention)

                const mentioner = ((UserState.users || {})[mention.user] || {})
                const mentionerAvatar = mentioner.avatar || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'

                chrome
                  .notifications
                  .create({
                    type: 'basic',
                    title: `${mentioner.name} mentioned you!`,
                    iconUrl: mentionerAvatar,
                    message: `"${mention.content.replace(`[[:mention:][${UserState.user.uid}]]`, `@${UserState.userProfile.name}`)}"`
                  }, (notificationId) => {
                    function onNotificationClicked (nId, btnId) {
                      if (nId === notificationId) {
                        focusTab(
                          newPage.href,
                          tabId => chrome.tabs.sendMessage(tabId, { type: 'OPEN_THREAD', id: threadId }),
                          _ => {
                            // FIXME: This is duplicate with the NEW_OPEN_PAGE event since background won't respond to its own messages
                            //  Should consolidate this into a function
                            chrome.tabs.create({ url: newPage.href }, tab => {
                              log(`OPEN_THREAD // created tab ${tab.id}, waiting for complete...`)
                              chrome.tabs.onUpdated.addListener(function waitForComplete (ltab, { status }) {
                                log(`OPEN_THREAD // Tab ${tab.id}/${ltab} updated with status ${status}`)
                                if (ltab !== tab.id) return
                                if (status !== 'complete') return

                                log(`OPEN_THREAD // ${tab.id} is ready...`)

                                setTimeout(() => {
                                  log(`OPEN_THREAD // Sending open message to ${tab.id} and removing listener...`)
                                  chrome.tabs.sendMessage(tab.id, { type: 'OPEN_THREAD', id: threadId })
                                  chrome.tabs.onUpdated.removeListener(waitForComplete)
                                }, 500)
                              })
                            })
                          }
                        )
                      }

                      chrome.notifications.onClicked.removeListener(onNotificationClicked)
                    }

                    chrome
                      .notifications
                      .onClicked
                      .removeListener(onNotificationClicked)

                    chrome
                      .notifications
                      .onClicked
                      .addListener(onNotificationClicked)
                  })
              })
          })


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
        BillingState.read()

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
      if (!tab.url) return

      const { origin, pathname } = new URL(tab.url)
      const href = origin + pathname

      const page = (UserState.pages || []).find(page => page.href === href)

      sLog('TAB_CHANGE // Tab updated, publishing events')
      UserState.user && publishAuthUpdate(UserState.user, 'UPDATE')
      UserState.team && publishTeamUpdate(tab.url, UserState.team, UserState.users)
      page && publishPageUpdate(page)
    })
  })
}
