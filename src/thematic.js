var logger = console
const nullLogger = {}
nullLogger.log = function () {}
logger.args = function (a) {
  logger.log(a.callee.name + ': ' + Array.from(a))
}

logger.log('themematic.js started')

let allThemes
let defaultTheme
let defaultThemes

function getAllThemes() {
  let themePromise = browser.management.getAll()
  themePromise.then ((allExtensions) => {
    allThemes = allExtensions.filter(info => info.type === 'theme')
    if (allThemes === []) {
      logger.log('No themes found!')
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
      logger.log('No default themes found!')
    }

    defaultThemes = allThemes.filter(isDefaultTheme)
    userThemes = allThemes.filter(theme => !isDefaultTheme(theme))
  })
}

getThemes = function(request, sender, sendResponse) {
  logger.args(arguments)
  sendResponse({defaultTheme: defaultTheme, defaultThemes: defaultThemes, userThemes: userThemes})
}
browser.runtime.onMessage.addListener(getThemes)

browser.management.onInstalled.addListener(function() {
  logger.args(arguments)
  getAllThemes()
})

/*
    Fired when an add-on is installed.
management.onUninstalled
    Fired when an add-on is uninstalled.
*/

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

browser.commands.onCommand.addListener(function (command) {
  logger.log(command)
  switch (command) {
    case 'Switch to default theme':
      activateDefaultTheme()
      break
    case 'Rotate to next theme':
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
})

