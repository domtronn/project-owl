import { firebase } from '../../common/firebase'
import 'firebase/firestore'

export default (href) => new Promise((resolve, reject) => {
  console.log(href)
  firebase
    .firestore()
    .collection('/pages')
    .where('href', '==', href)
    .limit(1)
    .get()
    .then(res => {
      res.forEach(page => {
        console.log(page.data())
        resolve({ ...page.data(), id: page.id })
      })
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
})
