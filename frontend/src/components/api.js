let password = null
export function setPassword(pw){
  password = pw
  if (pw){
    localStorage.setItem('app_password', pw)
    document.cookie = `app_password=${pw}; path=/; SameSite=Lax`
  }else{
    localStorage.removeItem('app_password')
    document.cookie = 'app_password=; Max-Age=0; path=/'
  }
}
export function getPassword(){ return localStorage.getItem('app_password') || null }
async function req(path, opts={}){
  const headers = opts.headers || {}
  if (password) headers['x-app-password'] = password
  const res = await fetch(path, { ...opts, headers, credentials: 'include' })
  if (!res.ok){
  const t = await res.json().catch(()=>({}))
  let msg = 'Request failed'
	  if (t && Array.isArray(t.errors) && t.errors.length){
		// Cloudflare-style error list → “[9007] Content for NS record is invalid.”
		msg = t.errors.map(e => (e.code ? `[${e.code}] ` : '') + (e.message || 'Error')).join('; ')
	  } else if (t && t.error){
		msg = t.error
	  } else if (t && t.message){
		msg = t.message
	  }
	  const err = new Error(msg)
	  err.details = t
	  throw err
	}
  return res.json()
}
export const api = {
  health(){ return req('/api/health') },
  zones(){ return req('/api/zones') },
  listRecords(zoneId){ return req(`/api/zone/${zoneId}/dns_records`) },
  createRecord(zoneId, payload){ return req(`/api/zone/${zoneId}/dns_records`, { method:'POST', body: JSON.stringify(payload), headers:{ 'Content-Type':'application/json' } }) },
  updateRecord(zoneId, id, payload){ return req(`/api/zone/${zoneId}/dns_records/${id}`, { method:'PUT', body: JSON.stringify(payload), headers:{ 'Content-Type':'application/json' } }) },
  deleteRecord(zoneId, id){ return req(`/api/zone/${zoneId}/dns_records/${id}`, { method:'DELETE' }) },
}
