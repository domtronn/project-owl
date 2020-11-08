/** global chrome */
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import '../common/root.css'

import { firebase } from '../common/firebase'
import 'firebase/auth'

import { v4 as uuid } from 'uuid'
import { motion } from 'framer-motion'

import * as Pages from './api/page'
import * as Threads from './api/thread'
import * as Comments from './api/comment'

import { Bubble } from '../common/components/bubble'
import { Card } from '../common/components/card'
import { Toggle } from '../common/components/toggle'

import CommentCard from '../common/components/comment-card'

const normalise = (x, viewport) => {
  const diff = viewport - window.outerWidth
  return x - (diff / 2)
}

chrome.runtime.sendMessage({}, (response) => {
  var checkReady = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(checkReady)
      console.log('We\'re in the injected content script!')
    }
  })
})

const TEAM_ID = 'lh17L5cm5ql8mJINikns'
const states = {
  VIEW: 'view',
  EDIT: 'edit'
}

const users = {
}

const ContentV2 = () => {
  const [state, setState] = React.useState(states.VIEW)

  const [team] = React.useState({ id: TEAM_ID })

  const [me, setMe] = React.useState({})
  const [page, setPage] = React.useState({})
  const [threads, setThreads] = React.useState([])

  const [initThreads, setInitThreads] = React.useState(true)
  const [currThread, setCurrThread] = React.useState()

  const baseCtx = {
    teamId: team.id,
    pageId: page.id,
    userId: me.uid
  }

  /** Load and sign in user */
  React.useEffect(() => {
    chrome
      .runtime
      .sendMessage({ type: 'GOOGLE_AUTH_USER' })

    chrome
      .runtime
      .onMessage
      .addListener(({ type, token }) => {
        if (type !== 'GOOGLE_USER') return

        const cred = firebase
              .auth
              .GoogleAuthProvider
              .credential(null, token)

        firebase
          .auth()
          .signInWithCredential(cred)
          .then(() => {
            const user = firebase
                  .auth()
                  .currentUser

            setMe(user)
          })
      })
  }, [])

  /** Load page data for current page */
  React.useEffect(() => {
    if (!me.uid) return

    Pages
      .get(baseCtx, window.location.href)
      .then(page => setPage(page || {}))
      .catch(err => console.error(err))
  }, [me.uid])

  /** Load thread data for current page */
  React.useEffect(() => {
    if (!page.id) return

    const unsubscribe = Threads
      .onChange(baseCtx, snap => {
        setThreads(snap.docs.map((doc, i) => ({
          id: doc.id,
          ...doc.data()
        })))

        if (initThreads) setTimeout(() => setInitThreads(false), snap.docs.length * 100)
      })

    return unsubscribe
  }, [page.id])

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.5 }
        }
      }}
      initial='hidden'
      animate='show'
    >

      {state === states.EDIT && (
        <div
          onMouseDown={e => {
            const { pageX, pageY } = e
            const { outerWidth } = window
            const thread = {
              id: uuid(),
              pageId: page.id,
              pageWidth: outerWidth,
              pageX,
              pageY
            }

            setThreads(threads.concat({ ...thread }))
            setCurrThread(thread.id)
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'copy'
          }}
        />
      )}

      <Card
        style={{
          position: 'fixed',
          right: '32px',
          bottom: '32px'
        }}
      >
        <p style={{ marginBottom: 8 }}>
          {state === states.VIEW && 'View mode'}
          {state === states.EDIT && 'Edit mode'}
        </p>
        <Toggle
          initial={state === state.EDIT}
          onToggle={() => setState(
            state === states.EDIT
              ? states.VIEW
              : states.EDIT
          )}
        />
      </Card>

      {
        threads
          .map(({ init, id, ...threadData }, i) => {
            const { pageX, pageY, pageWidth } = threadData
            return (
              <Bubble
                onClick={_ => setCurrThread(currThread === id ? null : id)}
                isOpen={id === currThread}
                delay={initThreads ? i / 10 : 0}
                x={normalise(pageX, pageWidth)}
                y={pageY}
                key={id || `unknown--${i}`}
              >
                <CommentCard
                  onCommentsChange={cb => {
                    return Comments
                      .onChange({ ...baseCtx, threadId: id }, snap => {
                        cb(
                          snap
                            .docs
                            .map(doc => {
                              const { id } = doc
                              const { user, ...data } = doc.data()

                              return {
                                ...data,
                                id,
                                userId: user,
                                user: users[user] || {
                                  name: 'Anonymous'
                                }
                              }
                            })
                            .reduce((acc, doc) => {
                              const front = acc.slice(0, -1)
                              const [last] = acc.slice(-1)

                              if (!last) return acc.concat(doc)
                              if (last.userId !== doc.userId) return acc.concat(doc)

                              const content = []
                                .concat(last.content)
                                .concat(doc.content)

                              return front.concat({ ...doc, content })
                            }, [])
                        )
                      })
                  }}

                  onSubmit={content => {
                    const threadPromise = !threadData.created
                      ? Threads.create(baseCtx, threadData)
                      : Promise.resolve({ id })

                    threadPromise
                      .catch(err => console.error(err))
                      .then(thread => {
                        debugger
                        Comments
                          .create(
                            { ...baseCtx, threadId: thread.id },
                            {
                              content,
                              user: me.uid
                            }
                          )
                      })
                  }}
                />
              </Bubble>
            )
          })
      }

    </motion.div>
  )
}

// --------------
const mountId = 'COMMENTABLE_MOUNT'
if (!document.getElementById(mountId)) {
  const mountNode = document.createElement('div')
  mountNode.setAttribute('id', mountId)
  mountNode.classList.add('commentable')

  document
    .getElementsByTagName('body')[0]
    .appendChild(mountNode)
}

ReactDOM.render(
  <ContentV2 />,
  document.getElementById(mountId)
)
