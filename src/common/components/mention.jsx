import * as React from 'react'
import './mention.css'

const FALLBACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'

export const Mention = ({
  isFocused,
  searchValue,
  mention: { name, avatar = FALLBACK_IMG }
}) => {
  const [pre, post] = name.split(searchValue)

  return (
    <div className={isFocused ? 'mention mention--focused' : 'mention'}>
      <img
        src={avatar}
        onError={e => {
          if (e.target.src === FALLBACK_IMG) return
          e.target.onerror = null
          e.target.src = FALLBACK_IMG
        }}
      />
      <p>
        <span className='t t--grey'>{pre}</span>
        <span className='t t--primary'>{searchValue}</span>
        <span className='t t--grey'>{post}</span>
      </p>
    </div>
  )
}

export const ParseComment = ({ content: c, users }) => {
  const split = (c || '').split(/(\[\[:mention:\]\[.*?\]\])/g)

  if (split.length === 1) return <p>{split}</p>
  return (
    <p>
      {
        split.map((c, j) => {
          const [, user] = /^\[\[:mention:\]\[(.*?)\]\]$/.exec(c) || []

          if (!user) return c
          return (
            <span data-uid={user} key={j} className='t t--primary'>
              @{(users[user] || {}).name || 'Anonymous'}
            </span>
          )
        })
      }
    </p>
  )
}
