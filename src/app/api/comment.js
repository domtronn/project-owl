import { firebase } from '../../common/firebase'

import 'firebase/firestore'

const commentsRef = ({ teamId, pageId, threadId}) => firebase
      .firestore()
      .collection('/teams')
      .doc(teamId)
      .collection('/pages')
      .doc(pageId)
      .collection('/threads')
      .doc(threadId)
      .collection('/comments')

export const create = (ctx, data) =>
  commentsRef(ctx)
    .add({
      created: new Date().toISOString(), 
      ...data
    })

export const update = (ctx, data) =>
  commentsRef(ctx)
    .doc(ctx.commentId)
    .update({
      updated: new Date().toISOString(),
      ...data
    })

export const del = (ctx) =>
  commentsRef(ctx)
    .doc(ctx.commentId)
    .delete()

export const onChange = (ctx, cb) =>
  commentsRef(ctx)
    .orderBy('created', 'asc')
    .onSnapshot(cb)
