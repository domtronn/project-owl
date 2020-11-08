import { firebase } from '../../common/firebase'

import 'firebase/firestore'

const commentsRef = (pageId, threadId) => firebase
      .firestore()
      .collection('/pages')
      .doc(pageId)
      .collection('/threads')
      .doc(threadId)
      .collection('/comments')

export const create = (pageId, threadId, data) =>
  commentsRef(pageId, threadId)
    .add({
      created: new Date().toISOString(), 
      ...data
    })

export const update = (pageId, threadId, commentId, data) =>
  commentsRef(pageId, threadId)
    .doc(commentId)
    .update({
      updated: new Date().toISOString(),
      ...data
    })

export const del = (pageId, threadId, commentId) =>
  commentsRef(pageId, threadId)
    .doc(commentId)
    .delete()

export const onChange = (pageId, threadId, cb) =>
  commentsRef(pageId, threadId)
    .orderBy('created', 'asc')
    .onSnapshot(cb)
