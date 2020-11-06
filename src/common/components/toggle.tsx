import * as React from 'react'

import './toggle.css'

export const Toggle = ({
  initial = false,
  onClick = _ => _,
  onToggle = _ => _,
  onToggleOn = () => _,
  onToggleOff = () => _,
}) => {
  const [state, setState] = React.useState(initial)

  return (
    <label className='toggle'>
      <input
        type="checkbox"
        onClick={() => {
          onClick(!state)
          onToggle(!state)
          state && onToggleOn()
          !state && onToggleOff()
          setState(!state)
        }}
      />
      <span className='toggle__slider' />
    </label>
  )
}
