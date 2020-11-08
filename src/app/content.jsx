import * as React from 'react'
import * as ReactDOM from 'react-dom'

import '../common/root.css'

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
    if (document.readyState === "complete") {
      clearInterval(checkReady)
      console.log("We're in the injected content script!")
    }
  })
})

const states = {
  VIEW: 'view',
  EDIT: 'edit'
}

const users = {
}

const ContentV2 = () => {
  const [state, setState] = React.useState(states.VIEW)
  const [initThreads, setInitThreads] = React.useState(true)

  const [me, setMe] = React.useState({})
  const [page, setPage] = React.useState({})
  const [threads, setThreads] = React.useState([])

  React.useEffect(() => {
    Pages
      .get(window.location.href)
      .then(setPage)
  }, [])

  React.useEffect(() => {
    if (!page.id) return

    const unsubscribe = Threads
      .onChange(page.id, snap => {
        setThreads(snap.docs.map((doc, i) => ({
          id: doc.id,
          ...doc.data()
        })))

        if (initThreads) setTimeout(() => setInitThreads(false), snap.docs.length * 100)
      })

    return unsubscribe
  }, [page.id])

  React.useEffect(() => {
    chrome
      .runtime
      .sendMessage({ type: 'GET_USER' }, user => setMe(user))
  }, [])

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
              pageId: page.id,
              pageWidth: outerWidth,
              pageX,
              pageY,
            }

            setThreads(threads.concat({ ...thread, init: true }))
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
                isOpen={!!init}
                delay={initThreads ? i / 10 : 0}
                x={normalise(pageX, pageWidth)}
                y={pageY}
                key={id || `unknown--${i}`}
              >
                <CommentCard
                  onCommentsChange={cb => {
                    Comments
                      .onChange(page.id, id, snap => {
                        cb(
                          snap.docs.map(doc => {
                            const { id } = doc
                            const { user, ...data } = doc.data()

                            return {
                              ...data,
                              id,
                              user: users[user] || {
                                name: 'Anonymous'
                              }
                            }
                          })
                        )
                      })
                  }}

                  onSubmit={content => {
                    const threadPromise = init
                      ? Threads.create(page.id, threadData)
                      : Promise.resolve({ id })

                    threadPromise
                      .then(thread => {
                        Comments
                          .create(
                            page.id,
                            thread.id,
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
