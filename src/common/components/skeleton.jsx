import * as React from 'react'

import './skeleton.css'

export const SkeletonText = ({ size, style = {}, width = 'initial' }) => (
  <div
    style={{ ...style, width }}
    className={`s s__text ${size ? 's__text--' + size : ''}`}
  />
)

export const SkeletonAvatar = ({ size, style = {} }) => (
  <div
    style={style}
    className={`s s__avatar ${size ? 's__avatar--' + size : ''}`}
  />
)

export const SkeletonBlock = ({ style = {}, height = 'initial' }) => (
  <div style={{ ...style, height }} className='s s__block' />
)

export default {
  Block: SkeletonBlock,
  Avatar: SkeletonAvatar,
  Text: SkeletonText
}
