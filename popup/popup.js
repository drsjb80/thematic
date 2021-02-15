// vim: ts=2 sw=2 expandtab

// this isn't called until popup clicked for the first time

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
let current
browser.storage.local.get('current')
  .then(initial => { current = initial.current })
  .catch(console.log)

function handleResponse(message) {
  console.log(message)

  console.log(current)

  // has to be let, can't be const
  let currentDiv = document.getElementById("popup-content")
  for (theme of message.defaultThemes) {
    let newChoice = document.createElement("div")
    newChoice.setAttribute('id', theme.id)
    newChoice.setAttribute('class', 'button')
    newChoice.textContent = theme.name
    newChoice.addEventListener('mouseenter', (e) => {
      browser.management.setEnabled(e.target.id, true)
    })
    newChoice.addEventListener('mouseleave', (e) => {
      browser.management.setEnabled(current, true)
    })
    currentDiv.appendChild(newChoice);
  }
}

browser.runtime.onMessage.addListener(handleResponse)

let myPort = browser.runtime.connect("drsjb80@gmail.com")
myPort.onMessage.addListener(handleResponse)
myPort.postMessage()

document.addEventListener("click", (e) => {
  // get promise resolved before window closes
  browser.storage.local.set({current: e.target.id}).then(() => {
    current = e.target.id
    browser.management.setEnabled(e.target.id, true)
    window.close()
  })
})

