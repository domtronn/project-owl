import { firebase } from '../../common/firebase'

import 'firebase/firestore'

const pagesRef = firebase
      .firestore()
      .collection('/pages')

/**
 * Get the data for page by href
 *
 * @param {string} href - The href ID to get data
 * @returns {Object} The page document
 */
export const get = (href) => new Promise((resolve, reject) => {
  pagesRef
    .where('href', '==', href)
    .limit(1)
    .get()
    .then(res => {
      res.forEach(page => {
        resolve({ ...page.data(), id: page.id })
      })
    })
    .catch(err => reject(err))
})

export const create = (data) => pagesRef.add(data)
export const update = (pageId, data) => pagesRef
  .doc(pageId)
  .update(data)

export const del = (pageId) => pagesRef
  .doc(pageId)
  .delete()
