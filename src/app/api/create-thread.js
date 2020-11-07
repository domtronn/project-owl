import { firebase } from '../../common/firebase'
import 'firebase/firestore'

export default ({ pageId, pageX, pageY, pageWidth }) => {
  firebase
    .firestore()
    .collection('pages')
    .doc(pageId)
    .collection('thread')
    .add({
      pageX,
      pageY,
      pageWidth
    })
}
