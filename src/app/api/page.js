import { firebase } from '../../common/firebase'

import 'firebase/firestore'

const pagesRef = ({ teamId }) => firebase
      .firestore()
      .collection('/teams')
      .doc(teamId)
      .collection('/pages')

/**
 * Get the data for page by href
 *
 * @param {string} href - The href ID to get data
 * @returns {Object} The page document
 */
export const get = (ctx, href) => new Promise((resolve, reject) => {
  pagesRef(ctx)
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

export const create = (ctx, data) => pagesRef(ctx)
  .add(data)

export const update = (ctx, data) => pagesRef(ctx)
  .doc(ctx.pageId)
  .update(data)

export const del = (ctx, pageId) => pagesRef(ctx)
  .doc(ctx.pageId)
  .delete()
