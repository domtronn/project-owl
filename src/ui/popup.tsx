import * as React from "react"
import * as ReactDOM from "react-dom"

import "../common/root.css"
import "../styles/normalise.css"
import "../styles/popup.css"

import { Comment } from '../common/components/comment.tsx'
import { Bubble } from '../common/components/bubble.tsx'
import { Button } from '../common/components/button.tsx'
import { Card } from '../common/components/card.tsx'
import { Toggle } from '../common/components/toggle.tsx'


const Login = () => (
  <>
    <em>commentable</em>

    <h5>Make your mark</h5>
    <p>Comment on anything on the web</p>

    <input type="email" placeholder="Email" />
    <input type="password" placeholder="Password" />
    <button className="btn btn--primary">
      Login
    </button>
    <a>Forgotten password?</a>

    <button className="btn">
      I don't have an account
    </button>
    <p>
      <a>Terms</a>
      <a>Privacy</a>
    </p>
  </>
)

const Popup = () => (
  <>
    <h1>Heading 1</h1>
    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <h4>Heading 4</h4>
    <h5>Heading 5</h5>
    <h6>Heading 6</h6>

    <p className='t t__lg'>Body Large Regular</p>
    <p className='t t__lg t--bold'>Body Large Bold</p>

    <p className='t t__md'>Body Medium Regular</p>
    <p className='t t__md t--bold'>Body Medium Bold</p>

    <p className='t t__sm'>Body Small Regular</p>
    <p className='t t__sm t--bold'>Body Small Bold</p>

    <p className='t t__xs'>Body Tiny Regular</p>
    <p className='t t__xs t--bold'>Body Tiny Bold</p>

    <a className="l l__lg">Link Large</a>
    <a className="l l__md">Link Medium</a>
    <a className="l l__sm">Link Small</a>

    <div
      className="addcursor"
      style={{
        width:'200px',
        height:'200px',
        backgroundColor:'var(--primary)'
      }}>
    </div>

    <Toggle />

    <Button variant="primary">Button</Button>
    <Button>Button</Button>

    <Button disabled variant="primary">Button</Button>
    <Button disabled>Button</Button>

    <Card>
      Hello!
      <Button variant="primary">Button</Button>
    </Card>

    <Bubble />
    <Comment
      img="https://www.gravatar.com/avatar/f99d8cfd0a3bcd46ff2076bc75c1586f"
      title="Dom Charlesworth"
      subtitle="Today at 12:03am"
    />
  </>
)

// --------------
ReactDOM.render(
  <Popup />,
  document.getElementById('root')
)
