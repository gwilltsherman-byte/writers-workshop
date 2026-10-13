#!/bin/bash
set -euo pipefail
node <<'JS'
const fs=require('node:fs'),crypto=require('node:crypto');
let text=fs.existsSync('.env')?fs.readFileSync('.env','utf8'):fs.readFileSync('.env.example','utf8');
text=text.replace(/^DATABASE_URL=.*$/m,'DATABASE_URL='+process.env.DATABASE_URL);
if(!/^AUTH_SECRET=.+$/m.test(text))text=text.replace(/^AUTH_SECRET=.*$/m,'AUTH_SECRET='+crypto.randomBytes(32).toString('base64'));
fs.writeFileSync('.env',text,{mode:0o600});
JS
npm ci --ignore-scripts
npx prisma generate
npx prisma migrate deploy
