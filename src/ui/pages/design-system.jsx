import * as React from "react"

import { Comment } from '../../common/components/comment.jsx'
import { Bubble } from '../../common/components/bubble.jsx'
import { Button } from '../../common/components/button.jsx'
import { Card } from '../../common/components/card.jsx'
import { Toggle } from '../../common/components/toggle.jsx'
import { Checkbox } from '../../common/components/checkbox.jsx'

export const DesignSystem = () => (
  <div>
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

    <Checkbox>
      Click me!
    </Checkbox>

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
  </div>
)
