import { firebase } from '../../common/firebase'

import 'firebase/auth'
import 'firebase/firestore'

const log = (msg) => console.log(`GOOGLE_AUTH_USER // ${msg}`)

export default ({ chrome, sendResponse }) => {
  log('Beginning chrome identification')
  chrome
    .identity
    .getAuthToken({ interactive: true }, token => {
      log('Token generated')
      const credential = firebase
            .auth
            .GoogleAuthProvider
            .credential(null, token)

      firebase
        .auth()
        .signInWithCredential(credential)
        .then(({ user }) => {
          log('Got user after aign in')
          console.log(user)

          sendResponse('listen')
          chrome.runtime.sendMessage({ type: 'GOOGLE_USER', user })
        })
    })
}
