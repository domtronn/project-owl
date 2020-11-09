import * as React from 'react'

import './checkbox.css'
import { FiCheck as Check } from 'react-icons/fi'

export const Checkbox = ({
  name,
  children,
  style = {},
  type = 'checkbox',
  ...rest
}) => (
  <label style={style} className='checkbox' name={name}>
    <input {...rest} type={type} />
    <div>
      <div className='checkbox__check'>
        <Check />
      </div>
      <div>
        {children}
      </div>
    </div>
  </label>
)
