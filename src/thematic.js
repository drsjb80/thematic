// vim ts=2 sw=2 expandtab

var logger = console
const nullLogger = {}
nullLogger.log = function () {}
logger.args = function (a) {
  logger.log(a.callee.name + ': ' + Array.from(a))
  // Array.from(a).forEach(e => logger.log(e))
}

logger.log('themematic.js started')

let myPort

function getAllThemes(port) {
  logger.args(arguments)

  myPort = port

  let themePromise = browser.management.getAll()
  themePromise.then ((allExtensions) => {
    let allThemes = allExtensions.filter(info => info.type === 'theme')
    if (allThemes === []) {
      logger.log('No themes found!')
      port.postMessage({defaultTheme: undefined, defaultThemes: undefined,
        userThemes: undefined})
      return
    }

    let defaultTheme = allThemes.filter(info => info.name === 'Default')
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

    port.postMessage({defaultTheme: defaultTheme,
      defaultThemes: allThemes.filter(isDefaultTheme),
      userThemes: allThemes.filter(theme => !isDefaultTheme(theme))})
  })
}

browser.runtime.onConnect.addListener(getAllThemes)

function themeInstalled(info) {
  logger.log(info)
  if (info.type === 'theme') {
      getAllThemes(myPort)
  }
}
browser.management.onInstalled.addListener(themeInstalled)

function themeUninstalled(info) {
  logger.info(info)
  if (info.type === 'theme') {
      getAllThemes(myPort)
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

browser.commands.onCommand.addListener(function (command) {
  logger.log(command)
  /*
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
  */
})
