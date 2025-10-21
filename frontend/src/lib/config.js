const hasWindow = typeof window !== 'undefined'

function runtimeConfig(){
  if (!hasWindow) return {}
  const runtime = window.__CF_DNS_CONFIG
  return runtime && typeof runtime === 'object' ? runtime : {}
}

function envConfig(){
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env){
      return import.meta.env
    }
  } catch (err) {
    // ignore
  }
  return {}
}

function hasValue(value){
  return value !== undefined && value !== null && value !== ''
}

export function getConfigValue(name, fallback){
  const runtime = runtimeConfig()
  if (hasValue(runtime[name])) return runtime[name]
  const env = envConfig()
  if (hasValue(env[name])) return env[name]
  const prefixed = `VITE_${name}`
  if (hasValue(env[prefixed])) return env[prefixed]
  return fallback
}

export function requireConfig(name){
  const value = getConfigValue(name)
  if (!hasValue(value)){
    throw new Error(`${name} is not configured`)
  }
  return value
}

export function missingConfigKeys(names){
  return names.filter(name => !hasValue(getConfigValue(name)))
}
