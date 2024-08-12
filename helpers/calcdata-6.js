const fs = require('fs/promises')
const getNode = require('./get-node.js')
const bullets = require('./bullets.js')

bullets.assignGame(6)

function loadJson(path) {
  return fs.readFile(`data/6/${path}.json`).then(data => JSON.parse(data))
}

const classes = [
  'ranger',
  'winger',
  'fencer',
  'bomber',
]

const categories = {
  ranger: {
    0: 'assault',
    1: 'shotgun',
    2: 'sniper',
    3: 'rocket',
    4: 'missile',
    5: 'grenade',
    6: 'special',
    7: 'equipment',
    8: 'tank',
    9: 'heli',
    10: 'bike',
    20: 'handgrenade',
    23: 'specialgrenade',
    21: 'bomb',
    22: 'deploy',
  },
  winger: {
    100: 'short',
    101: 'laser',
    102: 'electro',
    103: 'particle',
    104: 'sniper',
    105: 'plasma',
    106: 'missile',
    110: 'special',
    111: 'saber',
    112: 'trap',
    113: 'shield',
    115: 'submissile',
    116: 'cannon',
    114: 'super',
    120: 'core',
  },
  fencer: {
    200: 'hammer',
    201: 'spear',
    202: 'shield',
    203: 'light',
    204: 'heavy',
    205: 'missile',
    206: 'booster',
    207: 'protector',
    208: 'muzzle',
    209: 'exo',
  },
  bomber: {
    302: 'support',
    303: 'limpet',
    304: 'deploy',
    305: 'special',
    306: 'tank',
    307: 'ground',
    308: 'heli',
    309: 'mech',
    310: 'artillery',
    311: 'gunship',
    312: 'planes',
    313: 'missile',
    314: 'satellite',
    320: 'super',
  },
}

const unlockStates = [
  '',
  'starter',
  'dlc',
  'dlc',
]

const autoProps = {
  falloff: 'AmmoDamageReduce',
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
  xParams: 'ExtPrams',
}

