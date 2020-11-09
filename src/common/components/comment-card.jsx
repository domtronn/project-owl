import * as React from 'react'

import { Card } from './card.jsx'
import { Button } from './button.jsx'
import { Input } from './input.jsx'
import { Comment } from './comment.jsx'

import AnimWrapper from '../helpers/anim-wrapper'

import './comment-card.css'

const states = {
  THREAD: 'thread',
  COMMENT: 'comment',
}

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

const WithComments = ({ comments, onSubmit }) => (
  <>
    {
      comments
        .map(({ user, created, displayDate, displayText, content }, i) => (
          <div key={`comment-${i}`}>
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
    }

    <ChatForm
      submit='Post'
      onSubmit={onSubmit}
      placeholder='Reply'
    />
  </>
)

export default ({
  comments = [],
  onSubmit = _ => _
}) => {
  const state = comments.length === 0
        ? states.COMMENT
        : states.THREAD

  return (
    <Card className='commentcard'>
      {state === states.THREAD && <WithComments onSubmit={onSubmit} comments={comments} />}
      {state === states.COMMENT && <NoComments onSubmit={onSubmit} />}
    </Card>
  )
}
