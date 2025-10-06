import React, { useState } from 'react'
import { setPassword } from './api.js'

export default function Login({ onLoggedIn }){
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const go = async ()=>{
    setErr('')
    try{
      setPassword(pw)
      const r = await fetch('/api/zones', { headers:{ 'x-app-password': pw }, credentials:'include' })
      if (!r.ok) { setPassword(null); setErr('Invalid password'); return }
      setPassword(pw); onLoggedIn()
    }catch(e){ setPassword(null); setErr('Login failed') }
  }
  return (
    <div className="centered-wrap">
      <div className="card" style={{textAlign:'center'}}>
        <div style={{fontWeight:800, fontSize:24, marginBottom:10}}>Login</div>
        <input className="input" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} />
        {err && <div style={{color:'#b91c1c', marginTop:8}}>{err}</div>}
        <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:14}}>
          <button className="btn" onClick={()=>{setPw(''); setErr('')}}>Clear</button>
          <button className="btn" onClick={()=>location.reload()}>Reload</button>
          <button className="btn" onClick={go}>Login</button>
        </div>
      </div>
    </div>
  )
}
