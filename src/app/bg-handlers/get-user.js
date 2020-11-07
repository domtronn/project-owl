import { firebase } from '../../common/firebase'

import 'firebase/auth'

export default ({ sendResponse }) => {
  const user = firebase
    .auth()
    .currentUser

  if (user) user.reload()

  return sendResponse(user)
}
