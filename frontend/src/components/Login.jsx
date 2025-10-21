import React, { useMemo, useState } from 'react'
import { establishSession, destroySession, authConfigIssues, verifyPassword } from './auth.js'

export default function Login({ onLoggedIn }){
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const configIssues = useMemo(()=> authConfigIssues(), [])

  const go = async ()=>{
    if (busy) return
    setErr('')
    if (configIssues.length){
      setErr(`Missing configuration: ${configIssues.join(', ')}`)
      return
    }
    if (!pw){
      setErr('Password required')
      return
    }
    setBusy(true)
    try{
      const ok = await verifyPassword(pw)
      if (!ok){
        setErr('Invalid password')
        return
      }
      await establishSession()
      await onLoggedIn()
      setPw('')
    }catch(e){
      console.error(e)
      destroySession()
      setErr(e.message || 'Login failed')
    }finally{
      setBusy(false)
    }
  }

  return (
    <div className="centered-wrap">
      <div className="card" style={{textAlign:'center'}}>
        <div style={{fontWeight:800, fontSize:24, marginBottom:10}}>Login</div>
        <input className="input" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} />
        {err && <div style={{color:'#b91c1c', marginTop:8}}>{err}</div>}
        {configIssues.length > 0 && !err && (
          <div style={{color:'#b91c1c', marginTop:8}}>
            Missing configuration: {configIssues.join(', ')}
          </div>
        )}
        <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:14}}>
          <button className="btn" onClick={()=>{setPw(''); setErr('')}} disabled={busy}>Clear</button>
          <button className="btn" onClick={()=>location.reload()} disabled={busy}>Reload</button>
          <button className="btn" onClick={go} disabled={busy || configIssues.length > 0}>Login</button>
        </div>
      </div>
    </div>
  )
}
