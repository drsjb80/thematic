// vim: ts=2 sw=2 expandtab

'use strict'

function saveOptions (e) {
  console.log('saveOptions')
  e.preventDefault()
  browser.storage.sync.set({
    auto: auto.checked,
    minutes: parseInt(minutes.value),
    random: random.checked
  }).then(() => {
    const message = auto.checked ? 'Start rotation' : 'Stop rotation'
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
  for (let obj of document.getElementsByClassName('i18n')) {
    console.log('obj: ' + obj)
    obj.textContent = browser.i18n.getMessage(obj.id.toString())
  }
}

document.addEventListener('DOMContentLoaded', loadOptions)
document.addEventListener('DOMContentLoaded', localizeHtmlPage)
document.querySelector('form').addEventListener('submit', saveOptions)
