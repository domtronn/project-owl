import * as React from 'react'

import { firebase } from '../../common/firebase'

import 'firebase/auth'
import 'firebase/firestore'

import { Button } from '../../common/components/button'
import { Input } from '../../common/components/input'

const ResetSent = ({
  goLogin = _ => _
}) => (
  <>
    <p>We've sent you a reset link!</p>
    <p>Please check your inbox and try again</p>

    <a onClick={goLogin}>Okay got it!</a>
  </>
)

const Reset = ({
  email = '',
  onEmailChange = _ => _,
  goLogin = _ => _,
  goResetSent = _ => _,
}) => (
  <>
    <form
      autoComplete='on'
      onSubmit={e => {
        e.preventDefault()
        firebase
          .auth()
          .sendPasswordResetEmail(email)
          .then(goResetSent)
      }}
    >
      <Input
        required
        onChange={e => onEmailChange(e.target.value)}
        value={email}
        name='email'
        type='email'
        placeholder='Email'
      />

      <Button type='submit' variant='primary'>
        Send password reset
      </Button>

    </form>
    <a onClick={goLogin}>
      Login with password
    </a>
  </>
)

const Login = ({
  email = '',
  password = '',
  onEmailChange = _ => _,
  onPasswordChange = _ => _,
  goReset = _ => _,
  goError = _ => _,
  goSuccess = _ => _,
}) => (
  <>
    <form
      onSubmit={e => {
        e.preventDefault()
        firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(user => goSuccess(user))
          .catch(error => goError(error.code))
      }}
    >
      <Input
        required
        onChange={e => onEmailChange(e.target.value)}
        value={email}
        name='email'
        type='email'
        placeholder='Email'
      />

      <Input
        required
        onChange={e => onPasswordChange(e.target.value)}
        value={password}
        name='password'
        type='password'
        placeholder='Password'
      />

      <Button type='submit' variant='primary'>
        Login
      </Button>
    </form>

    <a onClick={goReset}>
      Forgotten your password?
    </a>
  </>
)

const Error = ({ err, goLogin = _ => _ }) => (
  <>
    <b style={{ fontSize: 48 }}>😱</b>
    <p>Oh no!</p>
    <p>Something went wrong when logging in, <br /> please try again</p>

    <a onClick={goLogin}>Okay, got it</a>
  </>
)

const states = {
  ERROR: 'error',
  LOGIN: 'login',
  RESET: 'reset',
  RESET_SENT: 'resetSent'
}

export default ({
  onLoginSuccess = _ => _,
  onRegister = _ => _
}) => {
  const [state, setState] = React.useState(states.LOGIN)

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  /** State handling for password reset */
  const [err, setErr] = React.useState()

  return (
    <>
      <h5>Make your mark</h5>
      <p>Comment on anything on the web</p>

      {state === states.ERROR && (
        <Error
          err={err}
          goLogin={_ => setState(states.LOGIN)}
        />
      )}

      {state === states.LOGIN && (
        <Login
          goReset={_ => setState(states.RESET)}
          goSuccess={user => onLoginSuccess(user)}
          goError={err => {
            setErr(err)
            setState(states.ERROR)
          }}

          email={email}
          onEmailChange={e => setEmail(e)}
          password={password}
          onPasswordChange={e => setPassword(e)}
        />
      )}

      {state === states.RESET && (
        <Reset
          goLogin={_ => setState(states.LOGIN)}
          goResetSent={_ => setState(states.RESET_SENT)}

          email={email}
          onEmailChange={e => setEmail(e)}
        />
      )}

      {state === states.RESET_SENT && (
        <ResetSent goLogin={_ => setState(states.LOGIN)} />
      )}

      {state === states.LOGIN && (
        <Button
          onClick={onRegister}
        >
          I don't have an account
        </Button>
      )}
    </>
  )
}
