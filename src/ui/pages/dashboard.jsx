/* global chrome */
import * as React from 'react'

import { ParseComment } from '../../common/components/mention'

const { useState, useEffect } = React
const mentions = [
  'b1767cd1-e040-4d50-b155-9f8d3676f4aa'
]

export default ({ user }) => {
  const [ mentions, setMentions ] = useState([])

  useEffect(() => (
    chrome.runtime.sendMessage({ type: 'GET_MENTIONS' }, setMentions)
  ))

  if (!mentions.length) return null

  return (
    <>
      <h5>Your mentions</h5>
      {
        mentions
          .filter(([ , threads ]) => threads.length)
          .map(([ href, threads ]) => (
            <>
              <h6>{href}</h6>
              <ul>
                {threads.map(([ id, mention ], i) => (
                  <li
                    key={i}
                    onClick={_ => {
                      chrome.tabs.query({ url: href }, tabs => {
                        if (tabs.length) {
                          chrome.tabs.update(tabs[0].id, { selected: true })
                          chrome.tabs.sendMessage(tabs[0].id, { type: 'OPEN_THREAD', id })
                        } else {
                          chrome.runtime.sendMessage({ type: 'NEW_OPEN_THREAD', url: href, id })
                        }
                      })
                    }}
                  >
                    <ParseComment
                      users={{ [user.uid]: user }}
                      content={mention.content}
                    />
                  </li>
                ))}
              </ul>
            </>
          ))
      }
    </>
  )
}
