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
        .then(({ user, additionalUserInfo, ...rest }) => {
          log('Got user after aign in')
          console.log(user)

          const docRef = firebase
            .firestore()
            .collection('users')
            .doc(user.uid)

          const payload = {
            name: additionalUserInfo.profile.name,
            avatar: user.photoURL
          }

          docRef.get()
            .then(doc => {
              doc.exists
                ? docRef.update(payload)
                : docRef.set(payload)

              chrome.runtime.sendMessage({ type: 'GOOGLE_USER', user })
            })
        })
    })
}
