import { firebase } from "../common/firebase"

import "firebase/auth"
import "firebase/firestore"

import getUser from './bg-handlers/get-user'
import googleAuthUser from './bg-handlers/google-auth-user'

import sw from './utils/switch'

import * as pages from './api/page'
import * as threads from './api/thread'
import * as comments from './api/comment'

const unsubs = {}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('message -- From sender', sender)

  return sw({
    GET_USER: _ => getUser({ sendResponse })
   ,GOOGLE_AUTH_USER: _ => googleAuthUser({ chrome })
   ,VERIFY_USER: _ => {
     console.log('VERIFY_USER // Got request to verify users email address')

     firebase
     .auth()
     .currentUser
     .sendEmailVerification()

     return sendResponse('msg_accepted')
   }

   ,GET_PAGE: ({ ctx, href }) => {
     console.log('GET_PAGE // Got request for page', href)
     sendResponse('msg_accepted')
     return pages
      .get(ctx, href)
      .then(page => {
        console.log('GET_PAGE // Got page successfully', page)
        chrome.tabs.sendMessage(sender.tab.id, { type: 'GET_PAGE_SUCCESS', page })
      })
     .catch(err => {
       console.log('GET_PAGE // Failed to fetch page', err)
       chrome.tabs.sendMessage(sender.tab.id, { type: 'GET_PAGE_ERROR', err })
     })
   }

   ,SUB_THREADS: ({ ctx }) => {
     /**
      * TODO: This is currently limited to a single listener
      * Which is probably enough but it won't propagate to all senders
      * per BG script if at all
      */
     sendResponse('msg_accepted')
     console.log('SUB_THREADS // Got request for thread changes')

     if (unsubs.threads) {
       console.log('SUB_THREADS // Unsubscribing current listener')
       unsubs.threads()
     }

     unsubs.threads = threads
      .onChange(ctx, snapshot => {
        chrome.tabs.sendMessage(
          sender.tab.id,
          {
            type: 'PUB_THREADS',
            threads: snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          }
        )
      })
   }

   ,SUB_COMMENTS: ({ ctx }) => {
     sendResponse('msg_accepted')
     console.log('SUB_COMMENTS // Got request for comment changes')

     if (unsubs.comments) {
       console.log('SUB_COMMENTS // Unsubscribing current listener')
       unsubs.comments()
     }

     const users = {}

     comments
     .onChange(ctx, snapshot => {
       const result = snapshot
         .docs
         .map(doc => {
           const { id } = doc
           const { user, ...data } = doc.data()

           return {
             ...data,
             id,
             userId: user,
             user: users[user] || {
               name: 'Anonymous'
             }
           }
         })
         .reduce((acc, doc) => {
           const front = acc.slice(0, -1)
           const [last] = acc.slice(-1)

           if (!last) return acc.concat(doc)
           if (last.userId !== doc.userId) return acc.concat(doc)

           const content = []
            .concat(last.content)
            .concat(doc.content)

           return front.concat({ ...doc, content })
         }, [])

       chrome.tabs.sendMessage(
         sender.tab.id,
         { type: 'PUB_COMMENTS', comments: result, threadId: ctx.threadId }
       )
     })
   }

   ,INIT_THREAD: ({ ctx, threadData, commentData }) => {
     sendResponse('msg_accepted')
     console.log('INIT_THREAD // Initialising or updating a thread')

     const threadPromise = !threadData.created
                         ? threads.create(ctx, threadData)
                         : Promise.resolve()

     console.log('INIT_THREAD // Created thread', threadData.id)

     threadPromise
      .then(thread => comments.create(ctx, commentData))
      .then(_ => console.log('INIT_THREAD // Thread created with comment'))
   }

   ,default: (message) => {
     console.log('UNKNOWN // ', message)
     sendResponse('msg_unknown')
   }
  })(message.type, message)
})

window.onload = () => {
  firebase
  .auth()
  .onAuthStateChanged(user => {
    console.log('AUTH_CHANGE // ', user)
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'AUTH_CHANGE', user: user || {} })
      })
    })

  })
}
