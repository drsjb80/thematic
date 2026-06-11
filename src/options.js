// vim: ts=2 sw=2 expandtab
/* global browser */

'use strict'

function saveOptions (e) {
  console.log('saveOptions')
  e.preventDefault()
  const autoEl = document.getElementById('auto')
  const minutesEl = document.getElementById('minutes')
  const randomEl = document.getElementById('random')
  browser.storage.sync.set({
    auto: autoEl.checked,
    minutes: parseInt(minutesEl.value, 10),
    random: randomEl.checked
  }).then(() => {
    const message = autoEl.checked ? 'Start rotation' : 'Stop rotation'
    browser.runtime.sendMessage({ message: message })
      .then(console.log, console.log)
  }).catch(console.log)
}

function loadOptions () {
  console.log('loadOptions')
  browser.storage.sync.get().then((prefs) => {
    document.getElementById('auto').checked =
      prefs.auto === undefined ? false : prefs.auto
    document.getElementById('minutes').value =
      prefs.minutes === undefined ? 30 : prefs.minutes
    document.getElementById('random').checked =
      prefs.random === undefined ? false : prefs.random
  }).catch(console.log)
}

// https://developer.mozilla.org/en-US/docs/Displaying_web_content_in_an_extension_without_security_issues
function localizeHtmlPage () {
  for (const obj of document.getElementsByClassName('i18n')) {
    console.log('obj: ' + obj)
    obj.textContent = browser.i18n.getMessage(obj.id.toString())
  }
}

document.addEventListener('DOMContentLoaded', loadOptions)
document.addEventListener('DOMContentLoaded', localizeHtmlPage)
document.querySelector('form').addEventListener('submit', saveOptions)
