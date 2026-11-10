import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import ts from 'typescript';

function load(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const sandbox = {exports: {}};
  new Function('require', 'module', 'exports', output)(name => {
    if (name in dependencies) return dependencies[name];
    throw new Error(`Unexpected dependency ${name}`);
  }, sandbox, sandbox.exports);
  return sandbox.exports;
}

const auth = load('../app/chatgpt-auth.ts', {
  'next/headers': {headers: async () => ({get: () => null})},
  'next/navigation': {redirect: () => { throw new Error('redirect should not run'); }}
});

test('Sites identity headers fail closed on Vercel unless explicitly trusted', () => {
  const old = {...process.env};
  try {
    delete process.env.STILL_TRUST_SITES_AUTH;
    delete process.env.VERCEL;
    assert.equal(auth.authHeadersAreTrusted(), true);
    process.env.VERCEL = '1';
    assert.equal(auth.authHeadersAreTrusted(), false);
    process.env.STILL_TRUST_SITES_AUTH = 'true';
    assert.equal(auth.authHeadersAreTrusted(), true);
    process.env.STILL_TRUST_SITES_AUTH = 'false';
    assert.equal(auth.authHeadersAreTrusted(), false);
  } finally {
    process.env = old;
  }
});

test('safe return paths reject protocol-relative and reserved destinations', () => {
  const signIn = auth.chatGPTSignInPath;
  assert.match(signIn('/tasks?x=1#y'), /return_to=%2Ftasks%3Fx%3D1%23y/);
  assert.match(signIn('//evil.test'), /return_to=%2F$/);
  assert.match(signIn('https://evil.test'), /return_to=%2F$/);
  assert.match(signIn('/signin-with-chatgpt'), /return_to=%2F$/);
});
