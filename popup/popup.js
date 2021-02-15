// vim: ts=2 sw=2 expandtab

// this isn't called until popup clicked for the first time

let currentId
let themes

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
browser.storage.local.get('currentId')
  .then(initial => { currentId = initial.currentId })
  .catch(console.log)


function handleResponse(message) {
  console.log(message)
  themes = message.defaultThemes // change to userThemes

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
      browser.management.setEnabled(currentId, true)
    })
    currentDiv.appendChild(newChoice);
  }
}

browser.runtime.onMessage.addListener(handleResponse)

let myPort = browser.runtime.connect("drsjb80@gmail.com")
myPort.onMessage.addListener(handleResponse)
myPort.postMessage() // need to initiate where the connect is

function rotate() {
  if (themes.length < 2) {
    return
  }

  currentIndex = themes.findIndex((t) => t.id === currentId)
  if (currentIndex === -1) {
    console.log('Theme index not found')
    return
  }

  currentIndex = (currentIndex + 1) % themes.length
  currentId = themes[currentIndex].id

  browser.storage.local.set({currentId: currentId}).then(() => {
    browser.management.setEnabled(currentId, true)
  })
}

document.addEventListener("click", (e) => {
  currentId = e.target.id
  browser.storage.local.set({currentId: currentId}).then(() => {
    browser.management.setEnabled(e.target.id, true)
    // get promise resolved before window closes
    window.close()
  })
})

