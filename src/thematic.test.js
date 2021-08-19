// vim: ts=2 sw=2 expandtab
/* global test, expect */

let logMessages = []
if (true) {
  console = {
    log: function(f) { logMessages.push(f) }
  }
}

let menus = []
let locals = {
  userThemes: [ { type: 'theme', id: "usertheme@usertheme.org", name: "user", description: "A user theme." },
  ]
}
let syncs = {
  minutes: 15
}
let enabled = []

let clearCalledWith = []
let createCalledWith = []

// can't be let, const, or var
browser = {
  alarms: {
    clear: function (f) {
      clearCalledWith.push(f)
    },
    create: function(f, t) {
      createCalledWith.push([f, t])
    },
    onAlarm: {
      onAlarmAddListenerCalledWith: [],
      addListener: function (f) {
        this.onAlarmAddListenerCalledWith.push(f)
        return undefined
      }
    },
  },
  storage: {
    sync: {
      // i know the follwing isn't DRY, haven't figured out how to fix it yet.
      get: function (f) {
        if (typeof syncs[f] === 'undefined') {
          return Promise.resolve({})
        }

        return Promise.resolve(syncs)
      },
      set: function (f) {
        syncs = {...syncs, ...f}
        return Promise.resolve()
      },
    },
    local: {
      // i know the follwing isn't DRY, haven't figured out how to fix it yet.
      get: function (f) {
        if (typeof f === 'undefined') {
          return Promise.resolve(locals)
        }

        if (typeof locals.f === 'undefined') {
          return Promise.resolve({})
        }

        return Promise.resolve(locals.f)
      },
      set: function (f) {
        locals = {...locals, ...f}
        return Promise.resolve()
      },
    },
  },
  runtime: {
    onMessage: {
      addListener: function (f) { return undefined }
    },
    getBrowserInfo: function () {
      return Promise.resolve({name: 'Firefox'})
    },
  },
  commands: {
    onCommand: {
      addListener: function (f) { return undefined }
    },
  },
  management: {
    getAll: function (f) {
      const builtins = [
        { type: 'theme', id: "default-theme@mozilla.org", name: "Default", description: "A theme with the operating system color scheme." },
        { type: 'theme', id: "firefox-compact-dark@mozilla.org", name: "Dark", description: "A theme with a dark color scheme." },
        { type: 'theme', id: "firefox-compact-light@mozilla.org", name: "Light", description: "A theme with a light color scheme." },
        { type: 'theme', id: "firefox-alpenglow@mozilla.org", name: "Firefox Alpenglow", description: "Use a colorful appearance for buttons, menus, and windows." },
        { type: 'extension', id: "drsjb80@gmail.com", name: "Thematic", description: "Quickly switch between your themes or back to the default." },
        { type: 'extension', id: "yahoo@search.mozilla.org", name: "Yahoo!", description: "Yahoo" },
        { type: 'extension', id: "startpage@search.mozilla.org", name: "Startpage", description: "Startpage" },
        { type: 'extension', id: "duckduckgo@search.mozilla.org", name: "DuckDuckGo", description: "Search DuckDuckGo" },
        { type: 'extension', id: "wikipedia@search.mozilla.org", name: "Wikipedia (en)", description: "Wikipedia, the Free Encyclopedia" },
      ]
      return Promise.resolve(builtins)
    },
    setEnabled: function (variable, value) {
      enabled.push([variable, value])
      return
    },
    onInstalled: { addListener: function (f) { return undefined } },
    onUninstalled: { addListener: function (f) { return undefined } },
  },
  menus: {
    create: function (item) { menus.push(item) },
    removeAll: function (f) { menus = []; return Promise.resolve() },
    onClicked: { addListener: function (f) { return undefined } },
  }
}

/*
browser.runtime.onMessage.addListener('foo')
browser.alarms.clear('rotate')
browser.alarms.onAlarm.addListener('foo')
browser.commands.onCommand.addListener('foo')
browser.management.onInstalled.addListener('foo')
browser.management.onUninstalled.addListener('foo')
browser.management.setEnabled('foo', true)
browser.management.setEnabled('foo'.id, true)
browser.menus.create()
browser.menus.onClicked.addListener('foo')
browser.menus.removeAll().then(() => {})
browser.storage.sync.get('auto').then((pref) => {})
browser.storage.sync.set({ auto: false }).then(() => {})
*/

const thematic = require('./thematic.js')

const aBunchOfThemes = [
  { name: 'Theme one', id: 'one' },
  { name: 'Theme two', id: 'two' },
  { name: 'Theme three', id: 'three' },
  { name: 'Theme four', id: 'four' }
]

test('isDefaultTheme', () => {
  expect(thematic.isDefaultTheme({ id: 'foo' })).toBe(false)
  expect(thematic.isDefaultTheme({ id: 'default-theme@mozilla.org' })).toBe(true)
})

test('chooseNext', async () => {
  let items = { userThemes: [1, 2] }
  syncs.random = false
  expect(await thematic.chooseNext(0, items)).toBe(1)
  expect(await thematic.chooseNext(1, items)).toBe(0)
  syncs.random = true
  expect(await thematic.chooseNext(0, items)).toBe(1)
  expect(await thematic.chooseNext(1, items)).toBe(0)

  items = { userThemes: [1, 2, 3] }
  syncs.random = false
  expect(await thematic.chooseNext(0, items)).toBe(1)
  expect(await thematic.chooseNext(1, items)).toBe(2)
  expect(await thematic.chooseNext(2, items)).toBe(0)

  /* this locks up jest for no apparent reason
  syncs.random = true
  expect(await thematic.chooseNext(0, items)).not.toBe(0)
  */
})

