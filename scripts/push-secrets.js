#!/usr/bin/env node

/**
 * Sync / Push Secrets from .env to Cloudflare Worker
 * Usage: node scripts/push-secrets.js
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

console.log('🔍 Checking for .env file in:', rootDir);

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found at:', envPath);
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

const secrets = {};
for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;

  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;

  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();

  // Remove wrapping quotes if present
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }

  if (key && val) {
    secrets[key] = val;
  }
}

const secretKeys = Object.keys(secrets);
if (secretKeys.length === 0) {
  console.log('⚠️ No valid key=value pairs found in .env');
  process.exit(0);
}

console.log(`\n📦 Found ${secretKeys.length} secret(s) in .env:`);
secretKeys.forEach(k => console.log(`   - ${k}`));
console.log('\n🚀 Uploading secrets to Cloudflare Worker (name: xmi)...');

let successCount = 0;
let failCount = 0;

for (const [key, value] of Object.entries(secrets)) {
  process.stdout.write(`   Uploading ${key}... `);
  
  try {
    const result = spawnSync('npx', ['--yes', 'wrangler', 'secret', 'put', key, '--name', 'xmi'], {
      input: value,
      encoding: 'utf8',
      shell: true
    });

    if (result.status === 0) {
      console.log('✅ Success');
      successCount++;
    } else {
      console.log('❌ Failed');
      console.error(result.stderr || result.stdout);
      failCount++;
    }
  } catch (err) {
    console.log('❌ Error');
    console.error(err.message);
    failCount++;
  }
}

console.log(`\n🎉 Finished! Uploaded: ${successCount} successful, ${failCount} failed.`);
