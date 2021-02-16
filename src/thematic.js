/* global browser */
// vim: ts=2 sw=2 expandtab

console.args = function (a){ console.log(a.callee.name + ': ' + Array.from(a)) }

console.log('themematic.js started')

let themes
let userThemes
let defaultTheme
let defaultThemes

function buildThemes () {
  console.args(arguments)

  const themePromise = browser.management.getAll()
  themePromise.then((allExtensions) => {
    const allThemes = allExtensions.filter(info => info.type === 'theme')
    if (allThemes === []) {
      console.log('No themes found!')
      themes = {
        defaultTheme: undefined,
        defaultThemes: undefined,
        userThemes: undefined
      }
      return
    }

    defaultTheme = allThemes.filter(info => info.name === 'Default')
    if (defaultTheme !== []) {
      defaultTheme = defaultTheme[0]
    } else {
      for (const theme in allThemes) {
        if (isDefaultTheme(theme)) {
          defaultTheme = theme
          break
        }
      }
      console.log('No default theme found!')
    }

    defaultThemes = allThemes.filter(isDefaultTheme)
    userThemes = allThemes.filter(theme => !isDefaultTheme(theme))

    themes = {
      defaultTheme: defaultTheme,
      defaultThemes: defaultThemes,
      userThemes: userThemes
    }
  })
}

buildThemes()

function extensionInstalled (info) {
  console.args(arguments)
  if (info.type === 'theme') {
    buildThemes()
  }
}
browser.management.onInstalled.addListener(extensionInstalled)

function extensionUninstalled (info) {
  console.args(arguments)
  if (info.type === 'theme') {
    buildThemes()
  }
}
browser.management.onUninstalled.addListener(extensionUninstalled)

function isDefaultTheme (theme) {
  console.args(arguments)
  return ([
    'firefox-compact-dark@mozilla.org@personas.mozilla.org',
    'firefox-compact-light@mozilla.org@personas.mozilla.org',
    'firefox-compact-dark@mozilla.org',
    'firefox-compact-light@mozilla.org',
    'default-theme@mozilla.org',
    'firefox-alpenglow@mozilla.org',
    '{972ce4c6-7e08-4474-a285-3208198ce6fd}'
  ].includes(theme.id))
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
    .catch(console.log)
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
  console.log('Message from the content script: ' + request.message)
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
      sendResponse(themes)
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
