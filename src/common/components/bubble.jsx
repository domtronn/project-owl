import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import './bubble.css'

export const Bubble = ({
  x,
  y,
  children,
  delay = 0,
  onClick = _ => _
}) => {
  const [isopen, setopen] = React.useState(false)

  if (!x || !y) return null

  return (
    <>
      <AnimatePresence>
        {isopen && (
          <div style={{ position: 'absolute', top: y + 16, left: x + 16 }}>
            {children}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        variants={{
          hidden: { y: 20, opacity: 0 },
          show: { y: 0, opacity: 1 }
        }}

        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}

        transition={{
          default: { delay },
          scale: { delay: 0 },
          type: 'spring',
          stiffness: 600
        }}

        onClick={() => {
          onClick()
          setopen(!isopen)
        }}

        style={{ top: y, left: x }}
        className='bubble'
      />
    </>
  )
}
