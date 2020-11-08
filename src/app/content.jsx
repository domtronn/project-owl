/* global chrome */
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import '../common/root.css'

import { firebase } from '../common/firebase'
import 'firebase/auth'

import { v4 as uuid } from 'uuid'
import { motion } from 'framer-motion'

import sw from './utils/switch'
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

const TEAM_ID = 'lh17L5cm5ql8mJINikns'
const users = {}
const states = {
  VIEW: 'view',
  EDIT: 'edit'
}

const ContentV2 = () => {
  const [state, setState] = React.useState(states.VIEW)

  const [team] = React.useState({ id: TEAM_ID })

  const [me, setMe] = React.useState({})
  const [page, setPage] = React.useState({})
  const [threads, setThreads] = React.useState([])
  const [comments, setComments] = React.useState({})

  const [initThreads, setInitThreads] = React.useState(true)
  const [currThread, setCurrThread] = React.useState()

  const baseCtx = {
    teamId: team.id,
    pageId: page.id,
    userId: me.uid
  }

  React.useEffect(() =>
    chrome
      .runtime
      .onMessage
      .addListener(({ type, ...msg }) => sw({
        AUTH_CHANGE: ({ user }) => setMe(user),
        GET_PAGE_SUCCESS: ({ page }) => setPage(page || {}),
        PUB_THREADS: ({ threads }) => {
          setThreads(threads || [])
          initThreads && setTimeout(() => setInitThreads(false), threads.length * 100)
        },

        PUB_COMMENTS: ({ comments: c, threadId }) => {
          setComments({
            ...comments,
            [threadId]: c
          })
        },

        default: () => console.log('Got unknown message', type, msg)
      })(type, msg)),
    []
  )

  React.useEffect(() => {
    if (!me.uid) return

    chrome.runtime.sendMessage({
      type: 'GET_PAGE',
      ctx: baseCtx,
      href: window.location.href
    })
  }, [me.uid])

  React.useEffect(() => {
    if (!page.id) return

    chrome.runtime.sendMessage({
      type: 'SUB_THREADS',
      ctx: baseCtx
    })
  }, [page.id])

  React.useEffect(() => {
    chrome
      .runtime
      .sendMessage({ type: 'GET_USER' }, user => setMe(user))
  }, [])

  if (!me || !me.uid) return null

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
                onClick={_ => {
                  setCurrThread(currThread === id ? null : id)
                }}
                isOpen={id === currThread}
                delay={initThreads ? i / 10 : 0}
                x={normalise(pageX, pageWidth)}
                y={pageY}
                key={id || `unknown--${i}`}
              >
                <CommentCard
                  onCommentsChange={cb => {
                    chrome
                      .runtime
                      .sendMessage({
                        type: 'SUB_COMMENTS',
                        ctx: { ...baseCtx, threadId: id }
                      })
                  }}

                  onSubmit={content => {
                    chrome
                      .runtime
                      .sendMessage({
                        type: 'INIT_THREAD',
                        ctx: { ...baseCtx, threadId: id },

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
