// vim: ts=2 sw=2 expandtab
/* global test, expect */

let menus = []
let locals = {}
let syncs = {}

// can't be let, const, or var

browser = {
  alarms: {
    clearCalledWith: [],
    clear: function (f) {
      this.clearCalledWith.push(f)
      return undefined
    },
    createCalledWith: [],
    create: function(f, t) {
      this.createCalledWith.push(f, t)
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
        if (typeof syncs.f === 'undefined') {
          return Promise.resolve({})
        }
        return Promise.resolve(syncs.f)
      },
      set: function (f) {
        console.log(syncs)
        syncs = {...syncs, ...f}
        console.log(syncs)
        return Promise.resolve()
      },
    },
    local: {
      // i know the follwing isn't DRY, haven't figured out how to fix it yet.
      get: function (f) {
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
    setEnabled: function (f) { return undefined },
    onInstalled: { addListener: function (f) { return undefined } },
    onUninstalled: { addListener: function (f) { return undefined } },
  },
  menus: {
    create: function (item) { menus.push(item) },
    removeAll: function (f) { menus = []; return Promise.resolve() },
    onClicked: { addListener: function (f) { return undefined } },
  }
}

exports.browser = browser

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

test('chooseLength with a length of two is always the other one', () => {
  const items = { userThemes: [1, 2] }
  expect(thematic.chooseNext(0, { random: false }, items)).toBe(1)
  expect(thematic.chooseNext(1, { random: false }, items)).toBe(0)
  expect(thematic.chooseNext(0, { random: true }, items)).toBe(1)
  expect(thematic.chooseNext(1, { random: true }, items)).toBe(0)
})

test('chooseLength with a length of three rotates', () => {
  const items = { userThemes: [1, 2, 3] }
  expect(thematic.chooseNext(0, { random: false }, items)).toBe(1)
  expect(thematic.chooseNext(1, { random: false }, items)).toBe(2)
  expect(thematic.chooseNext(2, { random: false }, items)).toBe(0)
})

test('getCurrentId', () => {
  expect(thematic.getCurrentId({ currentId: 'foo' }, [], {})).toBe('foo')
  expect(thematic.getCurrentId({}, [{ id: 'foo' }], {})).toBe('foo')
  expect(thematic.getCurrentId({}, [], { id: 'foo' })).toBe('foo')
})

test('getDefaultTheme', () => {
  let theme = { name: 'Default', id: 'foo' }
  expect(thematic.getDefaultTheme([theme])).toBe(theme)

  theme = { name: 'foo', id: 'default-theme@mozilla.org' }
  expect(thematic.getDefaultTheme([theme])).toBe(theme)

  theme = { name: 'foo', id: 'foo' }
  expect(thematic.getDefaultTheme([theme])).toBeUndefined()
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
    expect(browser.alarms.createCalledWith.length()).toBe(1)
    expect(browser.alarms.createCalledWith.pop()).toBe('rotate')
  })
})

test('stopRotation', () => {
  thematic.stopRotation().then(() => {
    expect(syncs['auto']).toBe(false)
    expect(browser.alarms.clearCalledWith.length()).toBe(1)
    expect(browser.alarms.clearCalledWith.pop()).toBe('rotate')
  })
})

test('rotate', () => {
  locals = {userThemes: []}
  thematic.rotate()
})
