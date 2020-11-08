import { firebase } from '../../common/firebase'

import 'firebase/firestore'

const threadsRef = pageId => firebase
      .firestore()
      .collection('/pages')
      .doc(pageId)
      .collection('/threads')

/**
 * Get the data for page by href
 *
 * @param {string} href - The href ID to get data
 * @returns {Object} The page document
 */
export const get = (pageId) => new Promise((resolve, reject) => {
  threadsRef(pageId)
    .get()
    .then(res => {
      const threads = []
      res.forEach(thread => threads.push({ ...thread.data(), id: thread.id }))
      resolve(threads)
    })
    .catch(err => reject(err))
})

export const create = (pageId, data) =>
  data.id
    ? threadsRef(pageId)
      .doc(data.id)
      .set({
        ...data,
        created: new Date().toISOString()
      })
    : threadsRef(pageId)
      .add({
        ...data,
        created: new Date().toISOString()
      })

export const update = (pageId, threadId, data) => threadsRef(pageId)
  .doc(threadId)
  .update({
    ...data,
    updated: new Date().toISOString()
  })

export const del = (pageId, threadId) => threadsRef(pageId)
  .doc(threadId)
  .delete()

export const onChange = (pageId, cb) => threadsRef(pageId)
  .orderBy('created', 'asc')
  .onSnapshot(cb)
