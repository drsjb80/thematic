// vim ts=2 sw=2 expandtab

var logger = console
const nullLogger = {}
nullLogger.log = function () {}
logger.args = function (a) {
  logger.log(a.callee.name + ': ' + Array.from(a))
  // Array.from(a).forEach(e => logger.log(e))
}

logger.log('themematic.js started')

let defaultTheme
let defaultThemes
let userThemes

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
  })
}

buildThemes()

function getAllThemes(port) {
  port.postMessage({defaultTheme: defaultTheme,
    defaultThemes: defaultThemes,
    userThemes: userThemes})
}
browser.runtime.onConnect.addListener(getAllThemes)

function themeInstalled(info) {
  logger.log(info)
  if (info.type === 'theme') {
      buildThemes()
  }
}
browser.management.onInstalled.addListener(themeInstalled)

function themeUninstalled(info) {
  logger.info(info)
  if (info.type === 'theme') {
      buildThemes()
  }
}
browser.management.onUninstalled.addListener(themeUninstalled)

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
  if (defaultThemes.length < 2) {
    return
  }

  browser.storage.local.get('currentId')
    .then (function(c) {
      let currentId = c.currentId
      logger.log(currentId)

      let currentIndex = defaultThemes.findIndex((t) => t.id === currentId)
      if (currentIndex === -1) {
        console.log('Theme index not found')
        return
      }

      currentIndex = (currentIndex + 1) % defaultThemes.length
      currentId = defaultThemes[currentIndex].id

      browser.storage.local.set({currentId: currentId}).then(() => {
        browser.management.setEnabled(currentId, true)
      })
    })
  .catch(console.log)
}

browser.alarms.create('rotate', {periodInMinutes: 1})
browser.alarms.onAlarm.addListener(rotate);

function commands(command) {
  logger.log(command)
  switch (command) {
    case 'Switch to default theme':
      browser.storage.local.set({currentId: defaultTheme.id}).then(() => {
        browser.management.setEnabled(defaultTheme.id, true)
      })
      break
    case 'Rotate to next theme':
      logger.log()
      rotate()
      break
    case 'Toggle autoswitching':
      browser.storage.local.get('auto').then((pref) => {
        browser.storage.local.set({ auto: !pref.auto })
          .catch(handleError)
        logger.log(`Auto: ${!pref.auto}`)
        // give visual feedback
        if (pref.auto) rotate()
      })
      break
    default:
      // should never get here
      logger.log(`${command} not recognized`)
      break
  }
}
browser.commands.onCommand.addListener(commands)
