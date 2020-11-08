import * as React from 'react'

import './checkbox.css'
import { FiCheck as Check } from 'react-icons/fi'

export const Checkbox = ({ name, children }) => (
  <label className='checkbox' name={name}>
    <input type='checkbox' />
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
