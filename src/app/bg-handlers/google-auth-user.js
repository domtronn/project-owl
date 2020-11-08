import { firebase } from '../../common/firebase'

import 'firebase/auth'
import 'firebase/firestore'

const log = (msg) => console.log(`GOOGLE_AUTH_USER // ${msg}`)

export default ({ chrome, sender }) => {
  log('Beginning chrome identification')
  chrome
    .identity
    .getAuthToken({ interactive: true }, token => {
      log('Token generated')
      const credential = firebase
            .auth
            .GoogleAuthProvider
            .credential(null, token)

      console.log('-----------------------')
      console.log(token)
      console.log(credential)
      console.log('-----------------------')

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

              chrome.tabs.sendMessage(sender.tab.id, { type: 'GOOGLE_USER', user, token })
            })
        })
    })
}
