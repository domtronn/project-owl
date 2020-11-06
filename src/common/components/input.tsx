import * as React from 'react'

import './input.css'

export const Input = ({ children, ...rest }) => (
  <input {...rest}>
    {children}
  </input>
)
