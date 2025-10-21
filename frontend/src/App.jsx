import React, { useEffect, useState } from 'react'
import Login from './components/Login.jsx'
import ToastHost from './components/Toast.jsx'
import ZoneSelect from './components/ZoneSelect.jsx'
import DnsManager from './components/DnsManager.jsx'
import { api } from './components/api.js'
import { destroySession, hasValidSession } from './components/auth.js'

export default function App(){
  const [view, setView] = useState('login')
  const [zones, setZones] = useState([])
  const [zone, setZone] = useState(null)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(()=>{
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleLoggedIn = async ()=>{
    const z = await api.zones()
    setZones(z.result || [])
    setView('zones')
  }

  useEffect(()=>{
    let cancelled = false
    ;(async ()=>{
      try{
        if (await hasValidSession()){
          await handleLoggedIn()
        }
      }catch(err){
        console.error('Failed to resume session', err)
        destroySession()
        if (!cancelled) setView('login')
      }
    })()
    return ()=>{ cancelled = true }
  }, [])

  const openZone = (z)=>{
    setZone(z)
    document.title = (z.name || '').toUpperCase()
    setView('dns')
  }

  const signOut = ()=>{
    destroySession()
    setZone(null)
    setZones([])
    setView('login')
    document.title = 'Cloudflare DNS Manager'
  }

  const changeZone = ()=>{
    setZone(null); setView('zones'); document.title = 'Cloudflare DNS Manager'
  }

  return (
    <div>
      {view === 'login' && <Login onLoggedIn={handleLoggedIn}/>}
      {view === 'zones' && <ZoneSelect zones={zones} onOpen={openZone} onSignOut={signOut}/>}
      {view === 'dns' && zone && <DnsManager zone={zone} onSignOut={signOut} onChangeZone={changeZone}/>}
      <ToastHost />
      <div className="footer">
        Powered by Cloudflare DNS API • © iAmSaugata
        <span className="theme-toggle">
          <label>Dark Mode</label>
          <label className="switch"><input type="checkbox" checked={theme==='dark'} onChange={e=>setTheme(e.target.checked?'dark':'light')} /><span className="slider"></span></label>
        </span>
      </div>
    </div>
  )
}
