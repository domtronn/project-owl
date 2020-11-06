import * as React from 'react'

import './button.css'

export const Button = ({ children, disabled, variant, ...rest }) => {
  const variantCN = variant
    ? `btn btn--${variant}`
    : `btn`

  const disabledCN = disabled
    ? `btn--disabled`
    : ''

  const className = [variantCN, disabledCN]
    .filter(i => i)
    .join(' ')

  return (
    <button
      {...rest}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )
}
