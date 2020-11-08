import * as React from 'react'
import * as ReactDOM from 'react-dom'

import '../common/root.css'

import { motion } from 'framer-motion'

import * as Pages from './api/page'
import * as Threads from './api/thread'

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

const database = {
  users: {
    1: {
      name: 'Dom Charlesworth',
      avatar: 'https://www.gravatar.com/avatar/f99d8cfd0a3bcd46ff2076bc75c1586f'
    },
    2: {
      name: 'Chris Underdown',
      avatar: 'https://www.gravatar.com/avatar/942819acb8e9ec4ef8f50d9732629611'
    },
    3: {
      name: 'Kathrine Goyette',
      avatar: ''
    }
  },
  comments: {
    1: {
      user: 2,
      time: '2020-11-06T08:49:35.869Z',
      content: 'Can we reduce the spacing here',
    },
    2: {
      user: 1,
      time: '2020-11-06T09:19:35.869Z',
      content: '@Kathrine can you raise this with the team?',
    },
    3: {
      user: 3,
      time: '2020-11-06T09:22:35.869Z',
      content: 'I\'ve added it to the board 😀',
    }
  },
  pages: {
    'https://www.google.com/': {
      conversations: [
        {
          pageX: 50,
          pageY: 320,
          viewPort: 1054,
          comments: [1, 2, 3]
        },
        {
          pageX: 980,
          pageY: 520,
          viewPort: 1054,
          comments: [1, 2, 3]
        },
        {
          pageX: 180,
          pageY: 1220,
          viewPort: 1054,
          comments: [1, 2, 3]
        }
      ]
    }
  }
}

const Login = () => {
  const [db] = React.useState(database)

  const [me, setMe] = React.useState()
  const [page, setPage] = React.useState({})

  const [__page] = React.useState(db.pages[window.location.href] || {})
  const [__conversations, setConversations] = React.useState(__page.conversations || [])
  const [__comments, setComments] = React.useState(db.comments || [])

  const [state, setState] = React.useState(false)

  React.useEffect(() => {
    Pages
      .get(window.location.href)
      .then(setPage)

    chrome
      .runtime
      .sendMessage({ type: 'GET_USER' }, user => setMe(user))
  }, [])

  return (
    <div>
      {state && (
        <div
          onMouseDown={e => {
            const { pageX, pageY } = e
            const { outerWidth } = window
            setConversations(
              __conversations.concat({
                pageX,
                pageY,
                viewPort: outerWidth,
                comments: []
              })
            )
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
          {!state && 'View mode'}
          {state && 'Edit mode'}
        </p>
        <Toggle
          initial={state}
          onToggle={() => setState(!state)}
        />
      </Card>

      {
        __conversations
          .map(({ pageX, pageY, viewPort, comments }, i) => {
            return (
              <Bubble
                x={normalise(pageX, viewPort)}
                y={pageY}
                delay={i / 5}
                key={i}
              >
                <CommentCard
                  onSubmit={content => {
                    const commentId = '123123123'
                    const comment = {
                      time: (new Date()).toISOString(),
                      content,
                      user: 1
                    }

                    setComments({
                      ...__comments,
                      [commentId]: comment
                    })

                    setConversations(
                      __conversations.map((c, j) => {
                        if (i !== j) return c
                        return { ...c, comments: c.comments.concat(commentId) }
                      })
                    )
                  }}
                  comments={
                    comments
                      .map(i => __comments[i])
                      .reduce((acc, it) => {
                        /**
                         * TODO: Tidy this up but essentially group consecutive
                         * user comments together into a single "comment"
                         */
                        const front = acc.slice(0, -1)
                        const [last] = acc.slice(-1)

                        if (!last) return acc.concat(it)
                        if (last.user !== it.user) return acc.concat(it)

                        const content = []
                              .concat(last.content)
                              .concat(it.content)

                        return front.concat({ ...it, content })
                      }, [])
                      .map(({ user, ...o }) => ({
                        ...o,
                        user: db.users[user]
                      }))
                  }
                />
              </Bubble>
            )
          })
      }
    </div>
  )
}

const states = {
  VIEW: 'view',
  EDIT: 'edit'
}

const ContentV2 = () => {
  const [state, setState] = React.useState(states.VIEW)
  const [initThreads, setInitThreads] = React.useState(true)

  const [me, setMe] = React.useState({})
  const [page, setPage] = React.useState({})
  const [threads, setThreads] = React.useState([])

  console.log('threads', threads)
  console.log('initThreads', initThreads)

  React.useEffect(() => {
  })

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

        if (initThreads) {
          setTimeout(() => setInitThreads(false), snap.docs.length * 100)
        }
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

            Threads.create(page.id, thread)
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
            .map(({ pageX, pageY, pageWidth, id }, i) => {
              return (
                <Bubble
                  onClick={_ => {
                    Threads.del(page.id, id)
                  }}
                  delay={initThreads ? i / 10 : 0}
                  x={normalise(pageX, pageWidth)}
                  y={pageY}
                  key={id}
                />
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
