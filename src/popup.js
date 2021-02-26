// vim: ts=2 sw=2 expandtab

console.args = function (a){ console.log(a.callee.name + ': ' + Array.from(a)) }

// this isn't called until popup clicked for the first time and it
// disappears every time the popup disappears.

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

browser.storage.local.get().then((items) => {
  // has to be let, can't be const
  let currentDiv = document.getElementById("popup-content")
  currentDiv.addEventListener('mouseleave', (e) => {
    browser.management.setEnabled(items.currentId, true)
  })

  while (currentDiv.firstChild) {
    currentDiv.removeChild(currentDiv.firstChild);
  }

  for (let theme of items.userThemes) {
    currentDiv.appendChild(buildMenuItem(theme))
  }

  if (items.userThemes.length !== 0) {
    currentDiv.appendChild(document.createElement('hr'))
  }

  for (let theme of items.defaultThemes) {
    currentDiv.appendChild(buildMenuItem(theme))
  }
})

document.addEventListener("click", (e) => {
  currentId = e.target.id
  console.log('Setting currentId to: ' + currentId)
  browser.storage.local.set({currentId: currentId}).then(() => {
    browser.management.setEnabled(currentId, true)
      window.close()
  }).catch((err) => console.log(err))
  // i get a Uncaught TypeError: document.addEventListener(...) is undefined
  // that doesn't seem to hurt anything, so i commented the follow catch out.
})// .catch((err) => console.log(err))
