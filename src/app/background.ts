import { firebase } from "../common/firebase"

import "firebase/auth"
import "firebase/firestore"

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_USER':
      return sendResponse(firebase.auth().currentUser)
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
