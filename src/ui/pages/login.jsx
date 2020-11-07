import * as React from 'react'

import { firebase } from '../../common/firebase'

import 'firebase/auth'
import 'firebase/firestore'

import { Button } from '../../common/components/button'
import { Input } from '../../common/components/input'

export default ({
  onLoginSuccess = _ => _,
  onRegister = _ => _
}) => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const [err, setErr] = React.useState()

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
            .signInWithEmailAndPassword(email, password)
            .then(user => onLoginSuccess(user))
            .catch(error => setErr(error.code))
        }}
      >
        <Input
          onChange={e => setEmail(e.target.value)}
          value={email}
          name='email'
          type='email'
          placeholder='Email'
        />
        <Input
          onChange={e => setPassword(e.target.value)}
          value={password}
          name='password'
          type='password'
          placeholder='Password'
        />
        <Button type='submit' variant='primary'>
          Login
        </Button>
      </form>

      <a>Forgotten password?</a>

      <Button
        onClick={onRegister}
      >
        I don't have an account
      </Button>
      <p>
        <a>Terms</a>
        <a>Privacy</a>
      </p>
    </>
  )
}
