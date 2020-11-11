import * as React from 'react'
import './mention.css'

import { ProfileImg } from './profile-img'

export const Mention = ({
  isFocused,
  searchValue,
  mention: { name, avatar }
}) => {
  const re = new RegExp(searchValue, 'i')
  const [match] = re.exec(name) || []
  const [pre, post] = name.split(re)

  return (
    <div className={isFocused ? 'mention mention--focused' : 'mention'}>
      <ProfileImg
        src={avatar}
        size='sm'
      />
      <p>
        <span className='t t--grey'>{pre}</span>
        <span className='t t--primary'>{match}</span>
        <span className='t t--grey'>{post}</span>
      </p>
    </div>
  )
}

export const ParseComment = ({ content: c, highlight = 't--primary', users, ...rest }) => {
  const split = (c || '').split(/(\[\[:mention:\]\[.*?\]\])/g)

  if (split.length === 1) return <p {...rest}>{split}</p>
  return (
    <p {...rest}>
      {
        split.map((c, j) => {
          const [, user] = /^\[\[:mention:\]\[(.*?)\]\]$/.exec(c) || []

          if (!user) return c
          return (
            <span data-uid={user} key={j} className={`t ${highlight}`}>
              @{(users[user] || {}).name || 'Anonymous'}
            </span>
          )
        })
      }
    </p>
  )
}
