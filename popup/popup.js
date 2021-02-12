let themes

function handleResponse(message) {
  themes = message

  // has to be let, can't be const
  let currentDiv = document.getElementById("popup-content")
  for (theme of message) {
    let newChoice = document.createElement("div")
    newChoice.setAttribute('id', theme.id)
    newChoice.setAttribute('class', 'button')
    newChoice.textContent = theme.name
    currentDiv.appendChild(newChoice);
  }
}

function handleError(error) {
  console.log(`Error: ${error}`)
}

let send = browser.runtime.sendMessage({})
send.then(handleResponse, handleError)

document.addEventListener("click", (e) => {
  console.log(`In listenForClicks with ${e.target.id}`)
  browser.management.setEnabled(e.target.id, true)
  window.close()
})
