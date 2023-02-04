export default {
  ModeList: [
    [
      'GameMode_Scenario', // Title translation key
      'GameMode_DescScenario', // Title description translation key
      'off_scenario.%LOCALE%.dds', // Picture ??
      'BGM_E5S02_EDFHonbu', // Music
      'MAIN.GST', // ????
      [ // Image on the side or something
        'app:/Mission/MissionList.offline.list.sgo',
        'app:/Mission/MissionList.offline.txt.%LOCALE%.sgo',
        'app:/Mission/MissionList.offline.image.rab'
      ],
      [
        [
          [ 5, 15 ],
          [ 1, 1, 1, 1 ],
          [ 0, 0.949999988079071, 0.20000000298023224 ],
          [ 1, 1, 1 ],
          [ 1, 0.75 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 10, 24 ],
          [ 1, 1, 1, 1 ],
          [ 0, 1, 0.20000000298023224 ],
          [ 1, 1, 1 ],
          [ 0.5, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 20, 60 ],
          [ 1, 1, 1, 1 ],
          [ 0.10000000149011612, 2, 0.25 ],
          [ 1, 1, 1 ],
          [ 0.75, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 70, 150 ],
          [ 1, 1, 1, 1 ],
          [ 1.7599999904632568, 3, 0.30000001192092896 ],
          [ 1, 1, 1 ],
          [ 1, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 160, 280 ],
          [ 1, 1, 1, 1 ],
          [ 2, 4, 1 ],
          [ 1, 1, 1 ],
          [ 1.25, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ]
      ],
      0,
      0,
      0,
      0,
      [ 1, 2 ]
    ],
    [
      'GameMode_OnlineScenario',
      'GameMode_DescOnlineScenario',
      'on_scenario.%LOCALE%.dds',
      'BGM_E5S02_EDFHonbu',
      'MAIN.GST',
      [
        'app:/Mission/MissionList.online.list.sgo',
        'app:/Mission/MissionList.online.txt.%LOCALE%.sgo',
        'app:/Mission/MissionList.online.image.rab'
      ],
      [
        [
          [ 5, 15 ],
          [
            1.2000000476837158,
            0.800000011920929,
            1,
            1.2000000476837158
          ],
          [ 0, 0.949999988079071, 0.20000000298023224 ],
          [ 1.7999999523162842, 1.5, 1 ],
          [ 1, 0.75 ],
          [ 1.7999999523162842, 1.7999999523162842 ],
          [ 0.10000000149011612, 1.100000023841858 ],
          [ 350, 2000 ]
        ],
        [
          [ 10, 25 ],
          [
            1.2000000476837158,
            0.800000011920929,
            1,
            1.2000000476837158
          ],
          [ 0, 1, 0.20000000298023224 ],
          [ 2.4000000953674316, 2, 1 ],
          [ 1, 0.5 ],
          [ 2, 1.5 ],
          [ 0.10000000149011612, 1.100000023841858 ],
          [ 350, 2000 ]
        ],
        [
          [ 20, 60 ],
          [
            1.2000000476837158,
            0.8999999761581421,
            1.0499999523162842,
            1.2000000476837158
          ],
          [ 0.10000000149011612, 2, 0.25 ],
          [ 2.299999952316284, 2, 1 ],
          [ 1.25, 0.5 ],
          [ 2, 1.5 ],
          [ 0.20000000298023224, 2.0999999046325684 ],
          [ 700, 4500 ]
        ],
        [
          [ 70, 150 ],
          [
            1.2000000476837158,
            1,
            1.100000023841858,
            1.2000000476837158
          ],
          [ 1.7599999904632568, 3, 0.30000001192092896 ],
          [ 2.200000047683716, 2, 1 ],
          [ 1.5, 0.5 ],
          [ 1.75, 1.5 ],
          [ 2.0999999046325684, 3.0999999046325684 ],
          [ 4500, 8000 ]
        ],
        [
          [ 160, 280 ], // Base scaling by mission [first, ..., last]
          [ 1.2, 1.1, 1.15, 1.2, ], // Enemy scaling by player count [1,2,3,4]
          [ 2, 4, 1 ], // Drop range by mission [first, last, negative spread]
          [ 2.200000047683716, 2, 1 ], // Enemy scaling [hp, dmg, ???]
          [ 1.5, 0.5 ], // NPC infantry scaling [hp, dmg]
          [ 1.5, 1.5 ], // NPC vehicle scaling [hp, dmg]
          [ 2.4, 3.2, 3.999, 3.999 ], // Weapon limit [first, ..., last]
          [ 8000, 20000 ] // HP Limit [first, ..., last]
        ]
      ],
      1,
      0,
      1,
      0,
      [ 1 ] // Allowed player counts [1], [1,2] or [2]
    ],
    [
      'GameMode_Offline_MissionPack01',
      'GameMode_Desc_Offline_MissionPack01',
      'off_scenario.%LOCALE%.dds',
      'BGM_E5S02_EDFHonbu',
      'MAIN.GST',
      [
        'app:/Mission/DLC1_MissionList.offline.list.sgo',
        'app:/Mission/DLC1_MissionList.offline.txt.%LOCALE%.sgo',
        'app:/Mission/DLC1_MissionList.offline.image.rab'
      ],
      [
        [
          [ 10, 15 ],
          [ 1, 1, 1, 1 ],
          [ 0.5, 1, 0.20000000298023224 ],
          [ 1, 1, 1 ],
          [ 1, 0.75 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 17, 24 ],
          [ 1, 1, 1, 1 ],
          [ 0.5, 1, 0.20000000298023224 ],
          [ 1, 1, 1 ],
          [ 0.5, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 40, 60 ],
          [ 1, 1, 1, 1 ],
          [ 1, 1.5499999523162842, 0.25 ],
          [ 1, 1, 1 ],
          [ 0.75, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 110, 150 ],
          [ 1, 1, 1, 1 ],
          [ 2.380000114440918, 3, 0.30000001192092896 ],
          [ 1, 1, 1 ],
          [ 1, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 220, 280 ],
          [ 1, 1, 1, 1 ],
          [ 4, 4.5, 1 ],
          [ 1, 1, 1 ],
          [ 1.25, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ]
      ],
      0,
      1,
      0,
      0,
      [ 1, 2 ]
    ],
    [
      'GameMode_Online_MissionPack01',
      'GameMode_Desc_Online_MissionPack01',
      'on_scenario.%LOCALE%.dds',
      'BGM_E5S02_EDFHonbu',
      'MAIN.GST',
      [
        'app:/Mission/DLC1_MissionList.online.list.sgo',
        'app:/Mission/DLC1_MissionList.online.txt.%LOCALE%.sgo',
        'app:/Mission/DLC1_MissionList.online.image.rab'
      ],
      [
        [
          [ 10, 15 ],
          [
            1.2000000476837158,
            0.800000011920929,
            1,
            1.2000000476837158
          ],
          [ 0.5, 1, 0.20000000298023224 ],
          [ 1.7999999523162842, 1.5, 1 ],
          [ 1, 0.75 ],
          [ 1.7999999523162842, 1.7999999523162842 ],
          [ 0.6000000238418579, 1.100000023841858 ],
          [ 1100, 2000 ]
        ],
        [
          [ 17, 25 ],
          [
            1.2000000476837158,
            0.800000011920929,
            1,
            1.2000000476837158
          ],
          [ 0.5, 1, 0.20000000298023224 ],
          [ 2.4000000953674316, 2, 1 ],
          [ 1, 0.5 ],
          [ 2, 1.5 ],
          [ 0.6000000238418579, 1.100000023841858 ],
          [ 1100, 2000 ]
        ],
        [
          [ 40, 60 ],
          [
            1.2000000476837158,
            0.8999999761581421,
            1.0499999523162842,
            1.2000000476837158
          ],
          [ 1, 1.5499999523162842, 0.25 ],
          [ 2.299999952316284, 2, 1 ],
          [ 1.25, 0.5 ],
          [ 2, 1.5 ],
          [ 1.100000023841858, 1.649999976158142 ],
          [ 2600, 4500 ]
        ],
        [
          [ 110, 150 ],
          [
            1.2000000476837158,
            1,
            1.100000023841858,
            1.2000000476837158
          ],
          [ 2.380000114440918, 3, 0.30000001192092896 ],
          [ 2.200000047683716, 2, 1 ],
          [ 1.5, 0.5 ],
          [ 1.75, 1.5 ],
          [ 2.4800000190734863, 3.0999999046325684 ],
          [ 6200, 8000 ]
        ],
        [
          [ 220, 280 ],
          [
            1.2000000476837158,
            1.100000023841858,
            1.149999976158142,
            1.2000000476837158
          ],
          [ 4, 4.5, 1 ],
          [ 2.200000047683716, 2, 1 ],
          [ 1.5, 0.5 ],
          [ 1.5, 1.5 ],
          [ -1, -1 ],
          [ 14000, 20000 ]
        ]
      ],
      1,
      1,
      1,
      0,
      [ 1 ]
    ],
    [
      'GameMode_Offline_MissionPack02',
      'GameMode_Desc_Offline_MissionPack02',
      'off_scenario.%LOCALE%.dds',
      'BGM_E5S02_EDFHonbu',
      'MAIN.GST',
      [
        'app:/Mission/DLC2_MissionList.offline.list.sgo',
        'app:/Mission/DLC2_MissionList.offline.txt.%LOCALE%.sgo',
        'app:/Mission/DLC2_MissionList.offline.image.rab'
      ],
      [
        [
          [ 15, 20 ],
          [ 1, 1, 1, 1 ],
          [ 1, 1.5, 0.20000000298023224 ],
          [ 1, 1, 1 ],
          [ 1, 0.75 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 24, 40 ],
          [ 1, 1, 1, 1 ],
          [ 1, 1.5, 0.20000000298023224 ],
          [ 1, 1, 1 ],
          [ 0.5, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 60, 110 ],
          [ 1, 1, 1, 1 ],
          [ 1.774999976158142, 2.5, 0.25 ],
          [ 1, 1, 1 ],
          [ 0.75, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 150, 220 ],
          [ 1, 1, 1, 1 ],
          [ 3, 3.5, 0.30000001192092896 ],
          [ 1, 1, 1 ],
          [ 1, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ],
        [
          [ 250, 330 ],
          [ 1, 1, 1, 1 ],
          [ 4.25, 4.75, 1 ],
          [ 1, 1, 1 ],
          [ 1.25, 0.5 ],
          [ 1, 1 ],
          0,
          0
        ]
      ],
      0,
      2,
      0,
      0,
      [ 1, 2 ]
    ],
    [
      'GameMode_Online_MissionPack02',
      'GameMode_Desc_Online_MissionPack02',
      'on_scenario.%LOCALE%.dds',
      'BGM_E5S02_EDFHonbu',
      'MAIN.GST',
      [
        'app:/Mission/DLC2_MissionList.online.list.sgo',
        'app:/Mission/DLC2_MissionList.online.txt.%LOCALE%.sgo',
        'app:/Mission/DLC2_MissionList.online.image.rab'
      ],
      [
        [
          [ 15, 20 ],
          [
            1.2000000476837158,
            0.800000011920929,
            1,
            1.2000000476837158
          ],
          [ 1, 1.5, 0.20000000298023224 ],
          [ 1.7999999523162842, 1.5, 1 ],
          [ 1, 0.75 ],
          [ 1.7999999523162842, 1.7999999523162842 ],
          [ 1.100000023841858, 1.600000023841858 ],
          [ 2000, 3500 ]
        ],
        [
          [ 24, 40 ],
          [
            1.2000000476837158,
            0.800000011920929,
            1,
            1.2000000476837158
          ],
          [ 1, 1.5, 0.20000000298023224 ],
          [ 2.4000000953674316, 2, 1 ],
          [ 1, 0.5 ],
          [ 2, 1.5 ],
          [ 1.100000023841858, 1.600000023841858 ],
          [ 2000, 3500 ]
        ],
        [
          [ 60, 110 ],
          [
            1.2000000476837158,
            0.8999999761581421,
            1.0499999523162842,
            1.2000000476837158
          ],
          [ 1.774999976158142, 2.5, 0.25 ],
          [ 2.299999952316284, 2, 1 ],
          [ 1.25, 0.5 ],
          [ 2, 1.5 ],
          [ 1.875, 2.5999999046325684 ],
          [ 4500, 7000 ]
        ],
        [
          [ 150, 220 ],
          [
            1.2000000476837158,
            1,
            1.100000023841858,
            1.2000000476837158
          ],
          [ 3, 3.5, 0.30000001192092896 ],
          [ 2.0999999046325684, 2, 1 ],
          [ 1.5, 0.5 ],
          [ 1.75, 1.5 ],
          [ 3.0999999046325684, 3.5999999046325684 ],
          [ 8000, 14000 ]
        ],
        [
          [ 250, 330 ],
          [
            1.2000000476837158,
            1.100000023841858,
            1.149999976158142,
            1.2000000476837158
          ],
          [ 4.25, 4.75, 1 ],
          [ 2, 2, 1 ],
          [ 1.5, 0.5 ],
          [ 1.5, 1.5 ],
          [ -1, -1 ],
          [ 20000, 25000 ]
        ]
      ],
      1,
      2,
      1,
      0,
      [ 1 ]
    ]
  ],
  PackageName: 'DEFP',
  SoldierInit: [
    [
      0,
      'SoldierType_Ranger',
      [
        'app:/object/ArmySoldier.sgo',
        'app:/object/SecurityGuard.sgo'
      ],
      [ 200, 0.6399999856948853 ],
      [
        [
          'Weapon_Slot1',
          'AssultRifle01',
          [
            0, 1, 2, 3,
            4, 5, 6
          ],
          0,
          0
        ],
        [
          'Weapon_Slot2',
          'RocketLauncher01',
          [
            0, 1, 2, 3,
            4, 5, 6
          ],
          0,
          0
        ],
        [ 'Weapon_SlotSupport', 'aSupportNone', [ 7, 8, 9, 10 ], 0, 1 ]
      ],
      [
        'App:/DefaultPackage/CustomColorRanger.sgo',
        [
          'APP:/MENUOBJECT/ARMYSOLDIER.SGO',
          'APP:/MENUOBJECT/SECURITYGUARD.SGO'
        ],
        'App:/UI/TypeSelectImage.rab',
        [
          'SoldierType_Ranger_01.dds',
          'SoldierType_Ranger_02.dds',
          'SoldierType_Ranger_03.dds',
          'SoldierType_Ranger_04.dds',
          'SoldierType_Ranger_05.dds'
        ]
      ]
    ],
    [
      1,
      'SoldierType_WingDiver',
      [ 'app:/object/PaleWing.sgo', 'app:/object/Racer.sgo' ],
      [ 150, 0.4000000059604645 ],
      [
        [
          'Weapon_Slot1',
          'pRapier01',
          [
            100, 101, 102,
            103, 104, 105,
            106, 107
          ],
          0,
          0
        ],
        [
          'Weapon_Slot2',
          'pPlasmaLauncher01',
          [
            100, 101, 102,
            103, 104, 105,
            106, 107
          ],
          0,
          0
        ],
        [ 'Weapon_SlotPaleSupport', 'pSupportNone', [ 108 ], 0, 1 ]
      ],
      [
        'App:/DefaultPackage/CustomColorWingDiver.sgo',
        [ 'APP:/MENUOBJECT/PALEWING.SGO', 'APP:/MENUOBJECT/RACER.SGO' ],
        'App:/UI/TypeSelectImage.rab',
        [
          'SoldierType_WingDiver_01.dds',
          'SoldierType_WingDiver_02.dds',
          'SoldierType_WingDiver_03.dds',
          'SoldierType_WingDiver_04.dds'
        ]
      ]
    ],
    [
      2,
      'SoldierType_AirRaider',
      [ 'app:/object/Engineer.sgo', 'app:/object/Maintenance.sgo' ],
      [ 200, 0.6399999856948853 ],
      [
        [
          'Weapon_Slot1',
          'eLimpetGun01',
          [
            310, 311, 312,
            313, 314, 303,
            304, 302, 305
          ],
          0,
          0
        ],
        [
          'Weapon_Slot2',
          'eZEGUN0',
          [
            310, 311, 312,
            313, 314, 303,
            304, 302, 305
          ],
          0,
          0
        ],
        [
          'Weapon_Slot3',
          'eLifeBender',
          [
            310, 311, 312,
            313, 314, 303,
            304, 302, 305
          ],
          0,
          0
        ],
        [
          'Weapon_SlotVehicle',
          'eVehicleNone',
          [ 306, 307, 308, 309, 320 ],
          0,
          1
        ]
      ],
      [
        'App:/DefaultPackage/CustomColorAirRaider.sgo',
        [
          'APP:/MENUOBJECT/ENGINEER.SGO',
          'APP:/MENUOBJECT/MAINTENANCE.SGO'
        ],
        'App:/UI/TypeSelectImage.rab',
        [
          'SoldierType_AirRaider_01.dds',
          'SoldierType_AirRaider_02.dds',
          'SoldierType_AirRaider_03.dds',
          'SoldierType_AirRaider_04.dds'
        ]
      ]
    ],
    [
      3,
      'SoldierType_Fencer',
      [ 'app:/object/HeavyArmor.sgo', 'app:/object/Worker.sgo' ],
      [ 250, 0.800000011920929 ],
      [
        [
          'Weapon_Slot1L',
          'hShield01',
          [ 200, 201, 202, 203, 204, 205 ],
          1,
          0
        ],
        [
          'Weapon_Slot1R',
          'hGatling01',
          [ 200, 201, 202, 203, 204, 205 ],
          1,
          0
        ],
        [
          'Weapon_Slot2L',
          'hShield01',
          [ 200, 201, 202, 203, 204, 205 ],
          1,
          0
        ],
        [
          'Weapon_Slot2R',
          'hPileBanker01',
          [ 200, 201, 202, 203, 204, 205 ],
          1,
          0
        ],
        [
          'Weapon_SlotSupport',
          'hSupportNone0',
          [ 206, 207, 208, 209 ],
          0,
          1
        ],
        [
          'Weapon_SlotSupport',
          'hSupportNone1',
          [ 206, 207, 208, 209 ],
          0,
          1
        ]
      ],
      [
        'App:/DefaultPackage/CustomColorHeavyArmor.sgo',
        [
          'APP:/MENUOBJECT/HEAVYARMOR.SGO',
          'APP:/MENUOBJECT/WORKER.SGO'
        ],
        'App:/UI/TypeSelectImage.rab',
        [
          'SoldierType_Fencer_01.dds',
          'SoldierType_Fencer_02.dds',
          'SoldierType_Fencer_03.dds',
          'SoldierType_Fencer_04.dds',
          'SoldierType_Fencer_05.dds'
        ]
      ]
    ]
  ],
  SoldierWeaponCategory: [
    [ 0, 'Weapon_AssaultRifle' ],
    [ 1, 'Weapon_Shotgun' ],
    [ 2, 'Weapon_SniperRifle' ],
    [ 3, 'Weapon_RocketLauncher' ],
    [ 4, 'Weapon_MissleLauncher' ],
    [ 5, 'Weapon_Grenade' ],
    [ 6, 'Weapon_Special' ],
    [ 7, 'Weapon_Support' ],
    [ 8, 'Weapon_Ranger_Vehicle1' ],
    [ 9, 'Weapon_Ranger_Vehicle2' ],
    [ 10, 'Weapon_Ranger_Vehicle3' ],
    [ 100, 'Weapon_Pale_Short' ],
    [ 101, 'Weapon_Pale_MiddleLaser' ],
    [ 102, 'Weapon_Pale_MiddleThunder' ],
    [ 103, 'Weapon_Pale_MiddleBeam' ],
    [ 104, 'Weapon_Pale_Long' ],
    [ 105, 'Weapon_Pale_Explosive' ],
    [ 106, 'Weapon_Pale_Homing' ],
    [ 107, 'Weapon_Pale_Special' ],
    [ 108, 'Weapon_Pale_Support' ],
    [ 200, 'Weapon_Heavy_ShortHammer' ],
    [ 201, 'Weapon_Heavy_ShortPile' ],
    [ 202, 'Weapon_Heavy_Sheild' ],
    [ 203, 'Weapon_Heavy_Middle' ],
    [ 204, 'Weapon_Heavy_Cannon' ],
    [ 205, 'Weapon_Heavy_Homing' ],
    [ 206, 'Weapon_Heavy_Support_Booster' ],
    [ 207, 'Weapon_Heavy_Support_Shield' ],
    [ 208, 'Weapon_Heavy_Support_Aiming' ],
    [ 209, 'Weapon_Heavy_Support_Actuater' ],
    [ 310, 'Weapon_Engineer_Call_Cannon' ],
    [ 311, 'Weapon_Engineer_Call_Gunship' ],
    [ 312, 'Weapon_Engineer_Call_Attacker' ],
    [ 313, 'Weapon_Engineer_Call_Missile' ],
    [ 314, 'Weapon_Engineer_Call_Satellite' ],
    [ 301, 'Weapon_Engineer_Long' ],
    [ 303, 'Weapon_Engineer_Bomb' ],
    [ 304, 'Weapon_Engineer_Cannon' ],
    [ 302, 'Weapon_Engineer_Support' ],
    [ 305, 'Weapon_Engineer_Special' ],
    [ 306, 'Weapon_Engineer_Vehicle1' ],
    [ 307, 'Weapon_Engineer_Vehicle2' ],
    [ 308, 'Weapon_Engineer_Vehicle3' ],
    [ 309, 'Weapon_Engineer_Vehicle4' ],
    [ 320, 'Weapon_Engineer_Vehicle5' ]
  ],
  WeaponTable: 'app:/Weapon/WeaponTable.sgo',
  WeaponText: 'app:/Weapon/WeaponText.%LOCALE%.sgo'
}
