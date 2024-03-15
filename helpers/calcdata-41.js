const fs = require('fs/promises')
const getNode = require('./get-node.js')
const bullets = require('./bullets.js')

bullets.assignGame(41)

function loadJson(path) {
  return fs.readFile(`data/41/${path}.json`).then(data => JSON.parse(data))
}

const classes = [
  'ranger',
  'winger',
  'fencer',
  'bomber',
]

const categories = [
  'assault',
  'shotgun',
  'sniper',
  'rocket',
  'missile',
  'grenade',
  'special',
  null,
  null,
  null,
  'short',
  'laser',
  'electro',
  'particle',
  'sniper',
  'plasma',
  'missile',
  'special',
  null,
  null,
  'hammer',
  'spear',
  'shield',
  'light',
  'heavy',
  'missile',
  null,
  null,
  null,
  null,
  'guide',
  'raid',
  'support',
  'limpet',
  'deploy',
  'special',
  'tank',
  'ground',
  'heli',
  'mech',
]

const headers = {
  ranger: [{
    category: 'assault',
    names: {
      en: 'Assault Rifle',
      ja: 'アサルトライフル',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'zoom',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'shotgun',
    names: {
      en: 'Shotguns',
      ja: 'ショットガン',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'piercing',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'sniper',
    names: {
      en: 'Sniper Rifles',
      ja: 'スナイパーライフル',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'piercing',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'zoom',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'rocket',
    names: {
      en: 'Rocket Launchers',
      ja: 'ロケットランチャー',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
      'interval',
      'reload',
      'accuracy',
      'zoom',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'missile',
    names: {
      en: 'Missile Launchers',
      ja: 'ミサイルランチャー',
    },
    appendix: '*With 0 lock time',
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
      'interval',
      'lockTime',
      'reload',
      'zoom',
      'lockRange',
      'tdps',
      'tdps2',
      'total',
    ],
  }, {
    category: 'grenade',
    names: {
      en: 'Grenades',
      ja: 'グレネード',
    },
    tables: [{
      subCategory: 'hg',
      names: {
        en: 'Hand Grenades',
        ja: 'ハンドグレネード',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'radius',
        'duration',
        'interval',
        'tdps',
      ],
    }, {
      subCategory: 'gl',
      names: {
        en: 'Grenade Launchers',
        ja: 'グレネードランチャー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'interval',
        'reload',
        'accuracy',
        'dps',
        'tdps',
        'total',
      ],
    }],
  }, {
    category: 'special',
    names: {
      en: 'Special Weapons',
      ja: '特殊',
    },
    tables: [{
      subCategory: 'decoy',
      names: {
        en: 'Decoys',
        ja: 'ピュアデコイ・ランチャー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'hp',
        'duration',
        'zoom',
        'reload',
      ],
    }, {
      subCategory: 'acid',
      names: {
        en: 'Acid Guns',
        ja: 'アシッドガン・シリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'interval',
        'reload',
        'range',
        'speed',
        'dps',
        'tdps',
        'total',
      ],
    }, {
      names: {
        en: 'Flamethrowers',
        ja: '火炎放射器シリーズ',
      },
      subCategory: 'flame',
      appendix: '*Assuming flame hits every frame of duration.',
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'damage2',
        'duration',
        'interval',
        'reload',
        'range',
        'speed',
        'dps',
        'dps2',
        'tdps',
        'tdps2',
        'total',
        'total2',
      ],
    }, {
      names: {
        en: 'Firecrackers',
        ja: 'かんしゃく玉シリーズ',
      },
      subCategory: 'firecracker',
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'radius',
        'interval',
        'range',
        'speed',
        'tdps',
        'total',
      ],
    }, {
      names: {
        en: 'Bound Guns',
        ja: 'バウンドガン・シリーズ',
      },
      subCategory: 'bound',
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'interval',
        'reload',
        'range',
        'speed',
        'dps',
        'tdps',
        'total',
      ],
    }, {
      names: {
        en: 'Reversers',
        ja: 'リバーサー',
      },
      subCategory: 'reverser',
      appendix: '*Assuming mist hits every frame of duration.',
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'interval',
        'zoom',
        'range',
        'speed',
        'dps',
        'dps2',
        'total',
        'total2',
      ],
    }],
  }],
  winger: [{
    category: 'short',
    names: {
      en: 'Short-Range',
      ja: '近距離',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'energy',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }, {
    category: 'laser',
    names: {
      en: 'Mid-Rg Lasers',
      ja: '中距離-レーザー',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'energy',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }, {
    category: 'electro',
    names: {
      en: 'Mid-Rg Electroshock',
      ja: '中距離-電撃',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'energy',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }, {
    category: 'particle',
    names: {
      en: 'Particle Cannons',
      ja: '中距離-粒子砲',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'interval',
      'accuracy',
      'energy',
      'range',
      'speed',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }, {
    category: 'sniper',
    names: {
      en: 'Sniper Weapons',
      ja: '狙撃兵器',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'reload',
      'accuracy',
      'zoom',
      'energy',
      'range',
      'speed',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }, {
    category: 'plasma',
    names: {
      en: 'Ranged Attacks',
      ja: '範囲攻撃',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'radius',
      'reload',
      'accuracy',
      'energy',
      'range',
      'speed',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }, {
    category: 'missile',
    names: {
      en: 'Homing Weapons',
      ja: 'ホーミング兵器',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'radius',
      'lockTime',
      'reload',
      'energy',
      'range',
      'speed',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }, {
    category: 'special',
    names: {
      en: 'Special Weapons',
      ja: '特殊',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'duration',
      'reload',
      'energy',
      'dps',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }],
  fencer: [{
    category: 'hammer',
    names: {
      en: 'CC Strikers',
      ja: '近接-打',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'defense',
      'chargeTime',
      'damage',
      'radius',
      'reload',
      'range',
    ],
  }, {
    category: 'spear',
    names: {
      en: 'CC Piercers',
      ja: 'ブレード系',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'piercing',
      'damage',
      'interval',
      'reload',
      'range',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'shield',
    names: {
      en: 'Shields',
      ja: '盾',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'defense',
      'reload',
      'energy',
      'range',
    ],
  }, {
    category: 'light',
    names: {
      en: 'Automatic Artillery',
      ja: '機関砲',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'interval',
      'windup',
      'reload',
      'accuracy',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'heavy',
    names: {
      en: 'Artillery',
      ja: '火砲',
    },
    tables: [{
      subCategory: 'piercing',
      names: {
        en: 'Piercing',
        ja: '重キャノン砲',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'piercing',
        'damage',
        'interval',
        'reload',
        'accuracy',
        'zoom',
        'range',
        'speed',
        'dps',
        'tdps',
        'total',
      ],
    }, {
      subCategory: 'explosive',
      names: {
        en: 'Explosives',
        ja: '迫撃砲',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'interval',
        'reload',
        'accuracy',
        'zoom',
        'range',
        'speed',
        'dps',
        'tdps',
        'total',
      ],
    }],
  }, {
    category: 'missile',
    names: {
      en: 'Missile Launchers',
      ja: 'ミサイルランチャー',
    },
    appendix: '*With 0 lock time',
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
      'interval',
      'lockTime',
      'reload',
      'lockRange',
      'tdps',
      'tdps2',
      'total',
    ],
  }],
  bomber: [{
    category: 'guide',
    names: {
      en: 'Guidance Equipment',
      ja: '誘導装置',
    },
    tables: [{
      subCategory: 'laser',
      names: {
        en: 'Laser Guide Kits',
        ja: 'レーザー誘導装置',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'accuracy',
        'range',
        'lockSpeedBoost',
        'lockRangeBoost',
      ],
    }, {
      subCategory: 'beacon',
      names: {
        en: 'Guide Beacon Guns',
        ja: '誘導ビーコンガン',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'interval',
        'accuracy',
        'range',
        'speed',
        'lockSpeedBoost',
        'lockRangeBoost',
      ],
    }],
  }, {
    category: 'raid',
    names: {
      en: 'Calling For Support',
      ja: '支援要請',
    },
    tables: [{
      subCategory: 'artillery',
      names: {
        en: 'Artillery Squad',
        ja: '砲兵隊',
      },
      appendix: '*Area for each blast',
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'shots',
        'radius',
        'subRadius',
        'reload',
        'total',
      ],
    }, {
      subCategory: 'whale',
      names: {
        en: 'Attack Whale',
        ja: '攻撃機ホエール',
      },
      appendix: '*Area for each blast',
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'shots',
        'radius',
        'subRadius',
        'reload',
        'total',
      ],
    }, {
      subCategory: 'planes',
      names: {
        en: 'Air Raids',
        ja: '爆撃機カロン＆ミッドナイト',
      },
      appendix: '*Area for each blast',
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'shots',
        'radius',
        'subRadius',
        'reload',
        'total',
      ],
    }, {
      subCategory: 'missile',
      names: {
        en: 'Missile Strikes',
        ja: 'ミサイル',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'shots',
        'radius',
        'zoom',
        'reload',
        'total',
      ],
    }, {
      subCategory: 'laser',
      names: {
        en: 'Orbital Lasers',
        ja: '攻撃機ホエール',
      },
      appendix: '*Area for each blast',
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'shots',
        'radius',
        'subRadius',
        'zoom',
        'reload',
        'total',
      ],
    }],
  }, {
    category: 'support',
    names: {
      en: 'Support Equipment',
      ja: 'サポート装置',
    },
    tables: [{
      subCategory: 'life',
      names: {
        en: 'Life Vendors',
        ja: 'ライフベンダー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'interval',
        'zoom',
        'dps',
        'total',
      ],
    }, {
      subCategory: 'plasma',
      names: {
        en: 'Plasma Chargers',
        ja: 'プラズマチャージャー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'interval',
        'zoom',
        'reload',
        'dps',
        'total',
      ],
    }, {
      subCategory: 'power',
      names: {
        en: 'Power Assists',
        ja: 'パワーポスト',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'interval',
        'zoom',
        'reload',
      ],
    }, {
      subCategory: 'guard',
      names: {
        en: 'Guard Assists',
        ja: 'ガードポスト',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'interval',
        'zoom',
        'reload',
      ],
    }],
  }, {
    category: 'limpet',
    names: {
      en: 'Limpet Guns',
      ja: 'リムペットガン',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
      'interval',
      'reload',
      'accuracy',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'deploy',
    names: {
      en: 'Stationary Weapons',
      ja: '設置兵器',
    },
    tables: [{
      subCategory: 'bomb',
      names: {
        en: 'Bombs',
        ja: 'ローラーボムシリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'interval',
        'zoom',
        'reload',
        'speed',
        'tdps',
        'total',
      ],
    }, {
      subCategory: 'mine',
      names: {
        en: 'Land Mines',
        ja: 'インパルスシリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'interval',
        'reload',
        'tdps',
        'total',
      ],
    }, {
      subCategory: 'turret',
      names: {
        en: 'Automatic Turrets',
        ja: 'ZE-GUNシリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'shots',
        'radius',
        'interval',
        'reload',
        'dps',
        'tdps',
        'total',
      ],
    }],
  }, {
    category: 'special',
    names: {
      en: 'Special Weapons',
      ja: '特殊',
    },
    tables: [{
      subCategory: 'defensive',
      names: {
        en: 'Defensive',
        ja: 'トーチカ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'hp',
        'duration',
        'zoom',
        'reload',
      ],
    }, {
      subCategory: 'wire',
      names: {
        en: 'Wire Guns',
        ja: 'ワイヤー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'interval',
        'reload',
        'range',
        'speed',
        'dps',
        'tdps',
        'total',
      ],
    }],
  }, {
    category: 'tank',
    names: {
      en: 'Tanks',
      ja: '戦闘車両',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'reload',
      'hp',
      'ammo',
      'piercing',
      'damage',
      'radius',
      'interval',
      'accuracy',
      'range',
      'speed',
      'dps',
      'total',
    ],
  }, {
    category: 'ground',
    names: {
      en: 'Ground Vehicles',
      ja: '車両',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'reload',
      'hp',
      'ammo',
      'piercing',
      'damage',
      'radius',
      'interval',
      'accuracy',
      'lockTime',
      'range',
      'speed',
      'dps',
      'total',
    ],
  }, {
    category: 'heli',
    names: {
      en: 'Helicopters',
      ja: 'ヘリ',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'reload',
      'hp',
      'ammo',
      'piercing',
      'damage',
      'radius',
      'interval',
      'accuracy',
      'lockTime',
      'range',
      'speed',
      'dps',
      'total',
    ],
  }, {
    category: 'mech',
    names: {
      en: 'Powered Exoskeletons',
      ja: 'バトルマシン',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'reload',
      'hp',
      'ammo',
      'piercing',
      'damage',
      'radius',
      'interval',
      'accuracy',
      'lockTime',
      'range',
      'speed',
      'dps',
      'total',
    ],
  }],
}

const unlockStates = [
  '',
  'starter',
  'dlc',
  'dlc',
]

const autoProps = {
  type: 'AmmoClass',
  ammo: 'AmmoCount',
  weapon: 'xgs_scene_object_class',
  damage: 'AmmoDamage',
  speed: 'AmmoSpeed',
  accuracy: 'FireAccuracy',
  radius: 'AmmoExplosion',
  gravity: 'AmmoGravityFactor',
  piercing: 'AmmoIsPenetration',
  energy: 'EnergyChargeRequire',
  life: 'AmmoAlive',
  burst: 'FireBurstCount',
  burstRate: 'FireBurstInterval',
  count: 'FireCount',
  interval: 'FireInterval',
  lockRange: 'LockonRange',
  lockTime: 'LockonTime',
  lockType: 'LockonType',
  lockDist: 'Lockon_DistributionType',
  reload: 'ReloadTime',
  credits: 'ReloadType',
  secondary: 'SecondaryFire_Type',
  zoom: 'SecondaryFire_Parameter',
  underground: 'use_underground',
  custom: 'Ammo_CustomParameter',
  wCustom: 'custom_parameter',
}

async function processWeapon({ value: node }) {
  const id = node[0].value
  const lvBuffer = new Buffer(4)
  lvBuffer.writeFloatLE(node[4].value * 25)
  const level = Math.floor(lvBuffer.readFloatLE())
  const category = node[2].value
  const character = classes[Math.floor(category / 10)]
  const group = categories[category]

  const template = await loadJson(`weapon/${id.toUpperCase()}`)
  const names = getNode(template, 'name').value
  const [ja, en] = names.map(v => v.value)
  const wpn = {
    id: id,
    names: { ja, en },
    level: level,
    character: character,
    category: group,
    odds: unlockStates[node[5].value] || (Math.floor(node[3].value * 100)),
  }

  for(const [prop, node] of Object.entries(autoProps)) {
    const v = getNode(template, node).value
    if(v) {
      wpn[prop] = v
    }
  }

  wpn.accuracy = +(wpn.accuracy || 0).toFixed(4)
  await bullets[wpn.type]?.(wpn)
  await bullets[wpn.weapon]?.(wpn)
  groups[group]?.(wpn)

  for(const prop of [
    'piercing',
    'credits',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = true
    } else {
      delete wpn[prop]
    }
  }
  for(const prop of [
    'burst',
    'count',
  ]) {
    if(wpn[prop] === 1) {
      delete wpn[prop]
    }
  }
  for(const prop of [
    'damage',
    'speed',
    'reloadInit',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = +wpn[prop].toFixed(1)
    }
  }
  if(!wpn.underground) {
    wpn.underground = 'blocked'
  } else {
    delete wpn.underground
  }
  if(wpn.energy < 0) {
    delete wpn.energy
  }

  if(wpn.character === 'ranger') {
    if(wpn.category === 'grenade') {
      if(wpn.weapon === 'Weapon_Throw') {
        wpn.subCategory = 'hg'
      } else {
        wpn.subCategory = 'gl'
      }
    } else if(wpn.category === 'special') {
      if(wpn.type === 'DecoyBullet01') {
        wpn.subCategory = 'decoy'
      } else if(wpn.type === 'AcidBullet01' && wpn.damage > 0) {
        wpn.subCategory = 'acid'
      } else if(wpn.type === 'FlameBullet02' && wpn.damage > 0) {
        wpn.subCategory = 'flame'
      } else if(wpn.type === 'GrenadeBullet01' && wpn.damage > 0) {
        wpn.subCategory = 'firecracker'
      } else if(wpn.type === 'SolidBullet01' && wpn.damage > 0) {
        wpn.subCategory = 'bound'
      } else {
        wpn.subCategory = 'reverser'
      }
    }
  } else if(wpn.character === 'fencer') {
    if(wpn.category === 'heavy') {
      if(wpn.radius) {
        wpn.subCategory = 'explosive'
      } else {
        wpn.subCategory = 'piercing'
      }
    }
  } else if(wpn.character === 'bomber') {
    if(wpn.category === 'guide') {
      if(wpn.weapon === 'Weapon_LaserMarker') {
        wpn.subCategory = 'laser'
      } else {
        wpn.subCategory = 'beacon'
      }
    } else if(wpn.category === 'raid') {
      if(wpn.names.en.endsWith('(Artillery Squad)')) {
        wpn.subCategory = 'artillery'
      } else if(wpn.names.en.endsWith('(Attack Whale)')) {
        wpn.subCategory = 'whale'
      } else if(wpn.names.en.endsWith(')')) {
        wpn.subCategory = 'planes'
      } else if(wpn.strikeType === 'missile') {
        wpn.subCategory = 'missile'
      } else {
        wpn.subCategory = 'laser'
      }
      delete wpn.strikeType
    } else if(wpn.category === 'support') {
      wpn.subCategory = wpn.supportType
    } else if(wpn.category === 'deploy') {
      if(wpn.names.en.endsWith('Impulse')) {
        wpn.subCategory = 'mine'
      } else if(wpn.type === 'BombBullet01') {
        wpn.subCategory = 'bomb'
      } else {
        wpn.subCategory = 'turret'
      }
    } else if(wpn.category === 'special') {
      if(wpn.type === 'SpiderStringBullet02') {
        wpn.subCategory = 'wire'
      } else {
        wpn.subCategory = 'defensive'
      }
    }
  }

  if(isNaN(wpn.zoom)) {
    delete wpn.zoom
  }

  delete wpn.custom
  delete wpn.wCustom

  return wpn
}

const groups = {
  support: wpn => {
    wpn.duration = wpn.life
  },
}

async function extractWeaponData() {
  const table = await loadJson('weapon/_WEAPONTABLE')
  return Promise.all(table.variables[0].value.map(processWeapon))
}

const modes = {
  GameMode_Scenario: {
    name: 'OFF',
    missions: 89,
  },
  GameMode_OnlineScenario: {
    name: 'ON',
    missions: 98,
  },
  GameMode_Versus: {
    name: 'Versus',
  },
  MissionPack01_ScenarioMode: {
    name: 'DLC1',
    missions: 26,
  },
  MissionPack01_OnlineScenarioMode: {
    name: 'DLC1',
    missions: 26,
  },
  MissionPack02_ScenarioMode: {
    name: 'DLC2',
    missions: 23,
  },
  MissionPack02_OnlineScenarioMode: {
    name: 'DLC2',
    missions: 23,
  },
}
const difficulties = [
  'Easy',
  'Normal',
  'Hard',
  'Hardest',
  'Inferno',
]
async function processMode({ value: mode }) {
  const key = mode[0].value
  const lvBuffer = Buffer.alloc(4)
  const obj = {
    ...modes[key],
    difficulties: mode[6].value.map(({ value: d }, i) => {
      const { missions } = modes[key]
      const dropsLow = Array(missions)
      const dropsHigh = Array(missions)
      const [start, end] = d[2].value.slice(0, 2).map(v => v.value)
      const spread = d[2].value[2].value
      const range = end - start
      for(let i = 0; i < missions; i++) {
        const pivot = start + (range / (missions - 1)) * i
        lvBuffer.writeFloatLE(pivot - spread)
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsLow[i] = Math.floor(lvBuffer.readFloatLE())
        lvBuffer.writeFloatLE(pivot)
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsHigh[i] = Math.ceil(lvBuffer.readFloatLE())
      }
      return {
        name: difficulties[i],
        progressScaling: d[0].value.map(v => v.value),
        playerScaling: d[1].value.map(v => +v.value.toFixed(2)),
        drops: d[2].value.slice(0, 2).map(v => +(v.value * 25).toFixed(2)),
        dropSpread: +(d[2].value[2].value * 25).toFixed(2),
        dropsLow,
        dropsHigh,
        weaponLimits: d[6].value ? d[6].value.map(v => {
          if(v.value >= 0) {
            return +(v.value * 25).toFixed(2)
          } else {
            return null
          }
        }) : -1,
        armorLimits: d[7].value ? d[7].value.map(v => v.value) : null,
      }
    }),
  }
  return obj
}
 
async function extractModesData(config) {
  const table = await loadJson(config)
  const modeList = table.variables.find(v => v.name === 'ModeList').value
  return Promise.all(modeList.slice(0, 2).map(processMode))
}

async function extractCalcdata() {
  const [
    weapons,
    modes,
    dlc1,
    dlc2,
  ] = await Promise.all([
    extractWeaponData(),
    extractModesData('CONFIG'),
    extractModesData('PACKAGE1'),
    extractModesData('PACKAGE2'),
  ])
  return {
    langs: ['en', 'ja'],
    classes: [
      'ranger',
      'winger',
      'bomber',
      'fencer',
    ],
    charLabels: [
      'Ranger',
      'Wing Diver',
      'Air Raider',
      'Fencer',
    ],
    weapons,
    headers,
    modes: [
      ...modes,
      dlc1[1],
      dlc2[1],
    ],
  }
}

module.exports = extractCalcdata
