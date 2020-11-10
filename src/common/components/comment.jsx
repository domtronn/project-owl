import * as React from 'react'

import './comment.css'

const FALLBACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'

export const Comment = ({
  img = FALLBACK_IMG,
  title,
  subtitle,
  subtitleHover,
  ...rest
}) => (
  <div {...rest} className='comment'>
    <img
      className='comment__img'
      src={img}
      onError={e => {
        if (e.target.src === FALLBACK_IMG) return
        e.target.onerror = null
        e.target.src = FALLBACK_IMG
      }}
      alt={title}
    />
    <div className='comment__content'>
      <p>{title}</p>
      {subtitle && <p><span title={subtitleHover || subtitle}>{subtitle}</span></p>}
    </div>
  </div>
)
