import * as React from 'react'

import { firebase } from '../../common/firebase'

import 'firebase/auth'
import 'firebase/firestore'

import { Button } from '../../common/components/button'
import { Input } from '../../common/components/input'

export default ({
  onLogin = _ => _,
  onRegisterSuccess = _ => _
}) => {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')

  return (
    <>
      <h5>Make your mark</h5>
      <p>Comment on anything on the web</p>
      <form
        autoComplete='on'
        onSubmit={e => {
          e.preventDefault()
          firebase
            .auth()
            .createUserWithEmailAndPassword(email, password)
            .then(({ user }) => {
              firebase
                .firestore()
                .collection('users')
                .doc(user.uid)
                .set({ name, handle: username })

              chrome
                .runtime
                .sendMessage({ type: 'VERIFY_USER' })

              onRegisterSuccess({ ...user, name, handle: username })
            })
            .catch(error => {
            })
        }}
      >
        <Input
          required
          pattern="[a-zA-Z0-9_]+"
          onChange={e => setUsername(e.target.value)}
          value={username}
          name='username'
          placeholder='Username'
        />
        <Input
          required
          pattern="[a-zA-Z]+ ?[a-zA-Z]*"
          onChange={e => setName(e.target.value)}
          value={name}
          name='name'
          placeholder='Full name'
        />
        <Input
          required
          onChange={e => setEmail(e.target.value)}
          value={email}
          name='email'
          type='email'
          placeholder='Email'
        />
        <Input
          required
          pattern='.{8,}'
          onChange={e => setPassword(e.target.value)}
          value={password}
          name='password'
          type='password'
          placeholder='Password'
        />
        <Button type='submit' variant='primary'>
          Create account
        </Button>
      </form>

      <Button onClick={onLogin}>
        Already have an account?
      </Button>

    </>
  )
}
