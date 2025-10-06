import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { showToast } from './Toast.jsx'
import Modal from './modal/Modal.jsx'

const ALLOWED_TYPES = ['A','AAAA','CNAME','TXT','MX','PTR']

function LockIcon(){ return <span className="lock">🔒</span> }
function truncate(s){ if (!s) return ''; return s.length > 25 ? (s.slice(0,25) + '...') : s }
function renderTruncatedText(text, max = 25){
  if (!text) return ''
  if (text.length <= max) return text

  const head = text.slice(0, max)
  return (
    <>
      {head}
      {/* Always-highlighted ellipsis with hover tooltip */}
      <span className="ellipsis-tip" title={text} aria-label={text}>...</span>
    </>
  )
}

export default function DnsManager({ zone, onSignOut, onChangeZone }){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState({})
  const [confirmDel, setConfirmDel] = useState(false)
  const [singleDel, setSingleDel] = useState(null)

  const zoneNameCaps = (zone?.name || '').toUpperCase()

  useEffect(()=>{
    (async ()=>{
      setLoading(true)
      try{
        const d = await api.listRecords(zone.id)
        setRows(d.result || [])
        setSelected({}) // reset any stale selections
      }catch(e){ console.error(e); showToast('Load failed: ' + (e.message||'Error'), 'error') } finally { setLoading(false) }
    })()
  }, [zone?.id])

  const selectableIds = useMemo(()=> new Set((rows||[]).filter(r=>!(r?.meta && r.meta.read_only)).map(r=>r.id)), [rows])
  const filtered = useMemo(()=>{
    const query = q.trim().toLowerCase()
    return (rows||[]).filter(r=>{
      if (type !== 'All' && r.type !== type) return false
      if (!query) return true
      const fields = [r.type, r.name, r.content, r.comment || ''].join(' ').toLowerCase()
      return fields.includes(query)
    })
  }, [rows, q, type])

  const toggleSelect = (id)=>{
    if (!selectableIds.has(id)) return
    setSelected(s => ({...s, [id]: !s[id]}))
  }

  const openCreate = ()=>{ setEditing({ type:'A', name:'', content:'', ttl:1, proxied:true, priority:null, comment:'' }); setShowModal(true) }
  const openEdit = (r)=>{ setEditing({ type:r.type, name:r.name, content:r.content, ttl:r.ttl, proxied:!!r.proxied, comment:r.comment||'', priority:r.type==='MX' ? (r.priority ?? 0) : null, id:r.id }); setShowModal(true) }

  const isRestricted = (r)=>{
    return r.locked || (r.meta && (r.meta.read_only || r.meta.auto_added || r.meta.managed_by_apps || r.meta.managed_by_argo_tunnel));
  }

  const save = async ()=>{
    if (!editing) return
    setBusy(true)
    try{
      const payload = {
        type: editing.type, name: editing.name, content: editing.content,
        ttl: Number(editing.ttl)||1,
        proxied: ['A','AAAA','CNAME'].includes(editing.type) ? !!editing.proxied : undefined,
        comment: editing.comment || undefined,
        priority: editing.type==='MX' ? Number(editing.priority||0) : undefined,
      }
      if (editing.id){ await api.updateRecord(zone.id, editing.id, payload) }
      else { await api.createRecord(zone.id, payload) }
      const d = await api.listRecords(zone.id)
      setRows(d.result || []); setSelected({})
      setShowModal(false); setEditing(null)
    }catch(e){ showToast('Save failed: ' + e.message, 'error') } finally { setBusy(false) }
  }

  const delSelected = async ()=>{
    const ids = Object.entries(selected).filter(([id, v])=>v && selectableIds.has(id)).map(([id])=>id)
    if (ids.length===0) return
    setConfirmDel(false)
    for (const id of ids){
      try{ await api.deleteRecord(zone.id, id) }catch(e){ console.error('Delete failed for', id, e); showToast('Delete failed for ' + id + ': ' + (e.message||'Error'), 'error') }
    }
    const d = await api.listRecords(zone.id)
    setRows(d.result || [])
    setSelected({})
  }

  const proxyCell = (r)=> (['A','AAAA','CNAME'].includes(r.type) ? (r.proxied ? 'Proxied' : 'DNS only') : 'DNS only')
  const anySelected = Object.entries(selected).some(([id,v])=> v && selectableIds.has(id))

  return (
    <>
      <div className="header">
        <div className="title">DNS Manager for Zone <span className="zone">{zoneNameCaps}</span></div>
        <div style={{display:'flex', gap:10}}>
          <button className="btn" onClick={onChangeZone}>Change Zone</button>
          <button className="btn" onClick={onSignOut}>Sign Out</button>
        </div>
      </div>
      <div className="container">

        <div className="row nowrap" style={{marginBottom:12}}>
          <select value={type} onChange={e=>setType(e.target.value)} style={{maxWidth:160}}>
            <option>All</option>
            {ALLOWED_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input className="input grow" placeholder="Search (type, name, content, comment)" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="btn" onClick={()=>setQ('')}>Clear</button>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
          <button className="btn red" disabled={!anySelected} onClick={()=>setConfirmDel(true)}>Delete Selected</button>
          <button className="btn green" onClick={openCreate}>Add Record</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Type</th>
              <th>Name</th>
              <th>Content</th>
              <th>TTL</th>
              <th>Proxy</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const disabled = isRestricted(r)
              const isRO = r.meta && r.meta.read_only
              return (
                <tr key={r.id}>
                  <td style={{textAlign:'center', width:70}}>
                    {isRO ? <LockIcon/> : (disabled ? <LockIcon/> : <input type="checkbox" checked={!!selected[r.id]} onChange={()=>toggleSelect(r.id)} />)}
                  </td>
                  <td>{r.type}</td>
                  <td>{renderTruncatedText(r.name)}{!!r.comment && <span className="tooltip" title={r.comment}>📜</span>}</td>
                  <td>{renderTruncatedText(r.content)}{r.type==='MX' && (typeof r.priority !== 'undefined' && r.priority !== null) ? <span className="badge-priority">{r.priority}</span> : null}</td>
                  <td>{r.ttl === 1 ? 'Auto' : r.ttl}</td>
                  <td>{proxyCell(r)}</td>
                  <td className="actions">
                    {!isRO && !disabled && <button className="btn" onClick={()=>openEdit(r)}>Edit</button>}
                    {(isRO || disabled) && <button className="btn" disabled title="Read-only from Cloudflare">Edit</button>}
                    {!isRO && !disabled && <button className="btn red" onClick={()=> setSingleDel(r)}>Delete</button>}
                    {(isRO || disabled) && <button className="btn red" disabled title="Read-only from Cloudflare">Delete</button>}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan="7" style={{textAlign:'center'}}>No records</td></tr>
            )}
          </tbody>
        </table>

        {showModal && (
          <Modal onClose={()=>setShowModal(false)}>
            <div className="modal confirm">
              <div className="modal-header">{editing?.id ? 'Edit Record' : 'Add Record'}</div>
              <div className="form-grid">
                <div>
                  <label>Type</label>
                  <select value={editing.type} onChange={e=>setEditing({...editing, type:e.target.value})}>
                    {ALLOWED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label>Name</label>
                  <input className="input" value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} placeholder="e.g. app.example.com" />
                </div>
                <div>
                  <label>TTL</label>
                  <input className="input" type="number" min="1" value={editing.ttl} onChange={e=>setEditing({...editing, ttl:e.target.value})} />
                  <small className="muted">1=Auto</small>
                </div>
                <div>
                  <label>Content</label>
                  <input className="input" value={editing.content} onChange={e=>setEditing({...editing, content:e.target.value})} placeholder="IPv4/IPv6/target/content" />
                </div>
                <div className="form-row">
                  <label style={{minWidth:60}}>Proxy</label>
                  {['A','AAAA','CNAME'].includes(editing.type) ? (
                    <label className="switch">
                      <input type="checkbox" checked={!!editing.proxied} onChange={e=>setEditing({...editing, proxied:e.target.checked})} />
                      <span className="slider"></span>
                    </label>
                  ) : (
                    <div className="kv">DNS only</div>
                  )}
                </div>
                <div>
                  <label>Priority (MX)</label>
                  <input className="input" type="number" min="0" placeholder="N/A" value={editing.type==='MX' ? (editing.priority ?? 0) : ''} onChange={e=>setEditing({...editing, priority:e.target.value})} disabled={editing.type!=='MX'} />
                </div>
                <div className="full">
                  <label>Comment</label>
                  <input className="input" value={editing.comment||''} onChange={e=>setEditing({...editing, comment:e.target.value})} placeholder="Optional note (shows as 📜 tooltip)" />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn" onClick={()=>setShowModal(false)} disabled={busy}>Cancel</button>
                <button className="btn green" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </Modal>
        )}

        {singleDel && (
          <Modal onClose={()=>setSingleDel(null)}>
            <div className="modal plain">
              <div className="modal-header">Delete Record</div>
              <div>
                <div style={{marginBottom:8}}>Please confirm you want to delete this DNS record:</div>
                <ul>
                  <li><b>Type:</b> {singleDel.type}</li>
                  <li><b>Name:</b> {singleDel.name.length>30 ? <span title={singleDel.name}>{singleDel.name.slice(0,30)+'...'}</span> : singleDel.name}</li>
                  <li><b>Content:</b> {singleDel.content.length>30 ? <span title={singleDel.content}>{singleDel.content.slice(0,30)+'...'}</span> : singleDel.content}</li>
                  <li><b>TTL:</b> {singleDel.ttl === 1 ? 'Auto' : singleDel.ttl}</li>
                  <li><b>Proxy:</b> {['A','AAAA','CNAME'].includes(singleDel.type) ? (singleDel.proxied ? 'Proxied' : 'DNS only') : 'DNS only'}</li>
                  {singleDel.type==='MX' && <li><b>Priority:</b> {singleDel.priority}</li>}
                  {singleDel.comment && <li><b>Comment:</b> {singleDel.comment}</li>}
                </ul>
                <div className="modal-actions">
                  <button className="btn" onClick={()=>setSingleDel(null)}>Cancel</button>
                  <button className="btn red" onClick={async ()=>{ try{ await api.deleteRecord(zone.id, singleDel.id) } catch(e){ showToast('Delete failed: ' + (e.message||'Error'), 'error') } finally { setSingleDel(null); const d = await api.listRecords(zone.id); setRows(d.result||[]);} }}>Delete</button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {confirmDel && (
          <Modal onClose={()=>setConfirmDel(false)}>
            <div className="modal">
              <div className="modal-header">Confirm Delete</div>
              <div>
                <div style={{marginBottom:8}}>The following records will be deleted:</div>
                <ul>
                  {Object.entries(selected).filter(([id, v])=>v && selectableIds.has(id)).map(([id])=>{
                    const r = rows.find(x=>x.id===id)
                    if (!r) return null
                    return <li key={id}><b>{r.type}</b> — {r.name}</li>
                  })}
                </ul>
                <div className="modal-actions">
                  <button className="btn" onClick={()=>setConfirmDel(false)}>Cancel</button>
                  <button className="btn red" disabled={!Object.entries(selected).some(([id,v])=>v && selectableIds.has(id))} onClick={delSelected}>Delete Selected</button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  )
}
