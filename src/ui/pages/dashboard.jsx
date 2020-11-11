/* global chrome */
import * as React from 'react'

import { ParseComment } from '../../common/components/mention'
import { Button } from '../../common/components/button'
import {
  FiMessageSquare as Message,
  FiExternalLink as Link
} from 'react-icons/fi'

import { Comment } from '../../common/components/comment'

import date from '../../app/utils/date'

const { useState, useEffect } = React

const focusTab = (url, onFocus, onMiss) =>
      chrome.tabs.query(({ url, currentWindow: true }), (tabs) => {
        const activeTab = tabs[0]

        if (!activeTab) return onMiss()

        chrome.tabs.update(activeTab.id, { active: true })
        onFocus(activeTab.id)
      })

export default ({ user }) => {
  const [ mentions, setMentions ] = useState([])

  useEffect(() => (
    chrome.runtime.sendMessage({ type: 'GET_MENTIONS' }, setMentions)
  ), [])

  if (!mentions.length) return null

  return (
    <>
      <h6>Quick links</h6>
      <ul>
        {
          mentions
            .map(({ href }, key) => (
              <li
                key={key}
              >
                <a
                  key={key}
                  onClick={_ => {
                    focusTab(
                      href,
                      _ => _,
                      _ => chrome.tabs.create({ url: href })
                    )
                  }}
                >
                  <Link />
                  {href}
                </a>
              </li>
            ))
        }
      </ul>

      <h6>Mentions</h6>
      <ul>
        {
          mentions
            .map(({ href, content, created, threadId, ...mention }, i) => (
              <li key={i}>
                <Comment
                  size='sm'
                  img={mention.user.avatar}
                  title={() => <p><b>{mention.user.name}</b> mentioned you</p>}
                  subtitle={date(created).calendar() + ' · ' + (
                    href.length > 25
                      ? href.slice(0, 12) + '...'
                      : href
                  )}
                />

                <ParseComment
                  className='t__snippet t__xs t--light'
                  highlight='t--grey'
                  users={{ [user.uid]: user }}
                  content={content}
                />

                <Button
                  style={{ marginTop: 8, marginLeft: 'auto', marginRight: 0 }}
                  onClick={_ => {
                    focusTab(
                      href,
                      tabId => chrome.tabs.sendMessage(tabId, { type: 'OPEN_THREAD', id: threadId }),
                      _ => chrome.runtime.sendMessage({ type: 'NEW_OPEN_THREAD', url: href, id: threadId })
                    )
                  }}
                  size='sm'
                >
                  <Message/> Reply
                </Button>
              </li>
            ))}
      </ul>
    </>
  )
}
