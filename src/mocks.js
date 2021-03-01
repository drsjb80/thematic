// vim: ts=2 sw=2 expandtab

browser = {
  alarms: {
    clear: function(f) {},
    onAlarm: { addListener: function(f) {}, },
  },
  storage: {
    sync: {
      get: function(f) { return Promise.resolve() },
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
    create: function(f) {},
    removeAll: function(f) { return Promise.resolve() },
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
