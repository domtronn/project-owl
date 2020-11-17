import * as React from 'react'

import './radio-bar.css'

const { useState } = React

export const RadioBar = ({
  options,
  defaultChecked,
  onChange = _ => _
}) => {
  const [checked, setChecked] = useState(defaultChecked || options[0].value)

  return (
    <fieldset className='radiobar'>
      {
        options.map(({ value, label }, i) => (
          <label
            key={i}
            className={checked === value ? 'radiobar__label radiobar__label--checked' : 'radiobar__label'}
          >
            <input
              onChange={e => {
                onChange(e.target.value)
                setChecked(e.target.value)
              }}
              checked={checked === value}
              value={value}
              type='radio'
            />
            {label && typeof label === 'function' && label()}
            {label && typeof label === 'string' && label}
            {!label && value}
          </label>
        ))
      }
    </fieldset>
  )
}
