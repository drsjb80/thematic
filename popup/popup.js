// vim: ts=2 sw=2 expandtab

console.args = function (a){ console.log(a.callee.name + ': ' + Array.from(a)) }

// this isn't called until popup clicked for the first time and it
// disappears every time the popup disappears.

let currentId

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
browser.storage.local.get('currentId')
  .then(initial => { currentId = initial.currentId })
  .catch(console.log)

function buildMenuItem(theme) {
  console.args(arguments)

  let newChoice = document.createElement("div")
  newChoice.setAttribute('id', theme.id)
  newChoice.setAttribute('class', 'button')
  newChoice.textContent = theme.name
  newChoice.addEventListener('mouseenter', (e) => {
    browser.management.setEnabled(e.target.id, true)
  })
  return newChoice
}

function buildMenu(message) {
  console.args(arguments)

  // has to be let, can't be const
  let currentDiv = document.getElementById("popup-content")
  currentDiv.addEventListener('mouseleave', (e) => {
    browser.management.setEnabled(currentId, true)
  })

  while (currentDiv.firstChild) {
    currentDiv.removeChild(currentDiv.firstChild);
  }

  for (let theme of message.userThemes) {
    currentDiv.appendChild(buildMenuItem(theme))
  }

  if (message.userThemes.length != 0) {
    currentDiv.appendChild(document.createElement('hr'))
  }

  for (let theme of message.defaultThemes) {
    currentDiv.appendChild(buildMenuItem(theme))
  }
}

browser.runtime.sendMessage({message: 'Get all themes'}).then((m) => {
  buildMenu(m)
}).catch(console.log)

document.addEventListener("click", (e) => {
  currentId = e.target.id
  browser.storage.local.set({currentId: currentId}).then(() => {
    browser.management.setEnabled(currentId, true)
    // get promise resolved before window closes to avoid a warning.
    window.close()
  })
})
