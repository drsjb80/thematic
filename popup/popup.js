// vim: ts=2 sw=2 expandtab

// this isn't called until popup clicked for the first time and it
// disappears every time the popup disappears.

let currentId

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
browser.storage.local.get('currentId')
  .then(initial => { currentId = initial.currentId })
  .catch(console.log)

function buildMenuItem(theme) {
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
  console.log(message)

  // has to be let, can't be const
  let currentDiv = document.getElementById("popup-content")
  currentDiv.addEventListener('mouseleave', (e) => {
    browser.management.setEnabled(currentId, true)
  })

  while (currentDiv.firstChild) {
    currentDiv.removeChild(currentDiv.firstChild);
  }

  for (theme of message.userThemes) {
    currentDiv.appendChild(buildMenuItem(theme))
  }
  for (theme of message.defaultThemes) {
    currentDiv.appendChild(buildMenuItem(theme))
  }
}

let myPort = browser.runtime.connect("drsjb80@gmail.com")
myPort.onMessage.addListener(buildMenu)
myPort.postMessage() // need to initiate where the connect is

document.addEventListener("click", (e) => {
  currentId = e.target.id
  browser.storage.local.set({currentId: currentId}).then(() => {
    browser.management.setEnabled(currentId, true)
    // get promise resolved before window closes to avoid a warning.
    window.close()
  })
})
