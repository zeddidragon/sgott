const fs = require('fs')
const table = require('./sgottstrap/weapontable').variables[0].value
const text = require('./sgottstrap/weapontext').variables[0].value

const classes = [
  'Ranger',
  'Wing Diver',
  'Fencer',
  'Air Raider',
]

const categories = [
  'Assault Rifle',
  'Shotgun',
  'Sniper Rifle',
  'Rocket Launcher',
  'Missile Launcher',
  'Grenade',
  'Special',
  null,
  null,
  null,
  'Short Range',
  'Mid-Range Laser',
  'Particle Cannom',
  'Mid-Range Electric',
  'Sniper Weapon',
  'Explosive',
  'Homing',
  'Special',
  null,
  null,
  'CC Striker',
  'CC Piercer',
  'Shield',
  'Automatic Artillery',
  'Artillery',
  'Missile Launcher',
  null,
  null,
  null,
  null,
  'Guidance Equipment',
  'Calling for Support',
  'Support Equipment',
  'Limpet Gun',
  'Stationary Weapon',
  'Special Weapon',
  'Tank',
  'Ground Vehicle',
  'Helicopter',
  'Power Suit',
]

const unlockStates = [
  '',
  'Starter',
  'DLC',
  'DLC',
]

const data = table.map(({value: node}, i) => {
  const id = node[0].value
  const name = text[i].value[2].value
  const level = Math.floor(node[4].value * 25)
  const category = node[2].value
  const character = classes[Math.floor(category / 10)]
  const group = categories[category]

  return {
    id: id,
    name: name,
    level: level,
    character: character,
    category: group,
    odds: unlockStates[node[5].value] || (Math.floor(node[3].value * 100)),
  }
})

const props = [
  'character',
  'category',
  'id',
  'level',
  'name',
  'odds',
]
const html = `
<html>
<head>
  <style>
    html {
      color: white;
      background-color: black;
    }

    td {
      padding: 0.2em;
    }

    tr:nth-child(even) {
      background-color: #ffffff33;
    }

    .id {
      opacity: 0.7;
    }

    .character.Ranger {
      color: #ffaaaa;
    }
    .character.Wing.Diver {
      color: #aaaaff;
    }
    .character.Air.Raider {
      color: #aaffaa;
    }
    .character.Fencer {
      color: #aaaaaa;
    }

    .category.Assault {
      color: #ffffff;
    }
    .category.Shotgun {
      color: #ffaaaa;
    }
    .category.Sniper {
      color: #aaaaff;
    }
    .category.Rocket {
      color: #ffffaa;
    }
    .category.Missile {
      color: #aaaaaa;
    }
    .category.Grenade {
      color: #aaffaa;
    }
    .category.Special {
      color: #ffaaff;
    }

    .category.Short.Range {
      color: #ffffff;
    }
    .category.Laser {
      color: #ffaaaa;
    }
    .category.Particle {
      color: #ffaaff
    }
    .category.Electric {
      color: #aaffff
    }
    .category.Homing {
      color: #aaaaaa;
    }
    .category.Explosive {
      color: #aaffaa;
    }

    .category.Striker {
      color: #ffaaaa;
    }
    .category.Piercer {
      color: #ffffaa;
    }
    .category.Shield {
      color: #aaffff
    }
    .category.Automatic.Artillery {
      color: #ffffff
    }
    .category.Artillery {
      color: #aaaaff;
    }

    .category.Guidance {
      color: #ffaaaa;
    }
    .category.Support.Equipment {
      color: #aaffff;
    }
    .category.Calling {
      color: #ffffaa;
    }
    .category.Limpet {
      color: #aaaaff;
    }
    .category.Stationary {
      color: #aaffaa;
    }

    .category.Tank {
      color: #aaffaa;
    }
    .category.Ground {
      color: #aaaaaa;
    }
    .category.Helicopter {
      color: #aaaaff;
    }
    .category.Suit {
      color: #ffaaaa;
    }


    .odds, .level {
      text-align: right;
    }

    .odds:after {
      content: ' %';
      opacity: 0.5;
      font-size: 0.8em;
    }

    .odds {
      color: #ffaaaa;
    }

    .odds[class*="Starter"] {
      color: #aaffaa;
    }
    .odds[class*="DLC"] {
      color: #aaaaff;
    }

    .odds[class*="Starter"]:after, .odds[class*="DLC"]:after {
      content: '';
    }

    .odds[class*="100"] {
      opacity: 0.5;
    }
    .odds[class*="100"]:after {
      opacity: 1;
    }

    .odds[class*=" 1"] {
      color: inherit;
    }

  </style>
</head>
<body>
  <table>
    <thead>
      <th>Character</th>
      <th>Category</th>
      <th>ID</th>
      <th>Lvl</th>
      <th>Name</th>
      <th>Odds</th>
    </thead>
    <tbody>
      ${data.map(wpn => {
        return '<tr>' +
          props.map(p => `<td class="${p} ${wpn[p]}">${wpn[p]}</td>`).join('') +
        '</tr>'
       }).join('\n')}
    </tbody>
  </table>
</body>
`

fs.writeFileSync('docs/weapons.html', html)
