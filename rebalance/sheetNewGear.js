#!/usr/bin/env node

const rbDataPath = "../data/41/weapons/";

const outDir = "C:/Program Files (x86)/Steam/steamapps/common/Earth Defense Force 4.1/SgottTemplates/weapon";
//const outDir = './release/sgottstrap/SgottTemplates/weapon';

const fs = require('fs');
const Papa = require('papaparse');
const table = require(`${rbDataPath}_WEAPONTABLE`);
const textTable = require(`${rbDataPath}_WEAPONTEXT`);
const blurbs = require('../helpers/blurbs');
const getId = require('../helpers/get-id');
const getNode = require('../helpers/get-node');
const patch = require('../helpers/patch');
const getMultiIndex = require('../helpers/get-multi-index');
const getIndex = require('../helpers/spread-sheet-index');
const statReference = require("./rbSource/statReference.json")
const coreStats = statReference.variables;

const rawSgos = new Map();
const seconds = 60;
const minutes = seconds * 60;

//Load Rebalance stats from spreadsheet
const statsRaw = fs.readFileSync('./rbSource/gunBalanceSheet.csv', 'utf8')
const parsedStats = Papa.parse(statsRaw)
const sName = getIndex(parsedStats)

const added = {};

const categories = {
  ranger: {
    assault: 0,
    shotguns: 1,
    sniper: 2,
    rocket: 3,
    homing: 4,
    grenade: 5,
    special: 6,
  },
  diver: {
    "short": 10,
    laser: 11,
    electro: 12,
    particle: 13,
    sniper: 14,
    explosive: 15,
    homing: 16,
    special: 17,
  },
  fencer: {
    hammer: 20,
    spear: 21,
    shield: 22,
    auto: 23,
    cannon: 24,
    homing: 25,
    special: 26,
  },
  raider: {
    guide: 30,
    raid: 31,
    support: 32,
    limpet: 33,
    deploy: 34,
    special: 35,
    tank: 36,
    ground: 37,
    heli: 38,
    mech: 39,
  },
}

function Float(v) {
  return {
    type: 'float',
    value: v
  }
}

function Ptr(v) {
  return {
    type: 'ptr',
    value: v
  }
}

function Int(v) {
  return {
    type: 'int',
    value: v
  }
}

function Str(v) {
  return {
    type: 'string',
    value: v
  }
}

function Vector(v) {
  return Ptr(v.map(Float))
}

function acquire(file) {
  return JSON.parse(fs.readFileSync(file))
}

function json(obj) {
  return JSON.stringify(obj, null, 2)
}

function add(meta, changes) {
  for (const prop of ['id', 'soldier', 'category', 'level', 'base']) {
    if(meta[prop] == null) {
      throw new Error(`No ${prop} specified`)
    }
  }
  if (!categories[meta.soldier]) {
    throw new Error(`
      Unknown soldier: ${meta.soldier}
      Valid soldiers: ${Object.keys(categories).join(', ')}
    `)
  }
  const category = categories[meta.soldier][meta.category]
  if (category == null) {
    throw new Error(`
      Unknown category: ${meta.soldier}: ${meta.category}
      Valid categories: ${Object.keys(categories[meta.soldier]).join(', ')}
    `)
  }
  console.log(`Processing ${meta.id} ...`)
  const weapon = acquire(`${rbDataPath}${meta.base.toUpperCase()}.json`)

  const name = ['name', {
    value: [Str(meta.jName), Str(meta.name), Str(meta.cName)]
  }]
  for (const [key, value] of Object.entries(changes).concat([name])) {
    var node = getNode(weapon, key)
    if (!node) {
      console.error(`Failed to find node ${key}, adding it...`)
      if (key === "resource") {
        node = {
          type: "ptr",
          name: "resource",
          value: []
        }
      } else {
        node = {
          name: key
        }
      }
      weapon.variables.push(node)
    }
    if (value === "Default") {continue} 
    else if (typeof value === 'object') Object.assign(node, value)
    else if (typeof value === 'function') node.value = value(node.value, node)
    else node.value = value
  }

  const fileName = `${meta.id}=${meta.base}`
  //const nameAffix = `_${meta.name}`

  added[fileName] = weapon
  weapon.meta.id = meta.id
  weapon.meta.level = meta.level
  weapon.meta.category = category
  weapon.meta.description = meta.description
  weapon.meta.unlockState = meta.unlockState
  if (meta.before) weapon.meta.before = meta.before
  else if (meta.after) weapon.meta.after = meta.after
}

//See the spreadsheet for indexes: https://docs.google.com/spreadsheets/d/1ZcMneUf43jbCpKrSBvFZIcAq3WYP4qrdeNGkuvbcuco/edit#gid=1221405991&range=A96

