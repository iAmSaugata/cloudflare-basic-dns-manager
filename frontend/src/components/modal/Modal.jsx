import React from 'react'
export default function Modal({ children, onClose }){
  return (
    <div className='modal-backdrop' onClick={(e)=>{ if (e.target===e.currentTarget) onClose() }}>
      {children}
    </div>
  )
}
