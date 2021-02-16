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

  if (userThemes.length <= 1) {
    return
  }

  browser.storage.local.get('currentId').then ((c) => {
    let currentId = c.currentId

    let currentIndex = userThemes.findIndex((t) => t.id === currentId)
    if (currentIndex === -1) {
      console.log('User theme index not found')
    }

    browser.storage.sync.get('random').then((pref) => {
      if (pref.random) {
        let newIndex = currentIndex
        logger.log(currentIndex)
        while (newIndex === currentIndex) {
          let a = Math.floor(Math.random() * userThemes.length)
          logger.log(a)
          newIndex = a
        }
        currentIndex = newIndex
        logger.log(currentIndex)
      } else {
        currentIndex = (currentIndex + 1) % userThemes.length
      }
      currentId = userThemes[currentIndex].id

      browser.storage.local.set({currentId: currentId}).then(() => {
        browser.management.setEnabled(currentId, true)
      })
    }).catch(console.log)
  }).catch(console.log)
  .catch(console.log)
}
browser.alarms.onAlarm.addListener(rotate);

function startRotation() {
  logger.args(arguments)
  browser.storage.sync.set({ auto: true }).then(() => {
    browser.alarms.clear('rotate')
    browser.storage.sync.get('autoMinutes').then(a => {
      browser.alarms.create('rotate', {periodInMinutes: a.autoMinutes})
    })
  })
}

function stopRotation() {
  logger.args(arguments)
  browser.storage.sync.set({ auto: false }).then(() => {
    browser.alarms.clear('rotate')
  })
}

browser.storage.sync.get('auto').then((pref) => {
  logger.log(pref)
  if (pref.auto) {
    startRotation()
  }
})

function handleMessage(request, sender, sendResponse) {
  console.log("Message from the content script: " + request.message);
  switch (request.message) {
    case 'Start rotation':
      startRotation()
      break
    case 'Stop rotation':
      stopRotation()
      break
    default:
      logger.log('Unknown message sent')
  }
  sendResponse({response: "OK"})
}
browser.runtime.onMessage.addListener(handleMessage);

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
