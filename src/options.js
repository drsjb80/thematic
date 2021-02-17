/* global browser */
// vim: ts=2 sw=2 expandtab

console.args = function (a) { console.log(a.callee.name + ': ' + Array.from(a)) }

const preferences = ['auto', 'autoMinutes', 'random']

const autoElement = document.querySelector('#auto')
const autoMinutesElement = document.querySelector('#auto-minutes')
const randomElement = document.querySelector('#random')

function saveOptions (e) {
  console.args(arguments)
  e.preventDefault()
  browser.storage.sync.set({
    auto: autoElement.checked,
    autoMinutes: parseInt(autoMinutesElement.value),
    random: randomElement.checked
  }).then(() => {
    const message = autoElement.checked ? 'Start rotation' : 'Stop rotation'
    browser.runtime.sendMessage({ message: message })
      .then(console.log, console.log)
  }).catch(console.log)
}

function loadOptions () {
  console.args(arguments)
  browser.storage.sync.get(preferences).then((prefs) => {
    autoElement.checked = prefs.auto
    autoMinutesElement.value = prefs.autoMinutes === undefined ? 30 : prefs.autoMinutes
    randomElement.checked = prefs.random
  }).catch(console.log)
}

// https://developer.mozilla.org/en-US/docs/Displaying_web_content_in_an_extension_without_security_issues
function localizeHtmlPage () {
  console.args(arguments)
  for (let obj of document.getElementsByName('i18n')) {
    obj.textContent = browser.i18n.getMessage(obj.id.toString())
  }
}

document.addEventListener('DOMContentLoaded', loadOptions)
document.addEventListener('DOMContentLoaded', localizeHtmlPage)
document.querySelector('form').addEventListener('submit', saveOptions)
