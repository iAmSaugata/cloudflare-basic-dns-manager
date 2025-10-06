import React, { useEffect, useState } from 'react'
import Login from './components/Login.jsx'
import ToastHost from './components/Toast.jsx'
import ZoneSelect from './components/ZoneSelect.jsx'
import DnsManager from './components/DnsManager.jsx'
import { api, setPassword, getPassword } from './components/api.js'

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

  useEffect(()=>{
    const pw = getPassword()
    if (pw){
      setPassword(pw)
      api.zones().then(d=>{ if (d && d.result) { setZones(d.result); setView('zones') } }).catch(()=>{})
    }
  }, [])

  const handleLoggedIn = async ()=>{
    const z = await api.zones()
    setZones(z.result || [])
    setView('zones')
  }

  const openZone = (z)=>{
    setZone(z)
    document.title = (z.name || '').toUpperCase()
    setView('dns')
  }

  const signOut = ()=>{
    setPassword(null)
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