const headers = {
  ranger: [{
    category: 'assault',
    names: {
      en: 'Assault Rifle',
      ja: 'アサルトライフル',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'piercing',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'zoom',
      'piercingRange',
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
      'stars',
      'level',
      'name',
      'ammo',
      'piercing',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'piercingRange',
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
      'stars',
      'level',
      'name',
      'ammo',
      'piercing',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'zoom',
      'piercingRange',
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
      'stars',
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
      'stars',
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
    headers: [
      'checkbox',
      'stars',
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
  }, {
    category: 'special',
    names: {
      en: 'Special Weapons',
      ja: '特殊',
    },
    tables: [{
      subCategory: 'acid',
      names: {
        en: 'Acid Guns',
        ja: 'アシッドガン・シリーズ',
      },
      headers: [
        'checkbox',
        'stars',
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
        'stars',
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
        en: 'Bound Guns',
        ja: 'バウンドガン・シリーズ',
      },
      subCategory: 'bound',
      headers: [
        'checkbox',
        'stars',
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
        'stars',
        'level',
        'name',
        'ammo',
        'damage',
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
  }, {
    category: 'handgrenade',
    names: {
      en: 'Hand Grenades',
      ja: '手榴弾',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
      'duration',
      'reload',
      'range',
      'speed',
      'tdps',
    ],
  }, {
    category: 'specialgrenade',
    names: {
      en: 'Special Throwing Grenades',
      ja: '特殊投擲弾',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'damage',
      'duration',
      'reload',
      'range',
      'speed',
      'tdps',
    ],
  }, {
    category: 'bomb',
    names: {
      en: 'Bombs and Traps',
      ja: '爆弾・トラップ',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
      'interval',
      'reload',
      'speed',
      'tdps',
      'total',
    ],
  }, {
    category: 'deploy',
    names: {
      en: 'Automatic Gun Placements',
      ja: '自動砲座',
    },
    tables: [{
      subCategory: 'decoy',
      names: {
        en: 'Decoys',
        ja: 'ピュアデコイ・ランチャー',
      },
      headers: [
        'checkbox',
        'stars',
        'level',
        'name',
        'ammo',
        'hp',
        'duration',
        'reload',
      ],
    }, {
      subCategory: 'turret',
      names: {
        en: 'Automatic Turrets',
        ja: 'ZE-GUNシリーズ',
      },
      appendix: '*For a single turret',
      headers: [
        'checkbox',
        'stars',
        'level',
        'name',
        'ammo',
        'damage',
        'shots',
        'radius',
        'interval',
        'reload',
        'dps',
        'dps2',
        'tdps',
        'total',
      ],
    }],
  }, {
    category: 'equipment',
    names: {
      en: 'Support Equipment',
      ja: '補助装備',
    },
    tables: [{
      subCategory: 'armor',
      names: {
        en: 'Armor',
        ja: 'プロテクター',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'knockdownImmunity',
        'speed',
        'hitSlowdown',
        'sprintBreakObstacles',
        'sprintSpeedBoost',
        'sprintTurnBoost',
        'sprintAccelerationBoost',
        'sprintHitSlowdown',
      ],
    }, {
      subCategory: 'lock',
      names: {
        en: 'Lock-On Devices',
        ja: 'レーダー支援システム',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'lockSpeedBoost',
        'lockRangeBoost',
        'lockMulti',
      ],
    }, {
      subCategory: 'probe',
      names: {
        en: 'Probe / Relief Assistance',
        ja: '救護支援装備',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'healAllyBoost',
        'probeRadius',
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
      'stars',
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
    category: 'bike',
    names: {
      en: 'Bikes',
      ja: 'バイク',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'reload',
      'hp',
      'fuel',
      'fuelUse',
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
      'stars',
      'level',
      'name',
      'reload',
      'hp',
      'fuel',
      'fuelUse',
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
  winger: [{
    category: 'short',
    names: {
      en: 'Short-Range',
      ja: '近距離',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'piercing',
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
      'stars',
      'level',
      'name',
      'ammo',
      'piercing',
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
      'stars',
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
      'stars',
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
    category: 'sniper',
    names: {
      en: 'Sniper Weapons',
      ja: '狙撃兵器',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'piercing',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'zoom',
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
    category: 'plasma',
    names: {
      en: 'Ranged Attacks',
      ja: '範囲攻撃',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
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
    category: 'missile',
    names: {
      en: 'Homing Weapons',
      ja: 'ホーミング兵器',
    },
    headers: [
      'checkbox',
      'stars',
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
      ja: 'パワーグレネード',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'damage',
      'reload',
      'tdps',
      'total',
    ],
  }, {
    category: 'saber',
    names: {
      en: 'Sabers',
      ja: 'セイバー',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'drain',
      'damage',
      'reload',
      'total',
    ],
  }, {
    category: 'shield',
    names: {
      en: 'Shields',
      ja: 'シールド',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'duration',
      'reload',
    ],
  }, {
    category: 'trap',
    names: {
      en: 'Traps',
      ja: 'トラップ',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'damage',
      'duration',
      'reload',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'cannon',
    names: {
      en: 'Cannons',
      ja: 'キャノン',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'damage',
      'duration',
      'reload',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'submissile',
    names: {
      en: 'Guided Missiles',
      ja: '誘導兵器',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'damage',
      'reload',
      'lockRange',
      'tdps',
      'total',
    ],
  }, {
    category: 'super',
    names: {
      en: 'Super Weapons',
      ja: 'スーパーウエポン',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'damage',
      'duration',
      'reload',
      'dps',
      'total',
    ],
  }, {
    category: 'core',
    names: {
      en: 'Cores',
      ja: 'プラズマコア',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'energy',
      'chargeRate',
      'chargeRatio',
      'chargeEmergencyRate',
      'chargeEmergencyRatio',
      'energyUse',
      'energyUseRatio',
      'boostUse',
      'boostUseRatio',
      'speed',
      'flightBoost',
      'dashForwardBoost',
      'dashBackwardBoost',
      'dashSideBoost',
      'airControl',
      'reloadBoost',
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
      'stars',
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
      'stars',
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
      'stars',
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
      'stars',
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
        'stars',
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
        'stars',
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
      'stars',
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
  }, {
    category: 'booster',
    names: {
      en: 'Enhanced Boosters',
      ja: '補助装備',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'dashCount',
      'boostCount',
      'dashCooldown',
      'boostSpeed',
      'convertible',
    ],
  }, {
    category: 'protector',
    names: {
      en: 'Enhanced Shields',
      ja: 'シールド強化',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'defense',
      'range',
      'shieldUse',
      'shieldReflectUse',
      'shieldKnockback',
    ],
  }, {
    category: 'muzzle',
    names: {
      en: 'Enhanced Cannons',
      ja: '砲撃強化',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'recoil',
    ],
  }, {
    category: 'exo',
    names: {
      en: 'Enhanced Exoskeleton',
      ja: 'スケルトン強化',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'speed',
      'dashCount',
      'equipWalkReduction',
      'equipTurnReduction',
      'recoil',
      'knockdownImmunity',
      'hitSlowdown',
      'lockSpeedBoost',
      'lockRangeBoost',
      'healAllyBoost',
      'probeRadius',
    ],
  }],
  bomber: [{
    category: 'artillery',
    names: {
      en: 'Request Artillery Units',
      ja: '砲兵隊',
    },
    appendix: '*Area for each blast',
    headers: [
      'checkbox',
      'stars',
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
    category: 'gunship',
    names: {
      en: 'Request Gunships',
      ja: '攻撃機ホエール',
    },
    appendix: '*For barrage shots',
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'ammo',
      'damage',
      'shots',
      'radius',
      'subRadius',
      'interval',
      'interval2',
      'reload',
      'zoom',
      'range',
      'speed',
      'dps',
      'dps2',
      'tdps',
      'total',
    ],
  }, {
    category: 'planes',
    names: {
      en: 'Request Bombers',
      ja: '爆撃機カロン＆ミッドナイト',
    },
    appendix: '*Area for each blast',
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'damage',
      'shots',
      'radius',
      'subRadius',
      'duration',
      'reload',
      'total',
    ],
  }, {
    category: 'missile',
    names: {
      en: 'Request Missiles',
      ja: 'ミサイル',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'damage',
      'shots',
      'radius',
      'credits',
      'reload',
      'zoom',
      'range',
      'tdps',
      'total',
    ],
  }, {
    category: 'satellite',
    names: {
      en: 'Request Satellites',
      ja: '攻撃機ホエール',
    },
    headers: [
      'checkbox',
      'stars',
      'level',
      'name',
      'damage',
      'shots',
      'radius',
      'credits',
      'reload',
      'zoom',
      'range',
      'tdps',
      'total',
    ],
  }, {
    category: 'support',
    names: {
      en: 'Support Equipment',
      ja: 'サポート装置',
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
        'zoom',
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
        'zoom',
        'range',
        'speed',
        'lockSpeedBoost',
        'lockRangeBoost',
      ],
    }, {
      subCategory: 'life',
      names: {
        en: 'Life Vendors',
        ja: 'ライフベンダー',
      },
      headers: [
        'checkbox',
        'stars',
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
      subCategory: 'power',
      names: {
        en: 'Power Assists',
        ja: 'パワーポスト',
      },
      headers: [
        'checkbox',
        'stars',
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
        'stars',
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
      'stars',
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
        'stars',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'interval',
        'reload',
        'zoom',
        'speed',
        'tdps',
        'total',
      ],
    }, {
      subCategory: 'turret',
      names: {
        en: 'Automatic Turrets',
        ja: 'ZE-GUNシリーズ',
      },
      appendix: '*For a single turret',
      headers: [
        'checkbox',
        'stars',
        'level',
        'name',
        'ammo',
        'damage',
        'shots',
        'radius',
        'interval',
        'reload',
        'dps',
        'dps2',
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
        'stars',
        'level',
        'name',
        'ammo',
        'hp',
        'duration',
        'zoom',
        'reload',
      ],
    }, {
      subCategory: 'shotgun',
      names: {
        en: 'Suppress Gun',
        ja: 'サプレスガン',
      },
      headers: [
        'checkbox',
        'stars',
        'level',
        'name',
        'ammo',
        'piercing',
        'damage',
        'interval',
        'reload',
        'range',
        'piercingRange',
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
      'stars',
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
      'stars',
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
      'stars',
      'level',
      'name',
      'reload',
      'hp',
      'fuel',
      'fuelUse',
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
      'stars',
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
    category: 'super',
    names: {
      en: 'Special Vehicles',
      ja: '特殊兵器',
    },
    headers: [
      'checkbox',
      'stars',
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

async function processWeapon({ value: node }) {
  const id = node[0].value
  const lvBuffer = Buffer.alloc(4)
  lvBuffer.writeFloatLE(node[4].value * 25)
  const level = Math.floor(lvBuffer.readFloatLE())
  const category = node[2].value
  const character = classes[Math.floor(category / 100)]
  const group = categories[character][category]
  if(!group) {
    throw new Error(`Category not found: ${category} (${node[1].value})`)
  }

  const template = await loadJson(`weapon/${id.toUpperCase()}`)
  const wpn = {
    id: id,
    names: Object.fromEntries(['en', 'ja'].map(lang => {
      return [lang, getNode(template, `name.${lang}`).value]
    })),
    level: level,
    character: character,
    category: group,
    raw: category,
    odds: unlockStates[node[5].value] || (Math.floor(node[3].value * 100)),
    dlc: node[8].value,
  }
  if(!wpn.dlc) {
    delete wpn.dlc
  }

  for(const [prop, node] of Object.entries(autoProps)) {
    const value = getNode(template, node).value
    const isArray = Array.isArray(value)
    const isSubArray = Array.isArray(value?.[0]?.value)
    if(['custom', 'wCustom'].includes(prop)) {
      wpn[prop] = value
    } else if(isSubArray && value[0].value.length
      || isArray && value.length === 7
    ) {
      const arr = isSubArray ? value[0].value : value
      wpn[prop] = {
        base:  +arr[0].value.toFixed(4),
        algo:  +arr[1].value,
        lvMax: Math.max(5, +arr[3].value),
        zero:  +arr[4].value.toFixed(2),
        exp:   +arr[5].value.toFixed(2),
        type: arr[6].value === 0 ? 'int' : 'float',
      }
    } else if (isArray && value.length === 1){
      wpn[prop] = value[0].value
    } else if (isArray) {
      wpn[prop] = value.map(v => v.value)
    } else if(typeof value === 'number' && !isNaN(value)) {
      wpn[prop] = +value.toFixed(2)
    } else {
      wpn[prop] = value
    }
  }

  if(wpn.energy[0] === -1) wpn.energy = -1
  if(Array.isArray(wpn.energy)) {
    wpn.energy = wpn.energy[0]
  }
  if(wpn.falloff?.[0] === 1 && wpn.falloff?.[1] === 1) {
    delete wpn.falloff
  }

  await bullets[wpn.type]?.(wpn)
  await bullets[wpn.weapon]?.(wpn)

  for(const prop of [
    'piercing',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = true
    } else {
      delete wpn[prop]
    }
  }
  if(wpn.credits === 2) {
    wpn.credits = true
  } else {
    delete wpn.credits
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
    if(Array.isArray(wpn[prop])) {
      wpn[prop][0] = +wpn[prop][0].toFixed(1)
    } else if(wpn[prop]?.base) {
      wpn[prop].base = +wpn[prop].base.toFixed(1)
    } else if(wpn[prop]) {
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
  if(wpn.reload < 0) {
    delete wpn.reload
  }
  if(!wpn.zoom && !wpn.secondary) {
    delete wpn.zoom
    delete wpn.secondary
  }

  for(const prop of [
    'accuracy',
    'radius',
    'gravity',
    'burstRate',
    'interval',
    'lockRange',
    'lockTime',
    'lockType',
    'lockDist',
  ]) {
    if(!wpn[prop]) {
      delete wpn[prop]
    }
  }

  if(wpn.character === 'ranger') {
    if(wpn.category === 'grenade') {
      if(wpn.weapon === 'Weapon_Throw') {
        wpn.subCategory = 'hg'
      } else {
        wpn.subCategory = 'gl'
      }
    } else if(wpn.category === 'deploy') {
      if(wpn.type === 'DecoyBullet01') {
        wpn.subCategory = 'decoy'
      } else {
        wpn.subCategory = 'turret'
      }
    } else if(wpn.category === 'special') {
      const damage = wpn.damage?.base || wpn.damage
      if(wpn.type === 'AcidBullet01' && damage > 0) {
        wpn.subCategory = 'acid'
      } else if(wpn.type === 'FlameBullet02' && damage > 0) {
        wpn.subCategory = 'flame'
      } else if(wpn.type === 'SolidBullet01') {
        wpn.subCategory = 'bound'
      } else {
        wpn.subCategory = 'reverser'
      }
    } else if(wpn.category === 'equipment') {
      if(wpn.itemRange || wpn.allyRecovery) {
        wpn.subCategory = 'probe'
      } else if(wpn.isMultiLock || wpn.lockRange || wpn.lockSpeed) {
        wpn.subCategory = 'lock'
      } else {
        wpn.subCategory = 'armor'
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
    } else if(wpn.category === 'support') {
      if(wpn.weapon === 'Weapon_LaserMarker') {
        wpn.subCategory = 'laser'
      } else if(wpn.type === 'TargetMarkerBullet01') {
        wpn.subCategory = 'beacon'
      } else {
        wpn.subCategory = wpn.supportType
      }
    } else if(wpn.category === 'deploy') {
      if(wpn.type === 'BombBullet01') {
        wpn.subCategory = 'bomb'
      } else {
        wpn.subCategory = 'turret'
      }
    } else if(wpn.category === 'special') {
      if(wpn.type === 'SolidPelletBullet01') {
        wpn.subCategory = 'shotgun'
      } else {
        wpn.subCategory = 'defensive'
      }
    }
  }

  delete wpn.custom
  delete wpn.wCustom
  delete wpn.custom
  delete wpn.wCustom
  delete wpn.xParams

  return wpn
}

async function extractWeaponData() {
  const table = await loadJson('weapon/WEAPONTABLE')
  const arr = []
  for(const v of table.variables[0].value) {
    arr.push(processWeapon(v))
  }
  return Promise.all(arr).then(arr => arr.filter(w => w))
}

const modes = {
  GameMode_Scenario: {
    name: 'OFF',
  },
  GameMode_OnlineScenario: {
    name: 'ON',
  },
  GameMode_Offline_MissionPack01: {
    name: 'DLC1',
  },
  GameMode_Online_MissionPack01: {
    name: 'DLC1',
  },
  GameMode_Offline_MissionPack02: {
    name: 'DLC2',
  },
  GameMode_Online_MissionPack02: {
    name: 'DLC2',
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
  const missionListPath = mode[6].value[0].value
    .replace('app:/', '')
    .replace('.sgo', '')
    .toUpperCase()
    .replace('MISSION/', 'Mission/')
  const missionList = (await loadJson(missionListPath))
    .variables[0]
    .value
  const missions = missionList.length
  const obj = {
    ...modes[key],
    missions,
    difficulties: mode[7].value.map(({ value: d }, i) => {
      const dropsLow = Array(missions)
      const dropsHigh = Array(missions)
      const [start, end] = d[2].value.slice(0, 2).map(v => v.value)
      const spread = d[2].value[2].value
      const range = end - start
      for(let i = 0; i < missions; i++) {
        const mission = missionList[i].value
        const pivot = start + range * mission[0].value / missions
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
  return Promise.all([
    ...modeList.slice(0, 3),
    modeList[4],
  ].map(processMode))
}

async function extractCalcdata() {
  const [
    weapons,
    modes,
  ] = await Promise.all([
    extractWeaponData(),
    extractModesData('config'),
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
    headers,
    weapons,
    modes,
  }
}

module.exports = extractCalcdata
