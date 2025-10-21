const ALLOWED_TYPES = new Set(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'PTR'])

const CF_API_BASE = (import.meta.env.CF_API_BASE || import.meta.env.VITE_CF_API_BASE || 'https://api.cloudflare.com/client/v4')
const CF_API_TOKEN = import.meta.env.CF_API_TOKEN || import.meta.env.VITE_CF_API_TOKEN

function ensureToken(){
  if (!CF_API_TOKEN){
    throw new Error('CF_API_TOKEN is not configured')
  }
}

async function cfRequest(path, options = {}){
  ensureToken()
  const headers = {
    'Authorization': `Bearer ${CF_API_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  }
  const res = await fetch(`${CF_API_BASE}${path}`, { ...options, headers })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  if (!res.ok || (json && json.success === false)){
    let msg = 'Request failed'
    if (json && Array.isArray(json.errors) && json.errors.length){
      msg = json.errors.map(e => (e.code ? `[${e.code}] ` : '') + (e.message || 'Error')).join('; ')
    } else if (json && json.error){
      msg = json.error
    } else if (json && json.message){
      msg = json.message
    }
    const err = new Error(msg)
    err.details = json
    throw err
  }
  return json
}

export const api = {
  async zones(){
    const params = new URLSearchParams({ per_page: '50' })
    return cfRequest(`/zones?${params.toString()}`)
  },
  async listRecords(zoneId){
    const params = new URLSearchParams({ per_page: '1000' })
    const data = await cfRequest(`/zones/${zoneId}/dns_records?${params.toString()}`)
    const filtered = Array.isArray(data.result) ? data.result.filter(r => ALLOWED_TYPES.has(r.type)) : []
    return { ...data, result: filtered }
  },
  async createRecord(zoneId, payload){
    return cfRequest(`/zones/${zoneId}/dns_records`, { method: 'POST', body: JSON.stringify(payload) })
  },
  async updateRecord(zoneId, id, payload){
    return cfRequest(`/zones/${zoneId}/dns_records/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  async deleteRecord(zoneId, id){
    return cfRequest(`/zones/${zoneId}/dns_records/${id}`, { method: 'DELETE' })
  }
}
