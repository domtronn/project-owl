import * as React from 'react'

import { Card } from './card.jsx'
import { Button } from './button.jsx'
import { Input } from './input.jsx'
import { Comment } from './comment.jsx'

import sw from '../../app/utils/switch'
import AnimWrapper from '../helpers/anim-wrapper'

import {
  FiCheckCircle as CheckCircle,
  FiLock as Lock,
  FiUnlock as Unlock,
  FiMoreVertical as More,
  FiTrash2 as Delete,
  FiXCircle as Close,
} from 'react-icons/fi'

import './comment-card.css'

const { useState } = React

const IconLink = ({ Icon = _ => null, onClick, children }) => (
  <li>
    <a
      onClick={onClick}
      className='l l--secondary'
    >
  <Icon style={{ marginBottom: -2, marginRight: 6 }} />
      {children}
    </a>
  </li>
)

const ChatForm = ({
  onSubmit,
  placeholder,
  submit
}) => {
  const [comment, setComment] = useState('')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setComment('')
        onSubmit(comment)
      }}
    >
      <Input
        autoFocus
        type='text'
        name='comment'
        placeholder={`${placeholder.replace(/\.\.\.$/, '')}`}
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      <AnimWrapper
        condition={comment.length > 0}
      >
        <Button
          type='submit'
          variant='primary'
        >
          {submit}
        </Button>
      </AnimWrapper>
    </form>
  )
}

const NoComments = ({ onSubmit }) => (
  <ChatForm
    submit='Post'
    onSubmit={onSubmit}
    placeholder='Write a comment'
  />
)

const Comments = ({ comments, resolved }) =>
      comments
      .map(({ user, created, displayDate, displayText, content }, i) => (
        <div
          key={`comment-${i}`}
          className={
            [
              'commentcard__comment',
              resolved && 'commentcard__comment--resolved'
            ].filter(i => i).join(' ')
          }
        >
          <Comment
            img={user.avatar}
            title={user.name}
            subtitle={displayText || created}
            subtitleHover={displayDate}
          />

          {[]
           .concat(content)
           .map((c, i) => (
             <p key={i} className='t t__sm'>
               {c}
             </p>
           ))}

          {i !== comments.length - 1 && <hr />}
        </div>
      ))

const WithComments = ({
  comments,
  onSubmit,
  onResolve,
  onDelete
}) => (
  <>
    <a
      className='commentcard__resolve'
      onClick={onResolve}
    >
      <CheckCircle />
      Resolve
    </a>

    <MoreMenu>
      <IconLink Icon={CheckCircle} onClick={onResolve}>Resolve</IconLink>
      <IconLink Icon={Delete} onClick={onDelete}>Delete</IconLink>
    </MoreMenu>

    <Comments comments={comments} />

    <ChatForm
      submit='Post'
      onSubmit={onSubmit}
      placeholder='Reply'
    />
  </>
)

const MoreMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [closeTimeout, setCloseTimeout] = useState()

  React.useEffect(() => setCloseTimeout(
    setTimeout(() => setIsOpen(false), 5000)
  ), [])

  return (
    <>
      <More
        onClick={_ => setIsOpen(!isOpen)}
        className='commentcard__more'
      />
      <AnimWrapper
        className='commentcard__more__content'
        condition={isOpen}
        style={{ overflow: 'visible' }}

        onMouseEnter={_ => clearTimeout(closeTimeout)}
        onMouseLeave={_ => setCloseTimeout(
          setTimeout(() => setIsOpen(false), 500)
        )}
      >
        <Card>
          <ul>
            {children}
            <IconLink Icon={Close} onClick={_ => setIsOpen(false)}>Close</IconLink>
          </ul>
        </Card>
      </AnimWrapper>
    </>
  )}

const Resolved = ({
  comments,
  resolver,
  onUnresolve,
  onSubmit,
  onDelete,
}) => (
  <>
    <span
      className='commentcard__resolve'
      title={`Resolved ${resolver.atText.toLowerCase()} by ${resolver.name}`}
    >
      <Lock />
      Resolved
    </span>

    <MoreMenu>
      <IconLink Icon={Unlock} onClick={onUnresolve}>Reopen</IconLink>
      <IconLink Icon={Delete} onClick={onDelete}>Delete</IconLink>
    </MoreMenu>

    <Comments
      comments={comments}
      resolved
    />

    {resolver && (
      <div className='commentcard__resolved' >
        <span title={resolver.atDate} >
          Resolved {resolver.atText.toLowerCase()} by <b>{resolver.name}</b>
        </span>
      </div>
    )}

    <Button
      size='md'
      onClick={onUnresolve}
    >
      <Unlock
        style={{
          width: 12,
          height: 12,
          margin: '0 6px -2px -18px'
        }}
      /> Reopen this thread
    </Button>
  </>
)

export default ({
  resolver,
  resolved = false,
  comments = [],
  onSubmit = _ => _,
  onResolve = _ => _,
  onUnresolve = _ => _,
  onDelete = _ => _,
}) => {
  const cn = resolved
        ? 'commentcard commentcard--resolved'
        : 'commentcard'

  return (
    <Card className={cn}>
      {sw({
        [comments.length === 0]: () => <NoComments onSubmit={onSubmit} />,
        [comments.length > 0]: () => <WithComments onResolve={onResolve} onDelete={onDelete} onSubmit={onSubmit} comments={comments} />,
        [!!resolved]: () => <Resolved onUnresolve={onUnresolve} onDelete={onDelete} comments={comments} resolver={resolver} />,
      })(true)}
    </Card>
  )
}
