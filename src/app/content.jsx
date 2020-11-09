/* global chrome */
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import '../common/root.css'

import { v4 as uuid } from 'uuid'
import { motion } from 'framer-motion'

import { Bubble } from '../common/components/bubble'
import { Card } from '../common/components/card'
import { Toggle } from '../common/components/toggle'

import CommentCard from '../common/components/comment-card'

import sw from './utils/switch'

const normalise = (x, viewport) => {
  const diff = viewport - window.outerWidth
  return x - (diff / 2)
}

const TEAM_ID = 'lh17L5cm5ql8mJINikns'
const states = {
  VIEW: 'view',
  EDIT: 'edit'
}

const ContentV2 = () => {
  const [state, setState] = React.useState(states.VIEW)

  const [team, setTeam] = React.useState({ id: TEAM_ID })

  const [me, setMe] = React.useState({})
  const [page, setPage] = React.useState({})
  const [users, setUsers] = React.useState({})

  const [initThreads, setInitThreads] = React.useState(true)
  const [currThread, setCurrThread] = React.useState()

  const baseCtx = {
    teamId: team.id,
    pageId: page.id,
    userId: me.uid
  }

  console.log('------------------------------')
  console.log('ctx//', baseCtx)
  console.log('page//', page)
  console.log('me//', me)
  console.log('users//', users)
  console.log('team//', team)

  /** Listen to change events */
  React.useEffect(() => {
    chrome
      .runtime
      .onMessage
      .addListener(({ type, ...data }) => sw({
        PUB_USER: ({ user }) => setMe(user || {}),
        PUB_PAGE: ({ page }) => setPage(page || {}),
        PUB_TEAM: ({ users, team }) => {
          setTeam(team || {})
          setUsers(users || {})
        }
      })(type, data))
  }, [])

  /** Set timeout to animate in thread bubbles */
  React.useEffect(() => {
    if (!page.id) return
    if (!initThreads) return

    const timeoutId = setTimeout(() => setInitThreads(false), Object.keys(page.threads || {}).length * 100)
    return () => clearTimeout(timeoutId)
  }, [page.id])

  /** Don't activate if user logged out or page not present */
  if (!page.id || !me.uid) return null

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

            setPage({
              ...page,
              threads: {
                ...page.threads,
                [thread.id]: thread
              }
            })
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
        Object
          .values(page.threads || {})
          .map(({ id, ...threadData }, i) => {
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
                  onSubmit={content => {
                    const type = threadData.created
                          ? 'ADD_COMMENT'
                          : 'CREATE_THREAD'

                    chrome
                      .runtime
                      .sendMessage({
                        type,
                        ctx: baseCtx,
                        threadData: { id, ...threadData },
                        commentData: { content, user: me.uid }
                      })
                  }}

                  comments={
                    (page.threads[id].comments || [])
                      .map(doc => {
                        const { user, ...data } = doc
                        return {
                          ...data,
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
                  }
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
