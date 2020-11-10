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
