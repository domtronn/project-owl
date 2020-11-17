/* global chrome */
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import '../common/root.css'

import { v4 as uuid } from 'uuid'
import { motion } from 'framer-motion'

import { Bubble } from '../common/components/bubble'
import { Button } from '../common/components/button'
import { Card } from '../common/components/card'
import { Toggle } from '../common/components/toggle'

import CommentCard from '../common/components/comment-card'

import { UsersProvider } from '../common/providers/users-provider'

import sw from './utils/switch'
import date from './utils/date'

const normalise = (x, viewport) => {
  const diff = viewport - window.outerWidth
  return x - (diff / 2)
}

const { useState, useEffect, useLayoutEffect } = React
const { sendMessage, onMessage } = chrome.runtime

const states = {
  VIEW: 'view',
  EDIT: 'edit'
}

const ContentV2 = () => {
  const [state, setState] = useState(states.VIEW)
  const [size, setSize] = useState([window.outerWidth, window.outerHeight])

  const [team, setTeam] = useState({})

  const [me, setMe] = useState({})
  const [page, setPage] = useState({})
  const [users, setUsers] = useState({})

  const [initThreads, setInitThreads] = useState(true)
  const [currThread, setCurrThread] = useState()

  // TODO: static bubble
  // const staticBubbleRef = useRef(null)

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
  useEffect(() => {
    const handleMessage = function ({ type, ...data }) {
      return sw({
        PUB_USER: ({ user }) => {
          console.log('setUser', new Date())
          setMe(user || {})
        },
        PUB_PAGE: ({ page }) => {
          console.log('setPage', new Date())
          setPage(page || {})
        },
        PUB_TEAM: ({ users, team }) => {
          console.log('setTeam', new Date())
          setTeam(team || {})
          setUsers(users || {})
        },

        TOGGLE_MODE: () => {
          setState(
            state === states.EDIT
              ? states.VIEW
              : states.EDIT
          )
        },

        OPEN_THREAD: ({ id }) => {
          console.log('openThread', id)
          setCurrThread(id)
        }
      })(type, data)
    }

    onMessage.addListener(handleMessage)
    return () => onMessage.removeListener(handleMessage)
  }, [state])

  useEffect(() => {
    function setMousePos (e) { window.currMouse = [e.pageX, e.pageY] }
    document.addEventListener('mousemove', setMousePos)
    return () => document.removeEventListener('mousemove', setMousePos)
  }, [])

  useLayoutEffect(() => {
    function updateSize () {
      setSize([window.outerWidth, window.outerHeight])
    }

    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  })

  /** Load authenticated user data */
  useEffect(() => {
    // sendMessage({ type: 'GET_USER' }, ({ user, profile }) => setMe({ ...user, ...profile }))
    // sendMessage({ type: 'GET_TEAM' }, (team) => setTeam(team))
  }, [])

  /** Set timeout to animate in thread bubbles */
  useEffect(() => {
    if (!page.id) return
    if (!initThreads) return

    const timeoutId = setTimeout(() => setInitThreads(false), Object.keys(page.threads || {}).length * 100)
    return () => clearTimeout(timeoutId)
  }, [page.id])

  /** Don't activate if user logged out or page not present */
  if (!me.uid) return null
  if (!page.id) return null

  return (
    <UsersProvider value={users}>
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
          <>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}

              id='COMMENTABLE_ADD_BUBBLE'
              style={{
                position: 'absolute',
                top: (window.currMouse || [])[1],
                left: (window.currMouse || [])[0],
                zIndex: 0
              }}
            >
              <div
                className='bubble'
                style={{ transform: 'skew(-10deg)' }}
              />
            </motion.div>

            <div
              onMouseMove={e => {
                const el = document.getElementById('COMMENTABLE_ADD_BUBBLE')
                el.style.top = e.pageY + 'px'
                el.style.left = e.pageX + 'px'
              }}

              onMouseDown={e => {
                const { pageX, pageY } = e
                const thread = {
                  id: uuid(),
                  pageId: page.id,
                  pageWidth: size[0],
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
                setState(states.VIEW)
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
          </>
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
            initial={state === states.EDIT}
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
                  key={id || `unknown--${i}`}
                  onClick={_ => {
                    setCurrThread(currThread === id ? null : id)

                    if (!threadData.created) {
                      // FIXME: This only evaulates for the bubble you're clicked on not other bubble
                      // Thread has not been created so we should delete this from the page
                      const { threads } = page
                      delete threads[id]
                      setPage({ ...page, threads })
                    }
                  }}

                  isOpen={id === currThread}

                  resolved={threadData.resolved}
                  delay={initThreads ? i / 10 : 0}

                  x={normalise(pageX, pageWidth)}
                  y={pageY}
                >
                  <CommentCard
                    resolved={threadData.resolved}
                    resolver={
                      users[threadData.resolvedBy]
                        ? {
                          ...users[threadData.resolvedBy],
                          atText: date(threadData.resolvedAt).calendar(null, {
                            sameDay: '[Today at] h:mma'
                          }),
                          atDate: date(threadData.resolvedAt).format('ddd h:mm A, D MMM'),
                        }
                      : null
                    }

                    onDelete={_ => {
                      if (!window.confirm('Are you sure you want to delete this thread?\nThis action cannot be undone.')) return
                      sendMessage({ type: 'DELETE_THREAD', ctx: baseCtx, id })
                    }}

                    onUnresolve={_ => {
                      sendMessage({ type: 'UNRESOLVE_THREAD', ctx: baseCtx, id })
                    }}

                    onResolve={_ => {
                      sendMessage({ type: 'RESOLVE_THREAD', ctx: baseCtx, id })
                    }}

                    onSubmit={content => {
                      const type = threadData.created
                            ? 'ADD_COMMENT'
                            : 'CREATE_THREAD'

                      sendMessage({
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
                        .map(({ created, ...rest }) => ({
                          ...rest,
                          displayDate: date(created).format('ddd h:mm A, D MMM'),
                          displayText: date(created).calendar()
                        }))
                    }
                  />
                </Bubble>
              )
            })
        }
      </motion.div>
    </UsersProvider>
  )
}

// --------------
const mountId = 'COMMENTABLE_MOUNT'
if (!document.getElementById(mountId)) {
  const mountNode = document.createElement('div')
  mountNode.setAttribute('id', mountId)
  mountNode.classList.add('root__Y29tbWVudGFibGUx')

  document
    .getElementsByTagName('body')[0]
    .appendChild(mountNode)
}

ReactDOM.render(
  <ContentV2 />,
  document.getElementById(mountId)
)
