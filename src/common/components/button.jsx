import * as React from 'react'

import './button.css'

export const Button = ({ children, disabled, size, variant, ...rest }) => {
  const variantCN = variant
    ? `btn btn--${variant}`
    : `btn`

  const disabledCN = disabled
    ? `btn--disabled`
    : ''

  const sizeCN = size
    ? `btn--${size}`
    : ''

  const className = [variantCN, disabledCN, sizeCN]
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
