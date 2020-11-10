import * as React from 'react'

import { Card } from './card.jsx'
import { Button } from './button.jsx'
import { Input } from './input.jsx'
import { Comment } from './comment.jsx'

import sw from '../../app/utils/switch'
import AnimWrapper from '../helpers/anim-wrapper'

import { FiCheckCircle as CheckCircle, FiLock as Lock } from 'react-icons/fi'

import './comment-card.css'

const ChatForm = ({
  onSubmit,
  placeholder,
  submit
}) => {
  const [comment, setComment] = React.useState('')

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

const WithComments = ({ comments, onSubmit, onResolve }) => (
  <>
    <a
      className='commentcard__resolve'
      onClick={onResolve}
    >
      <CheckCircle />
      Resolve
    </a>

    <Comments comments={comments} />

    <ChatForm
      submit='Post'
      onSubmit={onSubmit}
      placeholder='Reply'
    />
  </>
)

const Resolved = ({ comments, resolver, onUnresolve, onSubmit }) => (
  <>
    <span className='commentcard__resolve'>
      <Lock />
      Resolved
    </span>

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
      Unresolve this thread
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
