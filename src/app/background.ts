import { firebase } from "../common/firebase"

import "firebase/auth"
import "firebase/firestore"

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_USER':
      const user = firebase
        .auth()
        .currentUser

      user.reload()
      return sendResponse(user)

    case 'VERIFY_USER':
      console.log('VERIFY_USER // Got request to verify users email address')
      firebase
        .auth()
        .currentUser
        .sendEmailVerification()
      return sendResponse()

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

  chrome
    .identity
    .getAuthToken({ interactive: true }, token => {
      const credential = firebase
      .auth
      .GoogleAuthProvider
      .credential(null, token)

      console.log('credential', credential)

      firebase
      .auth()
      .signInWithCredential(credential)
    })
}
