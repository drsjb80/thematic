/* global browser */
// vim: ts=2 sw=2 expandtab

console.args = function (a) { console.log(a.callee.name + ': ' + Array.from(a)) }

const preferences = ['auto', 'minutes', 'random']

const auto = document.querySelector('#auto')
const minutes = document.querySelector('#minutes')
const random = document.querySelector('#random')

function saveOptions (e) {
  console.args(arguments)
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
  console.args(arguments)
  browser.storage.sync.get(preferences).then((prefs) => {
    auto.checked = prefs.auto
    minutes.value = prefs.minutes === undefined ? 30 : prefs.minutes
    random.checked = prefs.random
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
