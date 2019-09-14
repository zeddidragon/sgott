const text = require('../data/41/weapons/_WEAPONTEXT.json')
const chr = 0

console.log(`
<html>
  <head>
    <meta charset="UTF-8">
    <title>EDF4.1 Weapons</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        color: #fafafa;
        background-color: #141414;
        font-family: "Helvetica Neue", Meiryo, sans-serif;
        max-width: 48em;
      }
      p {
        color: #80c3f5;
        padding-left: 1em;
      }

      @media only screen and (min-width: 1024px) {
        body {
          padding-left: 2em;
        }
      }
    </style>
  </head>
  <body>
    <h1>EDF4.1 Weapon List</h1>
`)

for(const entry of text.variables[0].value) {
  const name = entry.value[2].value
  const text = entry.value[3].value
  console.log(`<h3>${name}</h3>`)
  console.log('<section>')
  console.log(text
    .replace(/<font.*color=.*ffffff.*>/, '<pre class="stats">')
    .replace(/<font.*color=.*00ffff.*>/, '</pre><pre class="vehicle">')
    .replace(/<font.*color=.*808080.*>/, '</pre><pre class="vehicle-legend">')
    .replace(/<font.*>/, '</pre><p class="description">')
  )
  console.log('</p></section>')
}

console.log(`
  </body>
</html>
`)
