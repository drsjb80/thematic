// vim: ts=2 sw=2 expandtab

let themes

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
function setToCurrent() {
  let c = browser.storage.local.get('current')
  c.then(current => {browser.management.setEnabled(current.current, true)})
   .catch(current => {browser.management.setEnabled(themes.defaultTheme, true)})
}

function handleResponse(message) {
  themes = message

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
      setToCurrent()
    })
    currentDiv.appendChild(newChoice);
  }
}

function handleError(error) {
  console.log(`Error: ${error}`)
}

// get the initial themes
let send = browser.runtime.sendMessage({})
send.then(handleResponse, handleError)

function themesChanged(themes) {
  // clear out divs
  // call handleResponse with request
}
browser.runtime.onMessage.addListener(themesChanged)

document.addEventListener("click", (e) => {
  // get promise resolved before window closes
  browser.storage.local.set({current: e.target.id}).then(() => {
    browser.management.setEnabled(e.target.id, true)
    window.close()
  })
})

