import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Card } from './card.jsx'
import { Button } from './button.jsx'
import { Input } from './input.jsx'
import { Comment } from './comment.jsx'

import './comment-card.css'

const { useState, useEffect } = React
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

      <AnimatePresence>
        {
          comment.length > 0 && (
            <motion.div
              style={{ overflowY: 'hidden' }}
              animate={{ height: 48 + 8 }}
              initial={{ height: 0 }}
              exit={{ height: 0 }}
            >
              <Button
                type='submit'
                variant='primary'
              >
                {submit}
              </Button>
            </motion.div>
          )
        }
      </AnimatePresence>
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
        .map(({ user, created, content }, i) => (
          <div key={`comment-${i}`}>
            <Comment
              img={user.avatar}
              title={user.name}
              subtitle={created}
            />

            {[]
              .concat(content)
              .map(c => (
                <p className='t t__sm'>
                  {c}
                </p>
              ))
            }

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
  onCommentsChange = Promise.reject,
  onSubmit = _ => _
}) => {
  const [state, setState] = useState(states.COMMENT)
  const [comments, setComments] = useState([])

  useEffect(() =>
    onCommentsChange(
      comments => {
        setComments(comments)
        setState(
          comments.length === 0
            ? states.COMMENT
            : states.THREAD
        )
      }),
    [])

  return (
    <Card className='commentcard'>
      {state === states.THREAD && <WithComments onSubmit={onSubmit} comments={comments} />}
      {state === states.COMMENT && <NoComments onSubmit={onSubmit} />}
    </Card>
  )
}
