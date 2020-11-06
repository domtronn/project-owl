import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Card } from './card.tsx'
import { Button } from './button.tsx'
import { Input } from './input.tsx'
import { Comment } from './comment.tsx'

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
        type="text"
        name="comment"
        placeholder={`${placeholder.replace(/\.\.\.$/, '')}`}
        value={comment}
        onChange={e => setComment(e.target.value) }
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
                type="submit"
                variant="primary"
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
    submit="Post"
    onSubmit={onSubmit}
    placeholder="Write a comment"
  />
)

const WithComments = ({ comments, onSubmit }) => (
  <>
    {
      comments
        .map(({ user, time, content }, i) => (
          <div key={`comment-${i}`}>
            <Comment
              img={user.avatar}
              title={user.name}
              subtitle={time}
            />

            <p className='t t__sm'>
              {content}
            </p>

            {i !== comments.length - 1 && <hr />}
          </div>
        ))
    }

    <ChatForm
      submit="Post"
      onSubmit={onSubmit}
      placeholder="Reply"
    />
  </>
)

export default ({ comments = [], onSubmit = _ => _ }) => (
  <Card className="commentcard">
    {comments.length && <WithComments onSubmit={onSubmit} comments={comments} />}
    {comments.length === 0 && <NoComments onSubmit={onSubmit} />}
  </Card>
)
