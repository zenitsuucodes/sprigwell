import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { faqs } from '../data'

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="faq-list">
      {faqs.map(([q, a], i) => {
        const isOpen = open === i
        return (
          <div key={q} className={`faq-item ${isOpen ? 'open' : ''}`}>
            <h3>
              <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                <span className="faq-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="faq-q">{q}</span>
                <motion.span className="faq-x" animate={{ rotate: isOpen ? 45 : 0 }} aria-hidden="true">+</motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq-a"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }}>
                  <p>{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
