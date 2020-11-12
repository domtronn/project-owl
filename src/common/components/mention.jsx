import * as React from 'react'

import Linkify from 'react-linkify'
import { ProfileImg } from './profile-img'

import './mention.css'

export const Mention = ({
  isFocused,
  searchValue,
  mention: { name, avatar },

  ...rest
}) => {
  const re = new RegExp(`(${searchValue})`, 'i')
  const [match] = re.exec(name) || []
  const [pre,, ...post] = name.split(re)

  return (
    <div
      {...rest}
      className={isFocused ? 'mention mention--focused' : 'mention'}
    >
      <ProfileImg
        src={avatar}
        size='sm'
      />
      <p>
        <span className='t t--grey'>{pre}</span>
        <span className='t t--primary'>{match}</span>
        <span className='t t--grey'>{post.join('')}</span>
      </p>
    </div>
  )
}

const Link = ({ children }) => (
  <Linkify
    componentDecorator={(decoratedHref, decoratedText, key) => (
      <a
        className='l l--embed'
        target='blank'
        rel='noopener noreferrer'
        href={decoratedHref}
        key={key}
      >
        {decoratedText}
      </a>
    )}
  >
    {children}
  </Linkify>
)

export const ParseComment = ({
  content,
  title,
  highlight = 't--primary',
  users,
  ...rest
}) => {
  const split = (content || '').split(/(\[\[:mention:\]\[.*?\]\])/g)

  const TitleWrapper = title
        ? ({ titleF, children }) => <span title={titleF()}>{children}</span>
        : ({ children }) => <>{children}</>

  if (split.length === 1) {
    return (
      <TitleWrapper titleF={_ => title}>
        <p {...rest}><Link>{split[0]}</Link></p>
      </TitleWrapper>
    )
  }

  return (
    <TitleWrapper
      titleF={_ => split.reduce((acc, it) => {
        const [, user] = /^\[\[:mention:\]\[(.*?)\]\]$/.exec(it) || []
        return user
          ? acc + '@' + ((users[user] || {}).name || 'Anonymous')
          : acc + it
      }, '')}
    >
      <p {...rest}>
        {
          split.map((c, j) => {
            const [, user] = /^\[\[:mention:\]\[(.*?)\]\]$/.exec(c) || []

            if (!c.length) return null
            if (!user) return <Link key={j}>{c}</Link>
            return (
              <span data-uid={user} key={j} className={`t ${highlight}`}>
                <span className={`t t--bold ${highlight}-faded`}>@</span>{(users[user] || {}).name || 'Anonymous'}
              </span>
            )
          })
        }
      </p>
    </TitleWrapper>
  )
}
