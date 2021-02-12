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

let themePromise = browser.management.getAll()
themePromise.then ((allExtensions) => {
  allThemes = allExtensions.filter(info => info.type === 'theme')
  if (allThemes === []) {
    logger.log('No themes found!')
  }

  defaultTheme = allThemes.filter(info => info.name === 'Default')
  if (defaultTheme === []) {
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

getDefaultThemes = function(request, sender, sendResponse) {
  logger.args(arguments)
  sendResponse(defaultThemes)
}
browser.runtime.onMessage.addListener(getDefaultThemes)

/*
management.onInstalled
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

