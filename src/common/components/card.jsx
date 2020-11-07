import * as React from 'react'
import { motion } from 'framer-motion'

import './card.css'

export const Card = ({ children, className = '', ...rest }) => (
  <motion.div
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 50, opacity: 0 }}
    transition={{
      animate: { type: 'spring', stiffness: 600 }
    }}

    className={`card ${className}`}
    {...rest}
  >
    {children}
  </motion.div>
)
