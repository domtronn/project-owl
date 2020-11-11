import * as React from 'react'

import './comment.css'

import { ProfileImg } from './profile-img'

export const Comment = ({
  img,
  size,
  title,
  subtitle,
  subtitleHover,
  ...rest
}) => (
  <div {...rest} className='comment'>
    <ProfileImg size={size} src={img} className='comment__img' />

    <div className='comment__content'>
      {
        typeof title === 'function'
          ? title()
          : <p>{title}</p>
      }
      {subtitle && <p><span title={subtitleHover || subtitle}>{subtitle}</span></p>}
    </div>
  </div>
)
