import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import './bubble.css'

export const Bubble = ({
  x,
  y,
  children,
  delay = 0,
  resolved = false,
  isOpen = false,
  onClick = _ => _,
  ...rest
}) => {
  if (!x || !y) return null

  const cn = resolved
        ? 'bubble bubble--resolved'
        : 'bubble'

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'absolute', top: y, left: x, zIndex: 200 }}>
            {children}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        {...rest}
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

        onClick={() => onClick()}

        style={{ top: y, left: x, zIndex: isOpen ? 200 : 100 }}
        className={cn}
      />
    </>
  )
}
