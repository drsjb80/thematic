// vim: ts=2 sw=2 expandtab

let themes

function setToCurrent() {
  browser.storage.local.get('current').then((current) => {
    browser.management.setEnabled(current.current, true)
  })
}

function handleResponse(message) {
  themes = message

  // has to be let, can't be const
  let currentDiv = document.getElementById("popup-content")
  for (theme of message.default) {
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

let send = browser.runtime.sendMessage({})
send.then(handleResponse, handleError)

function themesChanged(themes) {
  // clear out divs
  // call handleResponse with request
}
browser.runtime.onMessage.addListener(themesChanged)

document.addEventListener("click", (e) => {
  browser.management.setEnabled(e.target.id, true)
  browser.storage.local.set({current: e.target.id}).catch(console.log)
  window.close()
})

