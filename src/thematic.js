/* global browser, module */
// vim: ts=2 sw=2 expandtab

'use strict'

/**
 * Finds the default theme from a list of all themes.
 * Tries by name first, then by known Mozilla IDs, then returns the first default theme.
 * @param {Array} allThemes - Array of theme objects with id and name properties
 * @returns {Object} The default theme object, or undefined if not found
 */
function getDefaultTheme (allThemes) {
  let themes = allThemes.filter(info => info.name === 'Default')
  if (themes.length > 0) {
    console.log(themes[0])
    return themes[0]
  }

  themes = allThemes.filter(info => info.id === 'default-theme@mozilla.org')
  if (themes.length > 0) {
    console.log(themes[0])
    return themes[0]
  }

  // grab the first
  for (const theme of allThemes) {
    if (isDefaultTheme(theme)) {
      console.log(theme)
      return theme
    }
  }
  console.log('No default theme found!')
}

/**
 * Checks if a theme is a built-in default theme (Mozilla or Thunderbird official).
 * @param {Object} theme - Theme object with an id property
 * @returns {boolean} True if the theme ID is in the list of default theme IDs
 */
function isDefaultTheme (theme) {
  return [
    'firefox-compact-dark@mozilla.org',
    'firefox-compact-light@mozilla.org',
    'default-theme@mozilla.org',
    'firefox-alpenglow@mozilla.org',
    'thunderbird-compact-dark@mozilla.org',
    'thunderbird-compact-light@mozilla.org',
    '{972ce4c6-7e08-4474-a285-3208198ce6fd}'
  ].includes(theme.id)
}

/**
 * Determines the current theme ID to use.
 * Priority: stored currentId > first user theme > default theme
 * @param {Object} c - Stored config with currentId property (empty object if not set)
 * @param {Array} userThemes - Array of user-installed theme objects
 * @param {Object} defaultTheme - The default theme object to fall back to
 * @returns {string} Theme ID to use as current
 */
