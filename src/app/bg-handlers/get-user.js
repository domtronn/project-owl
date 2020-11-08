import { firebase } from '../../common/firebase'

import 'firebase/auth'

const log = (msg, ...rest) => console.log(`GET_USER // ${msg}`, ...rest)

export default ({ sendResponse }) => {
  log('Got request for user')

  const user = firebase
    .auth()
    .currentUser

  if (user) log('Found user, reloading')
  if (user) user.reload()

  log('Returning user', user)
  return sendResponse(user)
}
