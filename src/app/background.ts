import { firebase } from "../common/firebase"

import "firebase/auth"
import "firebase/firestore"

import getUser from './bg-handlers/get-user'
import googleAuthUser from './bg-handlers/google-auth-user'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_USER':
      getUser({ sendResponse })
      break

    case 'GOOGLE_AUTH_USER':
      googleAuthUser({ chrome })
      break

    case 'VERIFY_USER':
      console.log('VERIFY_USER // Got request to verify users email address')
      firebase
        .auth()
        .currentUser
        .sendEmailVerification()

      return sendResponse('Sent email verification')

    default:
      return sendResponse('Unknown request')
  }
})

window.onload = () => {
  firebase
    .auth()
    .onAuthStateChanged(user => {
      console.log('user', user)
    })
}
