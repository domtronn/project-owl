import { firebase } from '../../common/firebase'
import 'firebase/firestore'

export default (pageId) => new Promise((resolve, reject) => {
  firebase
    .firestore()
    .collection('/pages')
    .doc(pageId)
    .collection('/thread')
    .get()
    .then(res => {
      const threads = []
      res.forEach(thread => {
        console.log(thread.data())
        threads.push({ ...thread.data(), id: thread.id })
      })
      resolve(threads)
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
})
