/* global browser */
// vim: ts=2 sw=2 expandtab

'use strict'

if (typeof process === 'undefined') {
  var module = {}
}

module.exports = {
  isDefaultTheme,
  chooseNext,
  getCurrentId,
  getDefaultTheme,
  buildToolsMenuItem,
  buildThemes,
  stopRotation,
  startRotation,
  rotate,
  handleMessage,
  commands
}

function getDefaultTheme (allThemes) {
  const themes = allThemes.filter(info => info.name === 'Default')
  if (themes.length > 0) {
    return themes[0]
  }

  for (const theme of allThemes) {
    if (isDefaultTheme(theme)) {
      return theme
    }
  }
  console.log('No default theme found!')
}

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

async function buildThemes () {
  const allExtensions = await browser.management.getAll()
  const allThemes = allExtensions.filter(info => info.type === 'theme')

  const c = await browser.storage.local.get('currentId')
  const defaultTheme = getDefaultTheme(allThemes)
  const defaultThemes = allThemes.filter(theme => isDefaultTheme(theme))
  const userThemes = allThemes.filter(theme => !isDefaultTheme(theme))
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

function isDefaultTheme (theme) {
  return [
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
}

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

  let currentId = items.currentId
  let currentIndex = items.userThemes.findIndex((t) => t.id === currentId)

  if (currentIndex === -1) {
    // this will get resolved below as 1 will be added to this :/
    console.log('User theme index not found')
  }

  currentIndex = await chooseNext(currentIndex, items)
  currentId = items.userThemes[currentIndex].id
  console.log(currentId)

  await browser.storage.local.set({ currentId: currentId })
  browser.management.setEnabled(currentId, true)
}

browser.alarms.onAlarm.addListener(rotate)

async function startRotation () {
  const info = await browser.runtime.getBrowserInfo()
  if (info.name !== 'Thunderbird') {
    await browser.storage.sync.set({ auto: true })
    const a = await browser.storage.sync.get('minutes')
    await browser.alarms.create('rotate', { periodInMinutes: a.minutes })
  }
}

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
      browser.storage.sync.get('auto').then((pref) => {
        if (pref.auto) {
          stopRotation().catch((err) => { console.log(err) })
          browser.storage.sync.set({ auto: false }).catch((err) => {
            console.log(err)
          })
        } else {
          startRotation().catch((err) => { console.log(err) })
          rotate()
          browser.storage.sync.set({ auto: true }).catch((err) => {
            console.log(err)
          })
        }
      }).catch((err) => { console.log(err) })
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

function buildToolsMenuItem (theme) {
  browser.menus.create({
    id: theme.id,
    type: 'normal',
    title: theme.name,
    contexts: ['tools_menu']
  })
}

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
