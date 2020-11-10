import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default ({ condition, children, ...rest }) => (
  <AnimatePresence>
    {condition && (
      <motion.div
        style={{ overflowY: 'hidden' }}
        animate={{ height: 48 + 8 }}
        initial={{ height: 0 }}
        exit={{ height: 0 }}
        {...rest}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
)
