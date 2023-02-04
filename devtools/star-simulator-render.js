function round(v) {
  return v.toFixed(!v ? 0 : v < 10 ? 2 : v < 50 ? 1 : 0)
}

function roundUp(v) {
  if(v < 10) {
    return (Math.ceil(v * 100) / 100).toFixed(2)
  } else if(v < 50) {
    return (Math.ceil(v * 10) / 100).toFixed(1)
  } else {
    return Math.ceil(v)
  }
}

function render(weapons, maxes) {
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

        .dmg {
          display: flex;
          flex: 1;
        }

        .min, .max {
          width: 5em;
          padding: 0 0.5em;
        }

        .min {
          text-align: right;
        }

        .scale {
          flex: 1;
          display: flex;
          max-width: 30em;
        }

        .bar {
          background-color: #323232;
          height: 1em;
        }

        .zero {
          width: 0;
        }
        
        .mark {
          visibility: hidden;
          position: relative;
          text-align: right;
          left: 100%;
          bottom: 1em;
          cursor: pointer;
          width: 0;
        }

        .bar:nth-child(even) {
          background-color: #484848;
        }

        .bar.void {
          visibility: hidden;
        }

        .attr-label {
          width: 8em;
        }

        .weapon {
          display: flex;
        }
      </style>
    </head>
    <body>
      <h1>EDF4.1 Weapon List</h1>
  `)

  for(const weapon of weapons) {
    if(!weapon.damage) continue
    console.log(`<h3>${weapon.name}</h3>`)
    console.log('<div class="weapon">')
    console.log(`<span class="attr-label">Damage</span>`)
    console.log(`<div class="dmg">`)
    console.log(`<div class="scale">`)
    let previous = 0
    const max = +roundUp(maxes[weapon.category] / 10000) * 10000
    if(typeof weapon.damage === 'object') {
      for(let i = weapon.damage.minLevel; i <= weapon.damage.maxLevel; i++) {
        const damage = weapon.damage.values[i]
        const ratio = Math.ceil((damage - previous) * 1000)
        const markClass
          = i === weapon.damage.minLevel ? ' min-mark'
          : i === 5  ? ' base-mark'
          : i === weapon.damage.maxLevel ? ' max-mark'
          : ''
        console.log(`
          <span class="bar" style="flex: ${ratio}">
            <div class="mark${markClass}">${i}* ${round(damage)}</div>
          </span>
        `)
        previous = damage
      }
    } else {
      const ratio = Math.ceil(weapon.damage * 1000)
      console.log(`<span class="bar" style="flex: ${ratio}" title="${round(weapon.damage)}"></span>`)
      previous = weapon.damage
    }
    const ratio = Math.floor((max - previous) * 1000)
    console.log(`<span class="bar void" style="flex: ${ratio}"}"></span>`)
    //console.log(`<span class="max">${round(max || 0)}</span>`)
    console.log(`</div>`)
    console.log(`</div>`)
    console.log('</div>')
  }

  console.log(`
    </body>
  </html>
`)
}

export default render