var runOnce = false
for (let i = 0; i < parsedStats.data.length || runOnce === false; i++) {
  //console.log("loop started")
  try {
    var step = i + 1

    //Establish Weapon ID and find correct Row
    if (runOnce === false) {
      var curWep = `NewWep${step}`
      var Stats = parsedStats.data.find(row => row[sName["ID"]] === curWep)
    } else {
      var curWep = `DupeWep${step}`
      var Stats = parsedStats.data.find(row => row[sName["DupeID"]] === curWep)
    }

    //Find Correct Meta
    if (runOnce === false) {
      var curSoldier = Stats[sName["Soldier"]]
      var curCat = Stats[sName["OfficialCat"]]
      var curBase = Stats[sName["NewBase"]]
    } else {
      var curSoldier = Stats[sName["OfficalDupeSoldier"]]
      var curCat = Stats[sName["OfficalDupeCat"]]
      var curBase = Stats[sName["DupeBase"]]
    }

    //Filter After or Before Placement
    if (Stats[sName["PlaceAfter"]] === "FIRST") {
      curAfter = null
      curBefore = Stats[sName["PlaceBefore"]]
    } else {
      curAfter = Stats[sName["PlaceAfter"]]
      curBefore = null
    }

    //Ensure non-automatic Melee weapons are assigned a 1 for Fire Interval
    if (Stats[sName["Type"]] === "CC Striker" || Stats[sName["Type"]] === "CC Piercer") {
      var realFireInterval = 1
    } else {
      var realFireInterval = +Stats[sName["AttackInterval"]]
    }

    add({
      id: curWep,
      after: curAfter,
      before: curBefore,
      soldier: curSoldier,
      category: curCat,
      base: curBase,
      name: Stats[sName["NewName"]],
      jName: Stats[sName["JapaneseName"]],
      cName: Stats[sName["ChineseName"]],
      level: +Stats[sName["Level"]],
      unlockState: +Stats[sName["UnlockState"]],
      description: Stats[sName["Description"]].replace(/\|/g, "\n"),
    }, {
      //General Stats
      AmmoClass: Stats[sName["AmmoClass"]],
      AmmoDamage: +Stats[sName["DamagePerHit"]],
      AmmoCount: +Stats[sName["AmmoCount"]],
      FireCount: +Stats[sName["FireCount"]],
      ReloadTime: +Stats[sName["ReloadTime"]],
      ReloadInit: +Stats[sName["StartingReloadFactor"]],
      ReloadType: +Stats[sName["ReloadType"]],
      AmmoAlive: +Stats[sName["AmmoLifetime"]],
      AmmoSpeed: +Stats[sName["AmmoSpeed"]],
      AmmoSize: +Stats[sName["AmmoSize"]],
      FireInterval: realFireInterval,
      FireBurstInterval: +Stats[sName["BurstInterval"]],
      FireBurstCount: +Stats[sName["BurstCount"]],
      Range: +Stats[sName["Range"]],
      AmmoHitImpulseAdjust: +Stats[sName["HitImpulseAdjust"]],
      AmmoExplosion: +Stats[sName["AreaOfEffect"]],
      AmmoIsPenetration: +Stats[sName["Piercing?"]],
      FireAccuracy: +Stats[sName["AccuracyReduction"]],
      FireSpreadType: +Stats[sName["SpreadType"]],
      FireSpreadWidth: +Stats[sName["FireSpreadWidth"]],
      AmmoHitSizeAdjust: +Stats[sName["AmmoHitboxAdjustment"]],
      AmmoGravityFactor: +Stats[sName["GravityFactor"]],
      AmmoOwnerMove: +Stats[sName["MovementInheritance"]],
      EnergyChargeRequire: +Stats[sName["EnergyChargeRequirement"]],
      //Lock On Stats
      LockonType: +Stats[sName["LockOnActive"]],
      LockonFailedTime: +Stats[sName["LockOnFailedTime"]],
      LockonHoldTime: +Stats[sName["LockOnHoldTime"]],
      LockonRange: +Stats[sName["LockOnRange"]],
      LockonTargetType: +Stats[sName["LockOnTargetType"]],
      LockonTime: +Stats[sName["LockOnTime"]],
      Lockon_AutoTimeOut: +Stats[sName["LockOnAutoTimeOut"]],
      Lockon_DistributionType: +Stats[sName["LockOnDistributionType"]],
      //Secondary Fire
      SecondaryFire_Type: +Stats[sName["SecondaryFireType?"]],
      SecondaryFire_Parameter: (v, node) => {
        if (+Stats[sName["SecondaryFireType?"]] === 1) {
          v = +Stats[sName["ZoomFactor"]]
          node.type = "float"
        }
        return v
      },
      //Lock Angle
      LockonAngle: v => {
        v[0].value = +Stats[sName["LockOnAngleH"]]
        v[1].value = +Stats[sName["LockOnAngleV"]]
        return v
      },
      //Animations
      ReloadAnimation: Stats[sName["ReloadAnimation"]],
      BaseAnimation: Stats[sName["BaseAnimation"]],
      ChangeAnimation: Stats[sName["ChangeAnimation"]],
      //Colour
      AmmoColor: v => {
        if (Stats[sName["ColourSetting"]] === "Custom") {
          //Find Values
          const red = v.find(node => node.name === 'Red')
          const green = v.find(node => node.name === 'Green')
          const blue = v.find(node => node.name === 'Blue')
          const alpha = v.find(node => node.name === 'Alpha')
          //Patch Values
          red.value = +Stats[sName["AmmoColourR"]]
          green.value = +Stats[sName["AmmoColourG"]]
          blue.value = +Stats[sName["AmmoColourB"]]
          alpha.value = +Stats[sName["AmmoColourAlpha"]]
        }
        return v
      },

      //Targeted Changes

      Ammo_CustomParameter: v => {

        if (Stats[sName["AmmoClass?"]] === "BombBullet01") {
          //Limpet Specific Parameters

          var node = v.find(node => node.name === 'IsDetector')
          node.value = +Stats[sName["Detector?"]]
          //console.log(node.value)		
          var node = v.find(node => node.name === 'BombExplosionType')
          node.value = +Stats[sName["ExplosionType"]]

        }

        if (Stats[sName["RealExplosionType"]] === "Splendor") {
          //Splendor Specific Parameters

          var node = v.find(node => node.name === 'SplendorParameter')
          const FleCount = node.value.find(node => node.name === 'FlechetteCount')
          const FleLife = node.value.find(node => node.name === 'FlechetteAlive')
          const FleSpeed = node.value.find(node => node.name === 'FlechetteSpeed')
          const FleSize = node.value.find(node => node.name === 'FlechetteSize')
          //Spread Stuff
          const FleSpread = node.value.find(node => node.name === 'FlechetteSpread')
          const FleSpreadH = FleSpread.value.find(node => node.name === 'Horizontal')
          const FleSpreadV = FleSpread.value.find(node => node.name === 'Vertical')
          const FleSpreadVOff = FleSpread.value.find(node => node.name === 'VerticalOffset')
          const searchRange = node.value.find(node => node.name === 'SearchRange')
          FleCount.value = +Stats[sName["FireHits"]]
          FleLife.value = +Stats[sName["SplendorLifetime"]]
          FleSpeed.value = +Stats[sName["SplendorSpeed"]]
          FleSize.value = +Stats[sName["SplendorSize"]]
          FleSpreadH.value = +Stats[sName["SplendorSpreadH"]]
          FleSpreadV.value = +Stats[sName["SplendorSpreadV"]]
          FleSpreadVOff.value = +Stats[sName["SplendorSpreadVOffset"]]
          searchRange.value = +Stats[sName["SecondarySearchRange"]]

        }

        if (Stats[sName["Type"]] === "Ballistic") {

          const summonDelay = v[2]
          summonDelay.value = +Stats[sName["SummonLeadTime"]]
          const summonCustomParameter = v[4]
          const artilleryInterval = summonCustomParameter.value[3]
          const artilleryCount = summonCustomParameter.value[2]
          const artilleryExplosionRadius = summonCustomParameter.value[9]
          artilleryInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
          artilleryCount.value = +Stats[sName["SecondaryShotCount"]]
          artilleryExplosionRadius.value = +Stats[sName["SecondaryShotAoE"]]

        }

        if (Stats[sName["Type"]] === "Bombing Plan") {

          const delay = v.find(node => node.name === 'SummonDelay')
          delay.value = +Stats[sName["SummonLeadTime"]]
          //Set bombing run Plane stats
          const planeStats = v.find(node => node.name === 'Summon_CustomParameter')
          const planeCount = planeStats.value.find(node => node.name === 'PlaneCount')
          const planeHeight = planeStats.value.find(node => node.name === 'PlaneElevation')
          const planeInterval = planeStats.value.find(node => node.name === 'PlaneInterval')
          const planeSpeed = planeStats.value.find(node => node.name === 'PlaneSpeed')
          planeCount.value = +Stats[sName["BombingPlanPlaneCount"]]
          planeHeight.value = +Stats[sName["BombingPlanPlaneHeight"]]
          planeInterval.value = +Stats[sName["BombingPlanPlaneInterval"]]
          planeSpeed.value = +Stats[sName["BombingPlanPlaneSpeed"]]

          //set bombing run bomb stats
          const bombingStats = planeStats.value.find(node => node.name === 'BombingPayloadParameter')
          const bombCount = bombingStats.value.find(node => node.name === 'BombingPayloadCount')
          const bombInterval = bombingStats.value.find(node => node.name === 'BombingPayloadInterval')
          const bombUpSpeed = bombingStats.value.find(node => node.name === 'BombingPayloadInitialUpSpeed')
          const bombSpeed = bombingStats.value.find(node => node.name === 'BombingPayloadSpeed')
          const bombExplosion = bombingStats.value.find(node => node.name === 'BombingPayloadExplosion')
          const bombLife = bombingStats.value.find(node => node.name === 'BombingPayloadAlive')
          bombCount.value = +Stats[sName["SecondaryShotCount"]]
          bombInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
          bombUpSpeed.value = +Stats[sName["BombingPlanInitialUpwardSpeed"]]
          bombSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
          bombExplosion.value = +Stats[sName["SecondaryShotAoE"]]
          bombLife.value = +Stats[sName["SecondaryProjectileLifetime"]]



          //console.log("Bombing Plan Air Raid specific parameters applied successfuly")
        }

        if (Stats[sName["Type"]] === "Target Painted") {

          const missileCount = v[4].value[2]
          const missileFireInterval = v[4].value[3]
          const missileSpeed = v[4].value[5]
          const missileSize = v[4].value[7]
          const missileExplosion = v[4].value[9]
          missileCount.value = +Stats[sName["SecondaryShotCount"]]
          missileFireInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
          missileSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
          missileSize.value = +Stats[sName["SecondaryProjectileSize"]]
          missileExplosion.value = +Stats[sName["SecondaryShotAoE"]]



          //console.log("Target Painted Air Raid specific parameters applied successfuly")
        }

        if (Stats[sName["Type"]] === "Auto Turret") {

          const turretFireRate = v.find(node => node.name === 'FireInterval')
          const turretAmmoCount = v.find(node => node.name === 'AmmoCount')
          const turretTracking = v.find(node => node.name === 'TurnSpeed')
          const turretSearchRange = v.find(node => node.name === 'SearchRange')
          const turretAmmoSpeed = v.find(node => node.name === 'AmmoSize')
          turretFireRate.value = +Stats[sName["SecondaryProjectileInterval"]]
          turretAmmoCount.value = +Stats[sName["SecondaryAmmoCount"]]
          turretTracking.value = +Stats[sName["SecondaryTurnSpeed"]]
          turretSearchRange.value = +Stats[sName["SecondarySearchRange"]]
          turretAmmoSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]


          //console.log("Turret specific parameters applied successfuly")
        }

        if (Stats[sName["Type"]] === "Napalm") {

          const napalmStats = v.find(node => node.name === 'EmitterParameter')
          const napalmHitCount = napalmStats.value.find(node => node.name === 'EmitterAmmoCount')
          const napalmHitInterval = napalmStats.value.find(node => node.name === 'EmitterInterval')
          napalmHitCount.value = +Stats[sName["SecondaryAmmoCount"]]
          napalmHitInterval.value = +Stats[sName["SecondaryProjectileInterval"]]


        }

        if (Stats[sName["Type"]] === "Target Painter") {

          const lockSpeed = v[0].value
          const lockRange = v[1].value
          lockSpeed.value = +Stats[sName["SecondaryLockTime"]]
          lockRange.value = +Stats[sName["SecondaryLockRange"]]


        }

        if (Stats[sName["Type"]] === "Lock On Launcher") {

          const misAcel = v[4]
          const misTurn = v[5]
          const misMaxSpeed = v[6]
          const misIgniteDelay = v[7].value[0]
          const misFlyStraight = v[8]
          misAcel.value = +Stats[sName["SecondaryProjectileAcceleration"]]
          misTurn.value = +Stats[sName["SecondaryTurnSpeed"]]
          misMaxSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
          misIgniteDelay.value = +Stats[sName["SecondaryEngineIgniteDelay"]]
          misFlyStraight.value = +Stats[sName["SecondaryFlyStraightTime"]]

        }

        if (Stats[sName["Type"]] === "Homing Laser") {

          const laserAcel = v[3]
          const laserTurn = v[4]
          const laserMaxSpeed = v[5]
          const laserFlyStraight = v[6]
          laserAcel.value = +Stats[sName["SecondaryProjectileAcceleration"]]
          laserTurn.value = +Stats[sName["SecondaryTurnSpeed"]]
          laserMaxSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
          laserFlyStraight.value = +Stats[sName["SecondaryFlyStraightTime"]]

        }

        if (Stats[sName["Type"]] === "Energy Cluster") {

          const spreadAngle = v[2]
          const spreadType = v[3]
          const fireCount = v[5].value[2]
          const fireInterval = v[5].value[3]
          const ammoSpeed = v[5].value[5]
          const shotAoE = v[5].value[9]
          const ammoLifetime = v[5].value[10]

          spreadAngle.value = +Stats[sName["SecondarySpreadAngle"]]
          spreadType.value = +Stats[sName["SecondarySpreadTypeFlag"]]
          fireCount.value = +Stats[sName["SecondaryAmmoCount"]]
          fireInterval.value = Stats[sName["SecondaryProjectileInterval"]] - 1
          ammoSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
          shotAoE.value = +Stats[sName["SecondaryShotAoE"]]
          ammoLifetime.value = +Stats[sName["SecondaryProjectileLifetime"]]

        }

        // if(Stats[sName["Type"]] === "Lightning"){

        // const lightNoise = v[0].value
        // const lightRandVel = v[1].value
        // const lightCurve = v[2].value
        // const lightMod = v[3].value
        // lightNoise.value = 1
        // lightRandVel.value = 0
        // lightCurve.value = 0
        // lightMod.value = 1

        // }

        if (Stats[sName["Type"]] === "Vehicle Spawner") {
          // //Navigate PTR Structure
          var vWeps = []
          const delay = v.find(node => node.name === 'SummonDelay')
          const sumPar = v.find(node => node.name === 'Summon_CustomParameter')
          const vCore = sumPar.value[3]
          const HPmult = sumPar.value[3].value[0].value[0]
          const DMGmult = sumPar.value[3].value[0].value[1]

          //Patch Vehicle Strength multipliers
          delay.value = +Stats[sName["SummonLeadTime"]]
          HPmult.name = "HPMultiplier"
          HPmult.value = +Stats[sName["HPmult"]]
          DMGmult.name = "DMGMultiplier"
          DMGmult.value = +Stats[sName["DMGmult"]]

          //Patch Vehicle Mobility multipliers
          var mobileType = Stats[sName["MobilityType"]]
          const vMobilityCore = vCore.value[1]
          switch (mobileType) {
            case "Tracks":
              //console.log("Mobility Type is Tracks")
              //Build structure
              const tankGrip = vMobilityCore.value[0]
              const tankAcc = vMobilityCore.value[1]
              const tankWeight = vMobilityCore.value[2]
              const tankTurnSpeed = vMobilityCore.value[3]
              const tankTurnFriction = vMobilityCore.value[4]
              const tankSuspension = vMobilityCore.value[5]
              //Patch values
              tankGrip.value = +Stats[sName["TankGrip"]]
              tankAcc.value = +Stats[sName["TankAcc"]]
              tankWeight.value = +Stats[sName["TankWeight"]]
              tankTurnSpeed.value = +Stats[sName["TankTurnSpeed"]]
              tankTurnFriction.value = +Stats[sName["TankTurnFriction"]]
              tankSuspension.value = +Stats[sName["TankSuspension"]]
              break
            case "Wheels":
              //console.log("Mobility Type is Wheels")
              //Build structure							
              const wheelGrip = vMobilityCore.value[0]
              const wheelWeight = vMobilityCore.value[1]
              const wheelAccFriction = vMobilityCore.value[2]
              const wheelAcc = vMobilityCore.value[3]
              //Patch values
              wheelGrip.value = +Stats[sName["WheelGrip"]]
              wheelWeight.value = +Stats[sName["WheelWeight"]]
              wheelAccFriction.value = +Stats[sName["WheelAccFriction"]]
              wheelAcc.value = +Stats[sName["WheelAcc"]]
              break
            case "Helicopter":
              //console.log("Mobility Type is Helicopter")
              //Build structure
              const heliMaxSpeedH = vMobilityCore.value[0]
              const heliAccH = vMobilityCore.value[1]
              const heliYawMaxSpeed = vMobilityCore.value[2]
              const heliYawAcc = vMobilityCore.value[3]
              const heliAccV = vMobilityCore.value[4]
              const heliMaxTilt = vMobilityCore.value[5]
              const heliTiltSpeed = vMobilityCore.value[6]
              //Patch values
              heliMaxSpeedH.value = +Stats[sName["HeliMaxSpeedH"]]
              heliAccH.value = +Stats[sName["HeliAccH"]]
              heliYawMaxSpeed.value = +Stats[sName["HeliYawMaxSpeed"]]
              heliYawAcc.value = +Stats[sName["HeliYawAcc"]]
              heliAccV.value = +Stats[sName["HeliAccV"]]
              heliMaxTilt.value = +Stats[sName["HeliMaxTilt"]]
              heliTiltSpeed.value = +Stats[sName["HeliTiltSpeed"]]
              break
            case "Crawler":
              //console.log("Mobility Type is Crawler")
              //Build structure
              const crawlSpeed = vMobilityCore.value[0]
              const crawlTurnSpeed = vMobilityCore.value[1]
              const crawlJumpAniSpeed = vMobilityCore.value[2]
              const crawlJumpAcc = vMobilityCore.value[3]
              const crawlJumpAngle = vMobilityCore.value[4]
              const crawlDodgeAniSpeed = vMobilityCore.value[6]
              //Patch values
              crawlSpeed.value = +Stats[sName["CrawlSpeed"]]
              crawlTurnSpeed.value = +Stats[sName["CrawlTurnSpeed"]]
              crawlJumpAniSpeed.value = +Stats[sName["CrawlJumpAniSpeed"]]
              crawlJumpAcc.value = +Stats[sName["CrawlJumpAcc"]]
              crawlJumpAngle.value = +Stats[sName["CrawlJumpAngle"]]
              crawlDodgeAniSpeed.value = +Stats[sName["CrawlDodgeAniSpeed"]]
              break
            case "BigMech":
              //Build structure
              //Left Arm
              const bigMechGunL = vCore.value[3].value[1]
              const mechLeftTurnRate = bigMechGunL.value[0]
              const mechLeftTurnAcc = bigMechGunL.value[1]
              const mechLeftTurnFriction = bigMechGunL.value[2]
              //Right Arm
              const bigMechGunR = vCore.value[3].value[2]
              const mechRightTurnRate = bigMechGunR.value[0]
              const mechRightTurnAcc = bigMechGunR.value[1]
              const mechRightTurnFriction = bigMechGunR.value[2]
              //Middle Arm
              const bigMechGunM = vCore.value[3].value[3]
              const mechMiddleTurnRate = bigMechGunM.value[0]
              const mechMiddleTurnAcc = bigMechGunM.value[1]
              const mechMiddleTurnFriction = bigMechGunM.value[2]
              //Patch values
              //Left Arm
              mechLeftTurnRate.value = +Stats[sName["MechLeftArmTurnRate"]]
              mechLeftTurnAcc.value = +Stats[sName["MechLeftArmTurnAcc"]]
              mechLeftTurnFriction.value = +Stats[sName["MechLeftArmTurnFriction"]]
              //Right Arm
              mechRightTurnRate.value = +Stats[sName["MechRightArmTurnRate"]]
              mechRightTurnAcc.value = +Stats[sName["MechRightArmTurnAcc"]]
              mechRightTurnFriction.value = +Stats[sName["MechRightArmTurnFriction"]]
              //Middle Arm
              mechMiddleTurnRate.value = +Stats[sName["MechMiddleTurnRate"]]
              mechMiddleTurnAcc.value = +Stats[sName["MechMiddleTurnAcc"]]
              mechMiddleTurnFriction.value = +Stats[sName["MechMiddleTurnFriction"]]

            case "Mech":
              //console.log("Mobility Type is Mech")
              //Build structure
              //Legs
              const mechMaxSpeed = vMobilityCore.value[0]
              const mechAcc = vMobilityCore.value[1]
              const mechLegTurnRate = vMobilityCore.value[2]
              const mechLegTurnAcc = vMobilityCore.value[3]
              //Jumping
              const mechJumping = vCore.value[2]
              const mechJumpHeight = mechJumping.value[0]
              const mechJumpAniSpeed = mechJumping.value[1]
              const mechJumpAngle = mechJumping.value[2]
              const mechThrusterDuration = mechJumping.value[3]
              const mechThrusterStrength = mechJumping.value[4]
              const mechThrusterDelay = mechJumping.value[5]
              //UpperBody
              const mechUpperBody = vCore.value[3].value[0]
              const mechUpperTurnRate = mechUpperBody.value[0]
              const mechUpperTurnAcc = mechUpperBody.value[1]
              const mechUpperTurnFriction = mechUpperBody.value[2]
              //Patch values
              //Legs
              mechMaxSpeed.value = +Stats[sName["MechMaxSpeed"]]
              mechAcc.value = +Stats[sName["MechAcc"]]
              mechLegTurnRate.value = +Stats[sName["MechLegTurnRate"]]
              mechLegTurnAcc.value = +Stats[sName["MechLegTurnAcc"]]
              //Jumping
              mechJumpHeight.value = +Stats[sName["MechJumpHeight"]]
              mechJumpAniSpeed.value = +Stats[sName["MechJumpAniSpeed"]]
              mechJumpAngle.value = +Stats[sName["MechJumpAngle"]]
              mechThrusterDuration.value = parseInt(Stats[sName["MechThrusterDuration"]])
              mechThrusterStrength.value = +Stats[sName["MechThrusterStrength"]]
              mechThrusterDelay.value = parseInt(Stats[sName["MechThrusterDelay"]])
              //UpperBody
              mechUpperTurnRate.value = +Stats[sName["MechUpperTurnRate"]]
              mechUpperTurnAcc.value = +Stats[sName["MechUpperTurnAcc"]]
              mechUpperTurnFriction.value = +Stats[sName["MechUpperTurnFriction"]]
              break
            default:
              console.log(`Could not find a Mobility Type for Vehicle ${Stats[sName["NewName"]]} with ID ${Stats[sName["ID"]]}!`)
          }

          //Patch Vehicle Weapon Stats
          //console.log(`Applying weapon stats for vehicle ${Stats[sName["NewName"]]} with ID ${Stats[sName["ID"]]}`)
          var offset = 0
          for (var vi = 0; vi < 6; vi++) {
            //console.log(`Finding path for VWepBase${vi+1}...`)
            if (Stats[sName[`VWepBase${vi+1}`]] != "N/A") {
              var vWepBase = Stats[sName[`VWepBase${vi+1}`]].toLowerCase()
              if (Stats[sName["VType"]] === "Mechsuit") {
                basePath = vWeps[vi] = sumPar.value[3].value[4]
              } else {
                basePath = vWeps[vi] = sumPar.value[3].value[2]
              }

              var wepFound = false
              while (wepFound != true) {
                try {
                  if (basePath.value[vi + offset].value[0].type === "string") {
                    // console.log(`Found a string value at position VI:${vi} Offset:${offset}`)
                    // console.log(`Found Weapon: ${basePath.value[vi+offset].value[0].value}`)
                    vWeps[vi] = {
                      type: "string",
                      name: `vWep${vi}`,
                      value: basePath.value[vi + offset].value[0].value
                    }
                    wepFound = true
                  } else {
                    console.log(`Did not find a string value at position VI:${vi} Offset:${offset}.  Offset is now ${offset+1}`)
                    offset++
                  }
                } catch (e) {
                  if (offset >= 100) {
                    console.log("INFINITE LOOP DETECTED.  CANCELLING.")
                    break
                  }
                  console.log(e)
                }
              }
              //Assign new weapon path
              const path = `./SgottMods/weapon/${vWepBase}`
              vWeps[vi].value = path + '.SGO'
            }
          }

          //End Vehicle Specific Changes
        }

        return v
      },
      custom_parameter: v => {

        if (Stats[sName["Type"]] === "CC Piercer") {

          const a1animation = v[0].value[0].value[0]
          const a1animMult = v[0].value[0].value[1]
          const a1dmgMult = v[0].value[0].value[2]
          const a1ammoSizeMult = v[0].value[0].value[3]
          const a1ammoLifeMult = v[0].value[0].value[4]

          a1animation.value = Stats[sName["AttackOneAnimationType"]]
          a1animMult.value = +Stats[sName["AttackOneAnimationSpeedMult"]]
          a1dmgMult.value = +Stats[sName["AttackOneDamageMult"]]
          a1ammoSizeMult.value = +Stats[sName["AttackOneAmmoSizeMult"]]
          a1ammoLifeMult.value = +Stats[sName["AttackOneAmmoLifeMult"]]

          if (+Stats[sName["NumOfAttacks"]] >= 2) {

            const a2animation = v[0].value[1].value[0]
            const a2animMult = v[0].value[1].value[1]
            const a2dmgMult = v[0].value[1].value[2]
            const a2ammoSizeMult = v[0].value[1].value[3]
            const a2ammoLifeMult = v[0].value[1].value[4]

            a2animation.value = Stats[sName["AttackTwoAnimationType"]]
            a2animMult.value = +Stats[sName["AttackTwoAnimationSpeedMult"]]
            a2dmgMult.value = +Stats[sName["AttackTwoDamageMult"]]
            a2ammoSizeMult.value = Stats[sName["AttackTwoAmmoSizeMult"]]
            a2ammoLifeMult.value = Stats[sName["AttackTwoAmmoLifeMult"]]
          }

          if (+Stats[sName["NumOfAttacks"]] === 3) {

            const a3animation = v[0].value[2].value[0]
            const a3animMult = v[0].value[2].value[1]
            const a3dmgMult = v[0].value[2].value[2]
            const a3ammoSizeMult = v[0].value[2].value[3]
            const a3ammoLifeMult = v[0].value[2].value[4]

            a3animation.value = Stats[sName["AttackThreeAnimationType"]]
            a3animMult.value = +Stats[sName["AttackThreeAnimationSpeedMult"]]
            a3dmgMult.value = +Stats[sName["AttackThreeDamageMult"]]
            a3ammoSizeMult.value = +Stats[sName["AttackThreeAmmoSizeMult"]]
            a3ammoLifeMult.value = +Stats[sName["AttackThreeAmmoLifeMult"]]
          }

        }

        if (Stats[sName["Type"]] === "Spine Driver") {

          const a1animation = v[0].value[0].value[0]
          const a1animMult = v[0].value[0].value[1]
          const a1dmgMult = v[0].value[0].value[2]
          const a1ammoSizeMult = v[0].value[0].value[3]
          const a1ammoLifeMult = v[0].value[0].value[4]

          a1animation.value = Stats[sName["AttackOneAnimationType"]]
          a1animMult.value = Stats[sName["AttackOneAnimationSpeedMult"]]
          a1dmgMult.value = Stats[sName["AttackOneDamageMult"]]
          a1ammoSizeMult.value = Stats[sName["AttackOneAmmoSizeMult"]]
          a1ammoLifeMult.value = Stats[sName["AttackOneAmmoLifeMult"]]
        }

        if (Stats[sName["Type"]] === "CC Striker") {

          const dmgReduction = v[2]
          dmgReduction.type = "float"
          dmgReduction.value = +Stats[sName["DamageTakenMultiplier"]]

          const a1chargeFrames = v[3].value[0].value[0]
          const a1animation = v[3].value[0].value[1]
          const a1animMult = v[3].value[0].value[2]
          const a1dmgMult = v[3].value[0].value[3]
          const a1ammoSizeMult = v[3].value[0].value[4]
          const a1ammoLifeMult = v[3].value[0].value[5]

          a1chargeFrames.value = +Stats[sName["AttackOneChargeFrames"]]
          a1animation.value = Stats[sName["AttackOneAnimationType"]]
          a1animMult.value = +Stats[sName["AttackOneAnimationSpeedMult"]]
          a1dmgMult.value = +Stats[sName["AttackOneDamageMult"]]
          a1ammoSizeMult.value = +Stats[sName["AttackOneAmmoSizeMult"]]
          a1ammoLifeMult.value = +Stats[sName["AttackOneAmmoLifeMult"]]

          if (+Stats[sName["NumOfAttacks"]] >= 2) {
            const a2chargeFrames = v[3].value[1].value[0]
            const a2animation = v[3].value[1].value[1]
            const a2animMult = v[3].value[1].value[2]
            const a2dmgMult = v[3].value[1].value[3]
            const a2ammoSizeMult = v[3].value[1].value[4]
            const a2ammoLifeMult = v[3].value[1].value[5]
            const a2fireSpread = v[4].value[1].value[2]

            if (v[3].value[1].value[7] === undefined) {
              v[3].value[1].value[7] = {
                "type": "int",
                "value": 1
              }
              v[3].value[1].value[8] = {
                "type": "float",
                "value": 1
              }
              v[3].value[1].value[9] = {
                "type": "float",
                "value": 0
              }
            }
            const a2fireCount = v[3].value[1].value[7]
            const a2fireAngle = v[3].value[1].value[9]

            a2chargeFrames.value = +Stats[sName["AttackTwoChargeFrames"]]
            a2animation.value = Stats[sName["AttackTwoAnimationType"]]
            a2animMult.value = +Stats[sName["AttackTwoAnimationSpeedMult"]]
            a2dmgMult.value = +Stats[sName["AttackTwoDamageMult"]]
            a2ammoSizeMult.value = +Stats[sName["AttackTwoAmmoSizeMult"]]
            a2ammoLifeMult.value = +Stats[sName["AttackTwoAmmoLifeMult"]]
            a2fireCount.value = +Stats[sName["AttackTwoFireCount"]]
            a2fireAngle.value = +Stats[sName["AttackTwoFireAngle"]]
            a2fireSpread.value = +Stats[sName["AttackTwoFireSpread"]]
          }

          if (+Stats[sName["NumOfAttacks"]] === 3) {
            const a3chargeFrames = v[3].value[2].value[0]
            const a3animation = v[3].value[2].value[1]
            const a3animMult = v[3].value[2].value[2]
            const a3dmgMult = v[3].value[2].value[3]
            const a3ammoSizeMult = v[3].value[2].value[4]
            const a3ammoLifeMult = v[3].value[2].value[5]
            const a3fireSpread = v[4].value[2].value[2]

            if (v[3].value[2].value[7] === undefined) {
              v[3].value[2].value[7] = {
                "type": "int",
                "value": 1
              }
              v[3].value[2].value[8] = {
                "type": "float",
                "value": 1
              }
              v[3].value[2].value[9] = {
                "type": "float",
                "value": 0
              }
            }
            const a3fireCount = v[3].value[2].value[7]
            const a3fireAngle = v[3].value[2].value[9]


            a3chargeFrames.value = +Stats[sName["AttackThreeChargeFrames"]]
            a3animation.value = Stats[sName["AttackThreeAnimationType"]]
            a3animMult.value = +Stats[sName["AttackThreeAnimationSpeedMult"]]
            a3dmgMult.value = +Stats[sName["AttackThreeDamageMult"]]
            a3ammoSizeMult.value = +Stats[sName["AttackThreeAmmoSizeMult"]]
            a3ammoLifeMult.value = +Stats[sName["AttackThreeAmmoLifeMult"]]
            a3fireCount.value = +Stats[sName["AttackThreeFireCount"]]
            a3fireAngle.value = +Stats[sName["AttackThreeFireAngle"]]
            a3fireSpread.value = +Stats[sName["AttackThreeFireSpread"]]
          }
        }
        return v
      },

      resource: v => {
        if (Stats[sName["Type"]] === "Vehicle Spawner") {
          for (var i = 0; i >= 9; i++) {
            if (Stats[sName[`Res${i}` != "N/A"]]) {
              v.value[i] = {
                type: "string",
                value: Stats[sName[`Res${i}`]]
              }
            }
          }
        }
        return v
      }

    })

  } catch (error) {
    try {
      newName = Stats[sName["NewName"]]
    } catch {
      newName = null
    }
    if (newName != null) {
      console.log("Weapon '", newName, "' with ID", `NewWep${step}`, "has encountered an Error:")
      console.log(error.stack)
    }

  }
  if (i === parsedStats.data.length && runOnce === false) {
    console.log("Resetting Loop...")
    i = 0
    runOnce = true
  }
}

for (const [fileName, template] of Object.entries(added)) {
  const path = `${outDir}/${fileName}.json`
  console.log(`Writing ${fileName}`)
  fs.writeFileSync(path, json(template))
}

console.log("Done!")