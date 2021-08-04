// vim: ts=2 sw=2 expandtab
/* global test, expect */

let menus = []

// can't be let, const, or var
browser = {
  alarms: {
    clear: function (f) { return undefined },
    onAlarm: { addListener: function (f) { return undefined } }
  },
  storage: {
    sync: {
      get: function (f) { return Promise.resolve(true) },
      set: function (f) { return Promise.resolve() }
    }
  },
  runtime: {
    onMessage: {
      addListener: function (f) { return undefined }
    }
  },
  commands: {
    onCommand: {
      addListener: function (f) { return undefined }
    }
  },
  management: {
    getAll: function (f) { return Promise.resolve() },
    setEnabled: function (f) { return undefined },
    onInstalled: { addListener: function (f) { return undefined } },
    onUninstalled: { addListener: function (f) { return undefined } }
  },
  menus: {
    create: function (item) { menus.push(item) },
    removeAll: function (f) { menus = []; return Promise.resolve() },
    onClicked: { addListener: function (f) { return undefined } }
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

const aBunchOfThemes = [
  { name: 'Theme one', id: 'one' },
  { name: 'Theme two', id: 'two' },
  { name: 'Theme three', id: 'three' },
  { name: 'Theme four', id: 'four' }
]

const thematic = require('./thematic.js')
// console.log(thematic)

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
  thematic.buildToolsMenuItem(aBunchOfThemes[0])
  expect(menus).toStrictEqual(expected)
})

