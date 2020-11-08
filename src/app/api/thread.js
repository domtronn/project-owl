import { firebase } from '../../common/firebase'

import 'firebase/firestore'

const threadsRef = ({ teamId, pageId }) => firebase
      .firestore()
      .collection('/teams')
      .doc(teamId)
      .collection('/pages')
      .doc(pageId)
      .collection('/threads')

/**
 * Get the data for page by href
 *
 * @param {string} href - The href ID to get data
 * @returns {Object} The page document
 */
export const get = (ctx) => new Promise((resolve, reject) => {
  threadsRef(ctx)
    .get()
    .then(res => {
      const threads = []
      res.forEach(thread => threads.push({ ...thread.data(), id: thread.id }))
      resolve(threads)
    })
    .catch(err => reject(err))
})

export const create = (ctx, data) =>
  data.id
    ? threadsRef(ctx)
      .doc(data.id)
      .set({
        ...data,
        created: new Date().toISOString()
      })
    : threadsRef(ctx)
      .add({
        ...data,
        created: new Date().toISOString()
      })

export const update = (ctx, data) => threadsRef(ctx)
  .doc(ctx.threadId)
  .update({
    ...data,
    updated: new Date().toISOString()
  })

export const del = (ctx) => threadsRef(ctx)
  .doc(ctx.threadId)
  .delete()

export const onChange = (ctx, cb) => threadsRef(ctx)
  .orderBy('created', 'asc')
  .onSnapshot(cb)
