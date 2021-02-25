/* global browser */
// vim: ts=2 sw=2 expandtab

console.args = function (a){ console.log(a.callee.name + ': ' + Array.from(a)) }

console.log('themematic.js started')

let themes = {
  currentId: undefined,
  defaultThemes: undefined,
  userThemes: undefined
}
let userThemes
let defaultTheme
let defaultThemes

function getDefaultTheme(allThemes) {
  console.args(arguments)

  themes = allThemes.filter(info => info.name === 'Default')
  if (themes !== []) {
    return themes[0]
  } else {
    for (const theme in allThemes) {
      if (isDefaultTheme(theme)) {
        return theme
      }
    }
    console.log('No default theme found!')
  }
}

function buildThemes () {
  console.args(arguments)

  browser.management.getAll().then((allExtensions) => {
    console.log(allExtensions)
    const allThemes = allExtensions.filter(info => info.type === 'theme')
    console.log(allThemes)

    defaultTheme = getDefaultTheme(allThemes)
    defaultThemes = allThemes.filter(theme => isDefaultTheme(theme))
    userThemes = allThemes.filter(theme => !isDefaultTheme(theme))

    browser.storage.local.get('currentId').then((c) => {
      console.log(c)
      let currentId

      if (Object.keys(c).length !== 0) {
        currentId = c.currentId
      } else {
        if (userThemes.length > 0) {
          console.log('Setting currentId to first user theme')
          currentId = userTheme[0].id
        } else {
          console.log('Setting currentId to default theme')
          currentId = defaultTheme.id
        }
      }

      browser.storage.local.set({ currentId: currentId }).then(() => {
        console.log(`Setting currentId to ${currentId}`)
        themes = {
          currentId: currentId,
          defaultThemes: defaultThemes,
          userThemes: userThemes
        }
        console.log(themes)
      }).catch((err) => {
        console.log(err)
      })
    })
  })
}

buildThemes()

function extensionInstalled (info) {
  console.args(arguments)
  if (info.type === 'theme') {
    buildThemes()
    buildToolsMenu()
  }
}
browser.management.onInstalled.addListener(extensionInstalled)
browser.management.onUninstalled.addListener(extensionInstalled)

function isDefaultTheme (theme) {
  console.args(arguments)
  let a = [
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
  return a
}

function rotate () {
  console.args(arguments)

  if (userThemes.length <= 1) {
    return
  }

  browser.storage.local.get('currentId').then((c) => {
    let currentId = c.currentId

    let currentIndex = userThemes.findIndex((t) => t.id === currentId)
    if (currentIndex === -1) {
      console.log('User theme index not found')
    }

    browser.storage.sync.get('random').then((pref) => {
      if (pref.random) {
        let newIndex = currentIndex
        console.log(currentIndex)
        while (newIndex === currentIndex) {
          const a = Math.floor(Math.random() * userThemes.length)
          console.log(a)
          newIndex = a
        }
        currentIndex = newIndex
        console.log(currentIndex)
      } else {
        currentIndex = (currentIndex + 1) % userThemes.length
      }
      currentId = userThemes[currentIndex].id

      browser.storage.local.set({ currentId: currentId }).then(() => {
        browser.management.setEnabled(currentId, true)
      })
    }).catch(console.log)
  }).catch(console.log)
}
browser.alarms.onAlarm.addListener(rotate)

function startRotation () {
  console.args(arguments)
  browser.storage.sync.set({ auto: true }).then(() => {
    browser.alarms.clear('rotate')
    browser.storage.sync.get('autoMinutes').then(a => {
      browser.alarms.create('rotate', { periodInMinutes: a.autoMinutes })
    })
  })
}

function stopRotation () {
  console.args(arguments)
  browser.storage.sync.set({ auto: false }).then(() => {
    browser.alarms.clear('rotate')
  })
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
    case 'Get all themes':
      // so currentId might not be valid.
      // maybe just save all three separately.
      sendResponse(themes)
      break
    case 'Rebuild themes':
      buildThemes()
      sendResponse({ response: 'OK' })
      break
    default:
      console.log('Unknown message received')
  }
}
browser.runtime.onMessage.addListener(handleMessage)

function commands (command) {
  console.args(arguments)
  switch (command) {
    case 'Switch to default theme':
      browser.storage.local.set({ currentId: defaultTheme.id }).then(() => {
        browser.management.setEnabled(defaultTheme.id, true)
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
      // should never get here
      console.log(`${command} not recognized`)
      break
  }
}
browser.commands.onCommand.addListener(commands)

function buildToolsMenu() {
  browser.menus.removeAll().then(() => {
    for (let theme of userThemes) {
      browser.menus.create({
        id: theme.id,
        type: 'normal',
        title: theme.name,
        contexts: ["tools_menu"]
      })
    }

    if (userThemes.length !== 0) {
      browser.menus.create({
        type: 'separator',
        contexts: ["tools_menu"]
      })
    }

    for (let theme of defaultThemes) {
      browser.menus.create({
        id: theme.id,
        type: 'normal',
        title: theme.name,
        contexts: ["tools_menu"]
      })
    }
  })
}

buildToolsMenu()

browser.menus.onClicked.addListener((info) => {
  console.log(info)
  currentId = info.menuItemId
  browser.storage.local.set({currentId: currentId}).then(() => {
    browser.management.setEnabled(currentId, true).then(() => {
      buildThemes ()
    })
  })
})