function getCurrentId (c, userThemes, defaultTheme) {
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

/**
 * Fetches all installed themes, categorizes them, and stores the data.
 * Separates Mozilla default themes from user-installed themes.
 * Updates the tools menu and sets the current theme if not already set.
 * @async
 */
async function buildThemes () {
  const allExtensions = await browser.management.getAll()
  const allThemes = allExtensions.filter(info => info.type === 'theme')
  // console.log(allThemes)

  const c = await browser.storage.local.get('currentId')
  const defaultTheme = getDefaultTheme(allThemes)
  const defaultThemes = allThemes.filter(theme => isMozillaTheme(theme))
  const userThemes = allThemes.filter(theme => !isMozillaTheme(theme))
  const currentId = getCurrentId(c, userThemes, defaultTheme)

  const themes = {
    currentId: currentId,
    defaultTheme: defaultTheme,
    defaultThemes: defaultThemes,
    userThemes: userThemes
  }
  await browser.storage.local.set(themes)
  buildToolsMenu(themes)
}

/**
 * Checks if a theme is made by Mozilla (not a user-installed theme).
 * @param {Object} theme - Theme object with an id property
 * @returns {boolean} True if the theme ID ends with 'mozilla.org'
 */
function isMozillaTheme (theme) {
  return theme.id.endsWith('mozilla.org')
}

// https://stackoverflow.com/questions/49432579/await-is-only-valid-in-async-function
// bleah
async function buildThemesHelper () {
  await buildThemes()
}

buildThemesHelper()

/*
async function asyncHelper(fn) {
  await fn()
}

asyncHelper(buildThemes)
*/

/**
 * Chooses the next theme index to switch to.
 * If random mode is enabled, picks a random theme (different from current).
 * Otherwise cycles to the next theme in order.
 * @async
 * @param {number} currentIndex - Index of the currently active theme
 * @param {Object} items - Object containing userThemes array
 * @returns {Promise<number>} Index of the next theme to activate
 */
async function chooseNext (currentIndex, items) {
  const pref = await browser.storage.sync.get('random')
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

/**
 * Rotates to the next theme, respecting the random setting.
 * Disables the previous theme and enables the next one.
 * Logs errors if no themes are available or current theme is missing.
 * @async
 */
async function rotate () {
  const items = await browser.storage.local.get()

  if (items.userThemes.length < 1) {
    console.log('No user themes found!')
    return
  }

  if (typeof items.currentId === 'undefined') {
    console.log('No current theme Id found!')
    return
  }

  const previousId = items.currentId
  console.log('From: ' + previousId)
  const previousIndex = items.userThemes.findIndex((t) => t.id === previousId)

  if (previousIndex === -1) {
    // this will get resolved below as 1 will be added to this :/
    console.log('User theme index not found')
  } else {
    await browser.management.setEnabled(previousId, false)
  }

  const currentIndex = await chooseNext(previousIndex, items)
  const currentId = items.userThemes[currentIndex].id
  console.log('To: ' + currentId)

  await browser.storage.local.set({ currentId: currentId })
  await browser.management.setEnabled(currentId, true)
}

browser.alarms.onAlarm.addListener(rotate)

/**
 * Starts the automatic theme rotation timer (Firefox only, not supported in Thunderbird).
 * Creates an alarm that triggers the rotate function periodically.
 * @async
 */
async function startRotation () {
  const info = await browser.runtime.getBrowserInfo()
  if (info.name !== 'Thunderbird') {
    await browser.storage.sync.set({ auto: true })
    const a = await browser.storage.sync.get('minutes')
    await browser.alarms.create('rotate', { periodInMinutes: a.minutes })
  }
}

/**
 * Stops the automatic theme rotation timer (Firefox only, not supported in Thunderbird).
 * Clears any active alarm and updates the auto setting to false.
 * @async
 */
async function stopRotation () {
  const info = await browser.runtime.getBrowserInfo()
  if (info.name !== 'Thunderbird') {
    await browser.storage.sync.set({ auto: false })
    await browser.alarms.clear('rotate')
  }
}

browser.storage.sync.get('auto').then((pref) => {
  if (pref.auto) {
    startRotation().catch((err) => { console.log(err) })
  }
})

/**
 * Handles messages from the popup and options pages.
 * Supports 'Start rotation' and 'Stop rotation' commands.
 * @param {Object} request - Message object with a 'message' property
 * @param {Object} sender - Info about the message sender
 * @param {Function} sendResponse - Callback to send a response back to sender
 */
function handleMessage (request, sender, sendResponse) {
  console.log('Message from the popup or options script: ' + request.message)
  switch (request.message) {
    case 'Start rotation':
      startRotation().catch((err) => { console.log(err) })
      sendResponse({ response: 'OK' })
      break
    case 'Stop rotation':
      stopRotation().catch((err) => { console.log(err) })
      sendResponse({ response: 'OK' })
      break
    default:
      console.log('Unknown message received')
      sendResponse({ response: 'Not OK' })
      break
  }
}

browser.runtime.onMessage.addListener(handleMessage)

// allow Jest's mocking to occur
// https://stackoverflow.com/questions/25649097/nodejs-override-a-function-in-a-module
function jestTest (fn, testfn) {
  if (typeof process === 'undefined') {
    fn()
  } else {
    testfn()
  }
}

async function jestTestAwait (fn, testfn) {
  if (typeof process === 'undefined') {
    await fn()
  } else {
    await testfn()
  }
}

/**
 * Handles keyboard shortcut commands.
 * Supported commands:
 * - 'Switch to default theme': Switches to the default theme and stops auto-rotation
 * - 'Rotate to next theme': Manually rotates to the next theme
 * - 'Toggle autoswitching': Enables/disables automatic theme rotation
 * @async
 * @param {string} command - The command name to execute
 */
async function commands (command) {
  // console.log(command)
  switch (command) {
    case 'Switch to default theme':
      try {
        const c = await browser.storage.local.get('defaultTheme')
        const defaultTheme = c.defaultTheme
        await browser.storage.local.set({ currentId: defaultTheme.id })
        browser.management.setEnabled(defaultTheme.id, true)
        jestTestAwait(stopRotation, module.exports.stopRotation)
      } catch (error) {
        console.log(error.message)
      }
      break
    case 'Rotate to next theme':
      jestTest(rotate, module.exports.rotate)
      break
    case 'Toggle autoswitching':
      try {
        const c = await browser.storage.sync.get('auto')
        const auto = c.auto
        if (auto) {
          jestTestAwait(stopRotation, module.exports.stopRotation)
        } else {
          jestTestAwait(startRotation, module.exports.startRotation)
        }
        await browser.storage.sync.set({ auto: !auto })
      } catch (error) {
        console.log(error.message)
      }
      break
    default:
      console.log(`${command} not recognized`)
      break
  }
}

async function commandsHelper (command) {
  await commands(command)
}

browser.commands.onCommand.addListener(commandsHelper)

/**
 * Creates a single menu item for a theme in the Firefox tools menu.
 * @param {Object} theme - Theme object with id and name properties
 */
function buildToolsMenuItem (theme) {
  browser.menus.create({
    id: theme.id,
    type: 'normal',
    title: theme.name,
    contexts: ['tools_menu']
  })
}

/**
 * Builds the Firefox tools menu with theme options.
 * Shows user themes first, then a separator, then default themes.
 * Does nothing on Thunderbird (tools menu not supported).
 * @async
 * @param {Object} themes - Object with userThemes and defaultThemes arrays
 */
async function buildToolsMenu (themes) {
  const info = await browser.runtime.getBrowserInfo()

  if (info.name === 'Thunderbird') {
    return
  }

  await browser.menus.removeAll()

  if (themes.userThemes.length !== 0) {
    for (const theme of themes.userThemes) {
      buildToolsMenuItem(theme)
    }

    browser.menus.create({
      type: 'separator',
      contexts: ['tools_menu']
    })
  }

  for (const theme of themes.defaultThemes) {
    buildToolsMenuItem(theme)
  }
}

function extensionInstalled (info) {
  if (info.type === 'theme') {
    buildThemesHelper()
  }
}
browser.management.onInstalled.addListener(extensionInstalled)
browser.management.onUninstalled.addListener(extensionInstalled)

browser.menus.onClicked.addListener((info) => {
  console.log(info)
  const currentId = info.menuItemId
  browser.storage.local.set({ currentId: currentId }).then(() => {
    browser.management.setEnabled(currentId, true)
  }).catch((err) => { console.log(err) })
})

if (typeof module !== 'undefined') {
  module.exports = {
    isDefaultTheme,
    isMozillaTheme,
    chooseNext,
    getCurrentId,
    getDefaultTheme,
    buildToolsMenuItem,
    buildToolsMenu,
    buildThemes,
    stopRotation,
    startRotation,
    rotate,
    handleMessage,
    commands
  }
}
