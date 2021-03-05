// vim: ts=2 sw=2 expandtab

let menus = []

browser = {
  alarms: {
    clear: function(f) {},
    onAlarm: { addListener: function(f) {}, },
  },
  storage: {
    sync: {
      get: function(f) { return Promise.resolve(true) },
      set: function(f) { return Promise.resolve() },
    },
  },
  runtime: {
    onMessage: {
      addListener: function(f) {},
    },
  },
  commands: {
    onCommand: {
      addListener: function(f) {},
    },
  },
  management: {
    getAll: function(f) { return Promise.resolve() },
    setEnabled: function(f) {},
    onInstalled: { addListener: function(f) {} },
    onUninstalled: { addListener: function(f) {} },
  },
  menus: {
    create: function(item) { menus.push(item) },
    removeAll: function(f) { menus = []; return Promise.resolve() },
    onClicked: { addListener: function(f) {} },
  },
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

aBunchOfThemes = [
  {name: 'Theme one', id: 'one'},
  {name: 'Theme two', id: 'two'},
  {name: 'Theme three', id: 'three'},
  {name: 'Theme four', id: 'four'},
]

const thematic = require('./thematic.js')
// console.log(thematic)

test('isDefaultTheme', () => {
  expect(thematic.isDefaultTheme({id: 'foo'})).toBe(false)
  expect(thematic.isDefaultTheme({id: 'default-theme@mozilla.org'})).toBe(true)
});

test('chooseLength with a length of two is always the other one', () => {
  items = {userThemes: [1,2]}
  expect(thematic.chooseNext(0, {random: false}, items)).toBe(1)
  expect(thematic.chooseNext(1, {random: false}, items)).toBe(0)
  expect(thematic.chooseNext(0, {random: true}, items)).toBe(1)
  expect(thematic.chooseNext(1, {random: true}, items)).toBe(0)
});

test('chooseLength with a length of three rotates', () => {
  items = {userThemes: [1,2,3]}
  expect(thematic.chooseNext(0, {random: false}, items)).toBe(1)
  expect(thematic.chooseNext(1, {random: false}, items)).toBe(2)
  expect(thematic.chooseNext(2, {random: false}, items)).toBe(0)
});

test('getCurrentId', () => {
  expect(thematic.getCurrentId({currentId: 'foo'}, [], {})).toBe('foo')
  expect(thematic.getCurrentId({}, [{id: 'foo'}], {})).toBe('foo')
  expect(thematic.getCurrentId({}, [], {id: 'foo'})).toBe('foo')
})

test('getDefaultTheme', () => {
  theme = {name: 'Default', id: 'foo'}
  expect(thematic.getDefaultTheme([theme])).toBe(theme)

  theme = {name: 'foo', id: 'default-theme@mozilla.org'}
  expect(thematic.getDefaultTheme([theme])).toBe(theme)

  theme = {name: 'foo', id: 'foo'}
  expect(thematic.getDefaultTheme([theme])).toBeUndefined()
})

test('buildToolsMenuItem', () => {
  expected = [{ id: 'one', type: 'normal', title: 'Theme one', contexts: [ 'tools_menu' ]}]
  thematic.buildToolsMenuItem(aBunchOfThemes[0])
  expect(menus).toStrictEqual(expected)
})
