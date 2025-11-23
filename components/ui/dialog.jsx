// components/ui/dialog.jsx
"use client"

import React, { useEffect, useRef } from "react"

const Dialog = ({ open, onOpenChange, children }) => {
  return open ? children : null
}

const DialogContent = ({ className = "", children, onClose, ...props }) => {
  const overlayRef = useRef(null)
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    
    const handleClickOutside = (e) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose?.()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    
    // Prevent scrolling on body when dialog is open
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        ref={overlayRef} 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
      />
      <div
        className={`relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto w-full max-w-md p-6 animate-scale-in ${className}`}
        {...props}
      >
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}

const DialogHeader = ({ className = "", ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 mb-4 ${className}`}
    {...props}
  />
)

const DialogTitle = ({ className = "", ...props }) => (
  <h3
    className={`text-lg font-medium leading-none tracking-tight ${className}`}
    {...props}
  />
)

export { Dialog, DialogContent, DialogHeader, DialogTitle }