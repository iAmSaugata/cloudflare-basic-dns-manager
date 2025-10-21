import { getConfigValue, requireConfig } from '../lib/config.js'

const ALLOWED_TYPES = new Set(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'PTR'])
const DEFAULT_CF_API_BASE = 'https://api.cloudflare.com/client/v4'

function resolveConfig(){
  return {
    token: requireConfig('CF_API_TOKEN'),
    base: getConfigValue('CF_API_BASE', DEFAULT_CF_API_BASE)
  }
}

async function cfRequest(path, options = {}){
  const { token, base } = resolveConfig()
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  }
  const res = await fetch(`${base}${path}`, { ...options, headers })
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
