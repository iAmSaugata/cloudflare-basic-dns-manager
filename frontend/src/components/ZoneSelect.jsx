import React from 'react'

export default function ZoneSelect({ zones, onOpen, onSignOut }){
  return (
    <>
      <div className="header">
        <div className="title">Cloudflare DNS Manager</div>
        <div><button className="btn" onClick={onSignOut}>Sign Out</button></div>
      </div>
      <div className="centered-wrap">
        <div className="card" style={{maxWidth:'520px'}}>
          <div style={{fontWeight:800, fontSize:20, textAlign:'center', marginBottom:8}}>Select a Zone</div>
          <div>
            {(zones||[]).map(z => (
              <div key={z.id} className="zone-card">
                <div style={{fontWeight:700}}>{z.name} <span className="badge">{z.plan && z.plan.name ? z.plan.name : (z.type || 'zone')}</span></div>
                <div style={{marginTop:10, display:'flex', justifyContent:'center'}}>
                  <button className="btn" onClick={()=>onOpen(z)}>Open</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
