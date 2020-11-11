import * as React from 'react'
import './profile-img.css'

const FALLBACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'

export const ProfileImg = ({
  size,
  className = '',
  src = FALLBACK_IMG,
  ...rest
}) => (
  <img
    className={[className, (size ? `pimg pimg--${size}` : 'pimg')].filter(i => i).join(' ')}
    src={src}
    onError={e => {
      if (e.target.src === FALLBACK_IMG) return
      e.target.onerror = null
      e.target.src = FALLBACK_IMG
    }}
    {...rest}
  />
)
