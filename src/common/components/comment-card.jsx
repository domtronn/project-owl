import * as React from 'react'

import { Card } from './card'
import { Button } from './button'
import { Mention, ParseComment } from './mention'
import { Comment } from './comment'

import sw from '../../app/utils/switch'
import AnimWrapper from '../helpers/anim-wrapper'

import { UsersContext } from '../../common/providers/users-provider'

import { EditorState, convertToRaw } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin'

import '../../common/components/input.css'

import {
  FiCheckCircle as CheckCircle,
  FiLock as Lock,
  FiUnlock as Unlock,
  FiMoreVertical as More,
  FiTrash2 as Delete,
  FiX as Close
} from 'react-icons/fi'

import './comment-card.css'

const { useState, useContext, useRef, useEffect } = React

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

const serialiseChat = (entityMap, comment) => (
  Object
    .values(entityMap)
    .reduce((acc, { data }) =>
      acc.replace(`@${data.mention.name}`, `[[:mention:][${data.mention.id}]]`),
      comment
    )
)

const ChatForm = ({
  onSubmit,
  placeholder,
  submit
}) => {
  const users = Object.values(useContext(UsersContext))

  const editorRef = useRef(null)
  const [editorFocus, setEditorFocus] = useState(false)
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  )

  const [mentionPlugin] = useState(createMentionPlugin({
    mentions: users,
    entityMutability: 'IMMUTABLE',
    mentionPrefix: '@',
    mentionComponent: ({ mention }) => (
      <span className='editor__mention'>
        @{mention.name}
      </span>
    ),
    supportWhitespace: true
  }))
  const [mentions, setMentions] = useState(users)
  const { MentionSuggestions } = mentionPlugin

  useEffect(() => {
    if (!editorRef) return
    setTimeout(editorRef.current.focus, 5)
  }, [editorRef])

  const currentContent = editorState.getCurrentContent()
  const comment = serialiseChat(
    convertToRaw(currentContent).entityMap,
    currentContent.getPlainText()
  )

  // TODO: Add emoji plugin because why not?
  // TODO: Add linkify plugin
  // TODO: Fix the regexp trigger to include the first character
  // TODO: Fix the search value splitting to highlight correctly with capitalisation
  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setEditorState(EditorState.createEmpty())
        onSubmit(comment)
      }}
    >
      <div
        onClick={_ => editorRef.current.focus()}
        className={editorFocus ? 'editor editor--focus' : 'editor'}
      >
        <Editor
          ref={editorRef}
          placeholder={placeholder.replace(/\.\.\.$/, '') + '...'}
          editorState={editorState}
          onChange={setEditorState}
          plugins={[mentionPlugin]}
          onFocus={_ => setEditorFocus(true)}
          onBlur={_ => setEditorFocus(true)}
        />
      </div>
      <MentionSuggestions
        suggestions={mentions}
        entryComponent={Mention}
        onSearchChange={({ value }) => setMentions(
          defaultSuggestionsFilter(
            value,
            users
          )
        )}
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

const Comments = ({ comments, resolved }) => {
  const users = useContext(UsersContext)

  return comments
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
          /* TODO: The display text should include both created & updated */
          subtitle={displayText || created}
          subtitleHover={displayDate}
        />

        {[]
         .concat(content)
         .map((c, i) => <ParseComment key={i} content={c} users={users} />)}

        {i !== comments.length - 1 && <hr />}
      </div>
    ))
}

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