test('getCurrentId', () => {
  expect(thematic.getCurrentId({ currentId: 'foo' }, [], {})).toBe('foo')

  expect(thematic.getCurrentId({}, [{ id: 'foo' }], {})).toBe('foo')
  expect(logMessages.pop()).toBe('Setting currentId to first user theme')

  expect(thematic.getCurrentId({}, [], { id: 'foo' })).toBe('foo')
  expect(logMessages.pop()).toBe('Setting currentId to default theme')
})

test('getDefaultTheme', () => {
  let theme = { name: 'Default', id: 'foo' }
  expect(thematic.getDefaultTheme([theme])).toBe(theme)

  theme = { name: 'foo', id: 'default-theme@mozilla.org' }
  expect(thematic.getDefaultTheme([theme])).toBe(theme)

  theme = { name: 'foo', id: 'foo' }
  expect(thematic.getDefaultTheme([theme])).toBeUndefined()
  expect(logMessages.pop()).toBe('No default theme found!')
})

test('buildToolsMenuItem', () => {
  const expected = [{ id: 'one', type: 'normal', title: 'Theme one', contexts: ['tools_menu'] }]
  menus = []
  thematic.buildToolsMenuItem(aBunchOfThemes[0])
  expect(menus).toStrictEqual(expected)
})

test('buildThemes', () => {
  const expected = {
    currentId: 'default-theme@mozilla.org',
    defaultTheme: {
      type: 'theme',
      id: 'default-theme@mozilla.org',
      name: 'Default',
      description: 'A theme with the operating system color scheme.'
    },
    defaultThemes: [
      {
        type: 'theme',
        id: 'default-theme@mozilla.org',
        name: 'Default',
        description: 'A theme with the operating system color scheme.'
      },
      {
        type: 'theme',
        id: 'firefox-compact-dark@mozilla.org',
        name: 'Dark',
        description: 'A theme with a dark color scheme.'
      },
      {
        type: 'theme',
        id: 'firefox-compact-light@mozilla.org',
        name: 'Light',
        description: 'A theme with a light color scheme.'
      },
      {
        type: 'theme',
        id: 'firefox-alpenglow@mozilla.org',
        name: 'Firefox Alpenglow',
        description: 'Use a colorful appearance for buttons, menus, and windows.'
      }
    ],
    userThemes: []
  }

  thematic.buildThemes()
  expect(locals).toStrictEqual(expected)
})

test('startRotation', () => {
  syncs['auto'] = false
  syncs['minutes'] = 15
  thematic.startRotation().then(() => {
    expect(syncs['auto']).toBe(true)
    expect(createCalledWith.length).toBe(1)
    expect(createCalledWith.pop()[0]).toBe('rotate')
  })
})

test('stopRotation', () => {
  thematic.stopRotation().then(() => {
    expect(syncs['auto']).toBe(false)
    expect(clearCalledWith.length).toBe(1)
    expect(clearCalledWith.pop()).toBe('rotate')
  })
})

test('rotate', async () => {
  locals = {userThemes: []}
  await thematic.rotate()
  expect(logMessages.pop()).toBe('No user themes found!')

  locals = {
    userThemes: [
      {
        type: 'theme',
        id: "usertheme@usertheme.org",
        name: "user", description: "A user theme."
      },
    ],
  }
  await thematic.rotate()
  expect(logMessages.pop()).toBe('No current theme Id found!')

  locals = {
    userThemes: [
      {
        type: 'theme',
        id: "usertheme@usertheme.org",
        name: "user", description: "A user theme."
      },
    ],
    currentId: 'Missing',
  }
  enabled = []
  await thematic.rotate()
  expect(logMessages.pop()).toBe('usertheme@usertheme.org')
  expect(logMessages.pop()).toBe('User theme index not found')
  expect(locals.currentId).toBe('usertheme@usertheme.org')
  expect(enabled).toStrictEqual([["usertheme@usertheme.org", true]])

  locals = {
    userThemes: [
      {
        type: 'theme',
        id: "usertheme@usertheme.org",
        name: "user", description: "A user theme."
      },
    ],
    currentId: 'usertheme@usertheme.org',
  }
  enabled = []
  await thematic.rotate()
  expect(logMessages.pop()).toBe('usertheme@usertheme.org')
  expect(enabled).toStrictEqual([["usertheme@usertheme.org", true]])
})

let response = ''
function receiveResponse(m) { response = m }

test('handleMessage', () => {
  thematic.handleMessage({message: 'Start rotation'}, {}, receiveResponse)
  expect(response).toStrictEqual({"response": 'OK'})
  thematic.handleMessage({message: 'Stop rotation'}, {}, receiveResponse)
  expect(response).toStrictEqual({"response": 'OK'})
  thematic.handleMessage({message: 'Bad message'}, {}, receiveResponse)
  expect(response).toStrictEqual({"response": 'Not OK'})
})

test('commands', () => {
  thematic.commands('bad command')
  expect(logMessages.pop()).toBe('bad command not recognized')

  thematic.rotate = jest.fn()
  thematic.commands('Rotate to next theme')
  expect(thematic.rotate).toHaveBeenCalled()
  expect(thematic.rotate.mock.calls.length).toBe(1)
})
