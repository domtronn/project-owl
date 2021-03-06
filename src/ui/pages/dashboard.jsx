/* global chrome */
import * as React from 'react'

import { ParseComment } from '../../common/components/mention'
import { Button } from '../../common/components/button'
import {
  FiMessageSquare as Message,
  FiExternalLink as Link
} from 'react-icons/fi'

import { motion } from 'framer-motion'

import { Comment } from '../../common/components/comment'
import Skeleton from '../../common/components/skeleton'

import date from '../../app/utils/date'

/**
 * Skeleton definitions for loading states
 */
const LinkSkel = () => Array(3).fill().map((_, i) => (
  <li key={i} style={{ display: 'inline-flex', alignItems: 'center', width: '100%' }}>
    <Skeleton.Avatar size='xs' style={{ margin: '0 8px 0 0' }} />
    <Skeleton.Text width={190 + ((32 * (i + 1)) % 58)} size='sm' style={{ margin: 0 }} />
  </li>
))

const MentionSkel = ({ i = 1 }) => Array(2).fill().map((_, i) => (
  <>
    <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%' }}>
      <Skeleton.Avatar size='sm' style={{ marginRight: 6 }}/>
      <div>
        <Skeleton.Text width={190 + ((32 * (i + 1)) % 58)} size='md' style={{ margin: '4px 0' }} />
        <Skeleton.Text width={100 + ((32 * (i + 1)) % 58)} size='sm' style={{ margin: '4px 0' }} />
      </div>
    </div>
    <Skeleton.Text width='100%' size='sm' style={{ margin: 0 }} />
  </>
))

const { useState, useEffect } = React

const focusTab = (url, onFocus, onMiss) =>
      chrome.tabs.query(({ url, currentWindow: true }), (tabs) => {
        const activeTab = tabs[0]

        if (!activeTab) return onMiss()

        chrome.tabs.update(activeTab.id, { active: true })
        onFocus(activeTab.id)
      })

const animVariants = {
  visible: { y: 0, opacity: 1 },
  hidden: { y: 20, opacity: 0 }
}

const animTransition = {
  type: 'spring',
  stiffness: 500
}

const animProps = (delay) => ({
  initial: 'hidden',
  animate: 'visible',
  transition: { ...animTransition, delay: delay / 4 },
  variants: animVariants
})

export default ({ user = {}, team = {}, pages = [] }) => {
  const [mentions, setMentions] = useState([])

  useEffect(() => {
    if (!team || !team.id) return
    if (!user || !user.uid) return
    if (!pages.length) return

    chrome.runtime.sendMessage({ type: 'GET_MENTIONS' }, m => setMentions(m || []))
  }, [pages.length, user, team])

  if (!user || !user.uid) return null

  return (
    <motion.div>

      <motion.h6 {...animProps(0)}>Quick links</motion.h6>
      <motion.ul
        {...animProps(1)}
      >
        {
          pages === null
            ? <LinkSkel />
            : pages
            .map((href, key) => (
              <li
                key={key}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <span title={href}>
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
                </span>
              </li>
            ))
        }
      </motion.ul>

      <motion.h6 {...animProps(2)}>Mentions</motion.h6>
      <ul>
        {
          mentions === null
            ? <MentionSkel />
            : mentions
            .map(({ href, content, created, threadId, ...mention }, i) => (
              <motion.li
                {...animProps(3 + i)}
                key={i}
              >
                <Comment
                  size='sm'
                  img={mention.user.avatar}
                  title={() => <p><b>{mention.user.name}</b> mentioned you</p>}
                  subtitle={() => (
                    <p>
                      <span>{date(created).calendar()}</span>
                    </p>
                  )}
                />

                <ParseComment
                  className='t__snippet t__xs t--light'
                  highlight='t--grey'
                  users={{ [user.uid]: user }}
                  content={content}
                  title={content}
                />

                <Button
                  style={{ position: 'absolute', top: 8, right: 0 }}
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
              </motion.li>
            ))}
      </ul>

    </motion.div>
  )
}
