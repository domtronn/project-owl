import * as React from "react"
import * as ReactDOM from "react-dom"

import "../common/root.css"

import { Bubble } from '../common/components/bubble'
import { Card } from '../common/components/card'
import { Comment } from '../common/components/comment'
import { Toggle } from '../common/components/toggle'

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
          comments: [1, 2, 3]
        },
        {
          pageX: 980,
          pageY: 520,
          comments: [1, 2, 3]
        },
        {
          pageX: 180,
          pageY: 1220,
          comments: [1, 2, 3]
        }
      ]
    }
  }
}

const Login = () => {
  const [db, setDb] = React.useState(database)
  const [conversations, setConversations] = React.useState(db.pages['https://www.google.com/'].conversations)
  const [state, setState] = React.useState(false)

  console.log(conversations)

  return (
    <div>
      {state && (
        <div
          onMouseDown={e => {
            const { pageX, pageY } = e
            setConversations(
              conversations.concat({
                pageX, pageY, comments: []
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
        conversations
          .map(({ pageX, pageY, comments }, i) => {
            return (
              <Bubble
                x={pageX}
                y={pageY}
                delay={i / 5}
                key={i}
              >
                <Card>
                  {
                    comments
                      .map(i => db.comments[i])
                      .map(({ user, time, content }, i) => (
                        <>
                          <Comment
                            key={`comment-${i}`}
                            img={db.users[user].avatar}
                            title={db.users[user].name}
                            subtitle={time}
                          />
                          <p className='t t__sm'>
                            {content}
                          </p>
                          {i !== (comments.length - 1) && (
                            <hr />
                          )}
                        </>
                      ))
                  }
                </Card>
              </Bubble>
            )
          })
      }
    </div>
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
  <Login />,
  document.getElementById(mountId)
)
