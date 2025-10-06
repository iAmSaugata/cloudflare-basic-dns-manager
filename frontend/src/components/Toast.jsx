import React, { useEffect, useState } from 'react'

export function showToast(message, kind='error', ttl=4000){
  window.dispatchEvent(new CustomEvent('app:toast', {
    detail: { id: Date.now() + Math.random(), message, kind, ttl }
  }))
}

export default function ToastHost(){
  const [toasts, setToasts] = useState([])

  useEffect(()=>{
    function onToast(e){
      const t = e.detail
      setToasts(prev => [...prev, t])
      setTimeout(()=>{
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, t.ttl || 4000)
    }
    window.addEventListener('app:toast', onToast)
    return () => window.removeEventListener('app:toast', onToast)
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind || 'info'}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
