import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/cloud-bootstrap.js', import.meta.url), 'utf8');
const KEY = 'still-workspace-v1';
const workspace = {version: 1, tasks: [{id: 'task-one', title: 'Saved task', done: false, category: 'Personal', priority: 'Normal', due: '2026-11-10'}], notes: [], sessions: [], duration: 25, projects: [], habits: [], trash: [], draft: ''};

function harness({fetchImpl, store = {}}) {
  const values = new Map(Object.entries(store));
  const loaded = [];
  let swRegistered = false;
  const loadingMessage = {textContent: 'Connecting to your private workspace…', after() {}};
  const elements = new Map([['#cloudLoading', {remove() { elements.delete('#cloudLoading'); }}]]);
  const document = {
    querySelector(selector) {
      if (selector === '#cloudLoading') return elements.get('#cloudLoading');
      if (selector === '#loadingMessage') return loadingMessage;
      return null;
    },
    createElement(tag) {
      return {tagName: tag, src: '', id: '', className: '', textContent: '', onclick: null, onload: null, onerror: null, after() {}};
    },
    body: {append(script) { loaded.push(script.src); setTimeout(() => script.onload?.(), 0); }}
  };
  const location = {href: '', reload() {}};
  const window = {};
  const context = vm.createContext({
    window,
    localStorage: {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value))
    },
    fetch: fetchImpl,
    AbortSignal: {timeout: () => ({})},
    document,
    navigator: {serviceWorker: {register: async () => { swRegistered = true; }}},
    location,
    console,
    setTimeout,
    clearTimeout
  });
  vm.runInContext(source, context);
  return {window, values, loaded, location, loadingMessage, elements, sws: () => swRegistered};
}

const settle = () => new Promise(resolve => setTimeout(resolve, 30));

test('cold offline start reopens the last account workspace and loads the shell', async () => {
  const {window, loaded, elements, sws} = harness({
    fetchImpl: async () => { throw new Error('offline'); },
    store: {
      [`${KEY}:last-account`]: 'acct-1',
      [`${KEY}:last-user`]: JSON.stringify({id: 'acct-1', name: 'Test User', email: 'test@example.test'}),
      [`${KEY}:acct-1`]: JSON.stringify(workspace),
      [`${KEY}:acct-1:sync`]: JSON.stringify({base: 'BASE', revision: 7, lastSync: 1})
    }
  });
  await settle();
  assert.equal(window.STILL_STORAGE_KEY, `${KEY}:acct-1`);
  assert.equal(window.STILL_CLOUD.offline, true);
  assert.equal(window.STILL_CLOUD.remote.user.name, 'Test User');
  assert.equal(window.STILL_CLOUD.remote.revision, 7);
  assert.equal(window.STILL_CLOUD.base, 'BASE');
  assert.deepEqual(loaded, ['/recurrence.js?v=4', '/app.js?v=4', '/expand.js?v=4', '/cloud-sync.js?v=4']);
  assert.equal(elements.has('#cloudLoading'), false);
  assert.equal(sws(), true);
});

test('online start records the account and detects a device conflict without replacing the local copy', async () => {
  const remote = {...workspace, draft: 'remote draft'};
  const local = {...workspace, draft: 'local draft'};
  const {window, loaded, values} = harness({
    fetchImpl: async () => ({status: 200, ok: true, json: async () => ({user: {id: 'acct-1', name: 'Test User', email: 'test@example.test'}, state: remote, revision: 9})}),
    store: {
      [`${KEY}:acct-1`]: JSON.stringify(local),
      [`${KEY}:acct-1:sync`]: JSON.stringify({base: 'OLD_BASE', revision: 8, lastSync: 1})
    }
  });
  await settle();
  assert.equal(window.STILL_CLOUD.conflict, true);
  assert.equal(window.STILL_CLOUD.base, 'OLD_BASE');
  assert.equal(window.STILL_CLOUD.remote.revision, 9);
  assert.equal(values.get(`${KEY}:last-account`), 'acct-1');
  assert.equal(JSON.parse(values.get(`${KEY}:last-user`)).name, 'Test User');
  assert.equal(JSON.parse(values.get(`${KEY}:acct-1`)).draft, 'local draft');
  assert.equal(loaded.length, 4);
});

test('signed-out responses redirect instead of exposing local data', async () => {
  const {window, loaded, location, elements} = harness({
    fetchImpl: async () => ({status: 401, ok: false, json: async () => ({})}),
    store: {[`${KEY}:last-account`]: 'acct-1', [`${KEY}:acct-1`]: JSON.stringify(workspace)}
  });
  await settle();
  assert.equal(location.href, '/signin-with-chatgpt?return_to=%2F');
  assert.equal(loaded.length, 0);
  assert.equal(window.STILL_CLOUD, undefined);
  assert.equal(elements.has('#cloudLoading'), true);
});

test('offline start without a local copy shows a retry state and loads no workspace shell', async () => {
  const {window, loaded, location, loadingMessage} = harness({
    fetchImpl: async () => { throw new Error('Cloud storage is unavailable. Your saved data is untouched.'); }
  });
  await settle();
  assert.match(loadingMessage.textContent, /Cloud storage is unavailable/);
  assert.equal(window.STILL_CLOUD, undefined);
  assert.equal(loaded.length, 0);
  assert.equal(location.href, '');
});
