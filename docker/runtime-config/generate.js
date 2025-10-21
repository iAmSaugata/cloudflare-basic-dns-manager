#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const outputPath = process.argv[2]

if (!outputPath){
  console.error('Missing output path for runtime config')
  process.exit(1)
}

const config = {}
for (const key of ['AUTH_BCRYPT_HASH', 'SESSION_SECRET', 'CF_API_TOKEN', 'CF_API_BASE']){
  const value = process.env[key]
  if (value && value.length > 0){
    config[key] = value
  }
}

const contents = `window.__CF_DNS_CONFIG = Object.assign({}, window.__CF_DNS_CONFIG, ${JSON.stringify(config, null, 2)});\n`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, contents, 'utf8')
