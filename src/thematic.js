// vim: ts=2 sw=2 expandtab

var logger = console
const nullLogger = {}
nullLogger.log = function () {}
logger.args = function (a) { logger.log(a.callee.name + ': ' + Array.from(a)) }

logger.log('themematic.js started')

let themes
let userThemes
let defaultTheme
let defaultThemes

function buildThemes() {
  logger.args(arguments)

  let themePromise = browser.management.getAll()
  themePromise.then ((allExtensions) => {
    let allThemes = allExtensions.filter(info => info.type === 'theme')
    if (allThemes === []) {
      logger.log('No themes found!')
      port.postMessage({defaultTheme: undefined, defaultThemes: undefined,
        userThemes: undefined})
      return
    }

    defaultTheme = allThemes.filter(info => info.name === 'Default')
    if (defaultTheme !== []) {
      defaultTheme = defaultTheme[0]
    } else {
      for (theme in allThemes) {
        if (isDefaultTheme(theme)) {
          defaultTheme = theme
          break
        }
      }
      logger.log('No default theme found!')
    }

    defaultThemes = allThemes.filter(isDefaultTheme)
    userThemes = allThemes.filter(theme => !isDefaultTheme(theme))

    themes = {defaultTheme: defaultTheme,
      defaultThemes: defaultThemes,
      userThemes: userThemes}
  })
}

buildThemes()

function getAllThemes(port) {
  logger.args(arguments)
  port.postMessage(themes)
}
browser.runtime.onConnect.addListener(getAllThemes)

function extensionInstalled(info) {
  logger.args(arguments)
  if (info.type === 'theme') {
      buildThemes()
  }
}
browser.management.onInstalled.addListener(extensionInstalled)

function extensionUninstalled(info) {
  logger.args(arguments)
  if (info.type === 'theme') {
      buildThemes()
  }
}
browser.management.onUninstalled.addListener(extensionUninstalled)

function isDefaultTheme (theme) {
  logger.args(arguments)
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

function rotate() {
  logger.args(arguments)

  if (userThemes.length <= 0) {
    return
  }

  browser.storage.local.get('currentId')
    .then (function(c) {
      let currentId = c.currentId

      let currentIndex = userThemes.findIndex((t) => t.id === currentId)
      if (currentIndex === -1) {
        console.log('User theme index not found')
        /*
          complete hack:
          1) we know there is at least one user theme from above.
          2) the currentId must be a default them or we would have found it.
          3) set currentIndex to -1 as it will be incremented to 0 below.
        */
        currentIndex = -1
      }

      currentIndex = (currentIndex + 1) % userThemes.length
      currentId = userThemes[currentIndex].id

      browser.storage.local.set({currentId: currentId}).then(() => {
        browser.management.setEnabled(currentId, true)
      })
    })
  .catch(console.log)
}

function startRotation() {
  logger.args(arguments)
  browser.storage.sync.get('auto').then((pref) => {
    browser.alarms.create('rotate', {periodInMinutes: 1})
    browser.alarms.onAlarm.addListener(rotate);
  })
}

function stopRotation() {
  logger.args(arguments)
  browser.alarms.clear('rotate')
}

browser.storage.sync.get('auto').then((pref) => {
  logger.log(pref)
  if (pref.auto) {
    startRotation()
  }
})

function commands(command) {
  logger.args(arguments)
  switch (command) {
    case 'Switch to default theme':
      browser.storage.local.set({currentId: defaultTheme.id}).then(() => {
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
      logger.log(`${command} not recognized`)
      break
  }
}
browser.commands.onCommand.addListener(commands)
