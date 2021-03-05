/* global browser */
// vim: ts=2 sw=2 expandtab

'use strict'

function getDefaultTheme(allThemes) {
  let themes = allThemes.filter(info => info.name === 'Default')
  if (themes.length > 0) {
    return themes[0]
  }

  for (let theme of allThemes) {
    if (isDefaultTheme(theme)) {
      return theme
    }
  }
  console.log('No default theme found!')
}

function getCurrentId(c, userThemes, defaultTheme) {
  if (Object.keys(c).length !== 0) {
    return c.currentId
  }

  if (userThemes.length > 0) {
    console.log('Setting currentId to first user theme')
    return userThemes[0].id
  }

  console.log('Setting currentId to default theme')
  return defaultTheme.id
}

function buildThemes () {
  browser.management.getAll().then((allExtensions) => {
    const allThemes = allExtensions.filter(info => info.type === 'theme')

    browser.storage.local.get('currentId').then((c) => {
      let defaultTheme = getDefaultTheme(allThemes)
      let defaultThemes = allThemes.filter(theme => isDefaultTheme(theme))
      let userThemes = allThemes.filter(theme => !isDefaultTheme(theme))
      let currentId = getCurrentId(c, userThemes, defaultTheme)

      const themes = {
        currentId: currentId,
        defaultTheme: defaultTheme,
        defaultThemes: defaultThemes,
        userThemes: userThemes
      }
      browser.storage.local.set(themes).then(() => {
        buildToolsMenu(themes)
      }).catch((err) => { console.log(err) })
    }).catch((err) => { console.log(err) })
  }).catch((err) => { console.log(err) })
}

function isDefaultTheme (theme) {
  return [
    'firefox-compact-dark@mozilla.org@personas.mozilla.org',
    'firefox-compact-light@mozilla.org@personas.mozilla.org',
    'firefox-compact-dark@mozilla.org',
    'firefox-compact-light@mozilla.org',
    'default-theme@mozilla.org',
    'firefox-alpenglow@mozilla.org',
    'thunderbird-compact-dark@mozilla.org',
    'thunderbird-compact-light@mozilla.org',
    '{972ce4c6-7e08-4474-a285-3208198ce6fd}'
  ].includes(theme.id)
}

if (typeof process !== 'undefined') {
  exports.isDefaultTheme = isDefaultTheme
  exports.chooseNext = chooseNext
  exports.getCurrentId = getCurrentId
  exports.getDefaultTheme = getDefaultTheme
  exports.buildToolsMenuItem = buildToolsMenuItem
}

function chooseNext(currentIndex, pref, items) {
  if (pref.random) {
    let newIndex = currentIndex
    while (newIndex === currentIndex) {
      const a = Math.floor(Math.random() * items.userThemes.length)
      newIndex = a
    }
    return newIndex
  }
  return (currentIndex + 1) % items.userThemes.length
}

function rotate () {
  browser.storage.local.get().then((items) => {
    if (items.userThemes.length <= 1) {
      return
    }

    let currentId = items.currentId
    let currentIndex = items.userThemes.findIndex((t) => t.id === currentId)

    if (currentIndex === -1) {
      // this will get resolved below as 1 will be added to this :/
      console.log('User theme index not found')
    }

    browser.storage.sync.get('random').then((pref) => {
      currentIndex = chooseNext(currentIndex, pref, items)
      currentId = items.userThemes[currentIndex].id
      console.log(currentId)

      browser.storage.local.set({ currentId: currentId }).then(() => {
        browser.management.setEnabled(currentId, true)
      }).catch((err) => console.log(err))
    }).catch((err) => console.log(err))
  }).catch((err) => console.log(err))
}
browser.alarms.onAlarm.addListener(rotate)

function startRotation () {
  browser.runtime.getBrowserInfo().then((info) => {
    if (info.name !== 'Thunderbird') {
      browser.storage.sync.set({ auto: true }).then(() => {
        browser.alarms.clear('rotate')
        browser.storage.sync.get('minutes').then(a => {
          browser.alarms.create('rotate', { periodInMinutes: a.minutes })
        }).catch((err) => console.log(err))
      }).catch((err) => console.log(err))
    }
  }).catch((err) => console.log(err))
}

function stopRotation () {
  browser.runtime.getBrowserInfo().then((info) => {
    if (info.name !== 'Thunderbird') {
      browser.storage.sync.set({ auto: false }).then(() => {
        browser.alarms.clear('rotate')
      }).catch((err) => console.log(err))
    }
  }).catch((err) => console.log(err))
}

browser.storage.sync.get('auto').then((pref) => {
  console.log(pref)
  if (pref.auto) {
    startRotation()
  }
})

function handleMessage (request, sender, sendResponse) {
  console.log('Message from the popup or options script: ' + request.message)
  switch (request.message) {
    case 'Start rotation':
      startRotation()
      sendResponse({ response: 'OK' })
      break
    case 'Stop rotation':
      stopRotation()
      sendResponse({ response: 'OK' })
      break
    default:
      console.log('Unknown message received')
  }
}
browser.runtime.onMessage.addListener(handleMessage)

function commands (command) {
  switch (command) {
    case 'Switch to default theme':
      browser.storage.local.get('defaultTheme').then((c) => {
        let defaultTheme = c.defaultTheme
        browser.storage.local.set({ currentId: defaultTheme.id }).then(() => {
          browser.management.setEnabled(defaultTheme.id, true)
          stopRotation()
        })
      })
      break
    case 'Rotate to next theme':
      rotate()
      break
    case 'Toggle autoswitching':
      browser.storage.sync.get('auto').then((pref) => {
        if (pref.auto) {
          stopRotation()
        } else {
          startRotation()
          rotate()
        }
        browser.storage.sync.set({ auto: !pref.auto })
          .catch(console.log)
      })
      break
    default:
      console.log(`${command} not recognized`)
      break
  }
}
browser.commands.onCommand.addListener(commands)

function buildToolsMenuItem(theme) {
  browser.menus.create({
    id: theme.id,
    type: 'normal',
    title: theme.name,
    contexts: ["tools_menu"]
  })
}

function buildToolsMenu(themes) {
  browser.runtime.getBrowserInfo().then((info) => {
    if (info.name !== 'Thunderbird') {
      browser.menus.removeAll().then(() => {
        for (let theme of themes.userThemes) {
          buildToolsMenuItem(theme)
        }

        if (themes.userThemes.length !== 0) {
          browser.menus.create({
            type: 'separator',
            contexts: ["tools_menu"]
          })
        }

        for (let theme of themes.defaultThemes) {
          buildToolsMenuItem(theme)
        }
      }).catch((err) => console.log(err))
    }
  }).catch((err) => console.log(err))
}

buildThemes()

function extensionInstalled (info) {
  if (info.type === 'theme') {
    buildThemes()
  }
}
browser.management.onInstalled.addListener(extensionInstalled)
browser.management.onUninstalled.addListener(extensionInstalled)

browser.menus.onClicked.addListener((info) => {
  console.log(info)
  let currentId = info.menuItemId
  browser.storage.local.set({currentId: currentId}).then(() => {
    browser.management.setEnabled(currentId, true)
  }).catch((err) => console.log(err))
})
