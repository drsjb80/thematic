var logger = console
const nullLogger = {}
nullLogger.log = function () {}
logger.args = function (a) {
  logger.log(a.callee.name + ': ' + Array.from(a))
}

let themePromise = browser.management.getAll()
themePromise.then ((allExtensions) => {
  const allThemes = allExtensions.filter(info => info.type === 'theme')
  defaultThemes = allThemes.filter(isDefaultTheme)
  userThemes = allThemes.filter(theme => !isDefaultTheme(theme))
})

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

