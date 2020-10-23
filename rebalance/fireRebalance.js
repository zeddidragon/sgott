#!/usr/bin/env node

const rbDataPath = "../data/41/weapons/"

//const outDir = 'C:/Program Files (x86)/Steam/steamapps/common/Earth Defense Force 4.1/SgottTemplates/weapon'
const outDir = './release/sgottstrap/SgottTemplates/weapon'

const fs = require('fs')
const {
	string
} = require('mathjs')
const Papa = require('papaparse')
const table = require(`${rbDataPath}_WEAPONTABLE`)
const textTable = require(`${rbDataPath}_WEAPONTEXT`)
const blurbs = require('../helpers/blurbs')
const getId = require('../helpers/get-id')
const getNode = require('../helpers/get-node')
const patch = require('../helpers/patch')
const getIndex = require('../helpers/spread-sheet-index')

const rawSgos = new Map()
const seconds = 60
const minutes = seconds * 60

const modded = new Set()

var skipped = 0
var success = 0

const weaponByCat = {
	0: "Assault Rifles",
	1: "Shotguns",
	2: "Sniper Rifles",
	3: "Rocket Launchers",
	4: "Missile Launchers",
	5: "Grenades",
	6: "Special Weapons (Ranger)",
	10: "Short Range Lasers",
	11: "Laser Rifles",
	12: "Mid-Rg Electroshock",
	13: "Particle Cannons",
	14: "Precision Energy",
	15: "Plasma Launchers",
	16: "Homing Energy",
	17: "Special Weapons (Wing Diver)",
	20: "Close Cmbt Strikers",
	21: "Close Cmbt Piercers",
	22: "Shields",
	23: "Heavy Auto Weapons",
	24: "Fire Support",
	25: "Heavy Missiles",
	26: "Special Weapons (Fencer)",
	30: "Guidance Equipment",
	31: "Air Raids",
	32: "Support Equipment",
	33: "Personal Defence",
	34: "Stationary Weapons",
	35: "Special Equipment",
	36: "Tanks",
	37: "Ground Vehicles",
	38: "Helicopters",
	39: "Mechs"
}

const statReference = require("./rbSource/statReference.json")
const coreStats = statReference.variables;

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

function replaceText(textNode, pattern, replacement) {
	textNode.value[3].value = textNode.value[3].value.replace(pattern, replacement)
}

function rebalance(query, cb) {
	table.variables[0]
		.value
		.filter(({
			value: node
		}, i) => {
			if (query.id && query.id !== node[0].value) return false
			if (query.category != null) { // Category is present, evaluate
				const category = node[2].value
				const queried = query.category
				//if(Array.isArray(queried)) console.log({category, queried})
				if (Array.isArray(queried)) {
					if (!queried.includes(category)) return false
				} else if (queried !== category) {
					return false
				}
			}
			if (query.name) {
				const name = textTable.variables[0].value[i].value[2].value
				if (typeof query.name === 'string' && name !== query.name) return false
				if (query.name.test && !query.name.test(name)) return false
			}
			return true
		})
		.forEach((node, i) => {
			const path = `${rbDataPath}/${getId(node).toUpperCase()}`
			const template = require(path)
			const text = textTable.variables[0].value[table.variables[0].value.indexOf(node)]
			modded.add(node)
			cb(template, i, node, text)
		})
}

function assign(property, value) {
	return function (template) {
		patch(template, property, value)
	}
}

function applyStat(template, patchStats, stat) {
	if (patchStats[sName[stat.target]] != "Default") {
		if (stat.type === "float" || stat.type === "int") {
			patch(template, stat.target, +patchStats[sName[stat.source]])
		} else {
			patch(template, stat.target, patchStats[sName[stat.source]])
		}
	}
}

function applyCoreStats(template, patchStats) {
	//Standard Weapon Parameters
	//console.log("Damage:",+Stats[sName["DamagePerHit"]])

	for (stat of coreStats) {
		applyStat(template, patchStats, stat)
	}
	// //Lock Angle
	patch(template, 'LockonAngle', v => {
		v[0].value = +patchStats[sName["LockOnAngleH"]]
		v[1].value = +patchStats[sName["LockOnAngleV"]]
		return v
	})

	//Fire Vector
	if (patchStats[sName["VectorSetting"]] === "Custom") {
		patch(template, 'FireVector', [{
			type: 'float',
			value: +patchStats[sName["FireVectorX"]],
		}, {
			type: 'float',
			value: +patchStats[sName["FireVectorZ"]],
		}, {
			type: 'float',
			value: +patchStats[sName["FireVectorY"]],
		}])
	}

	//Ammo Colour
	if (patchStats[sName["ColourSetting"]] === "Custom") {
		patch(template, 'AmmoColor', [{
			type: 'float',
			value: +patchStats[sName["AmmoColourR"]],
		}, {
			type: 'float',
			value: +patchStats[sName["AmmoColourG"]],
		}, {
			type: 'float',
			value: +patchStats[sName["AmmoColourB"]],
		}, {
			type: 'float',
			value: +patchStats[sName["AmmoColourAlpha"]],
		}])
	}

	//Secondary Fire Parameters
	patch(template, 'SecondaryFire_Type', +patchStats[sName["SecondaryFireType?"]])
	if (+patchStats[sName["SecondaryFireType?"]] === 1) {
		patch(template, 'SecondaryFire_Parameter', (v, node) => {
			node.type = 'float'
			return +patchStats[sName["ZoomFactor"]]
		})
	}
	//console.log("Standard weapon parameters applied successfully")
	//Weapon Name Settings   
	patch(template, 'name', v => {
		const eng = v.find(node => node.name === 'English')
		const jap = v.find(node => node.name === 'Japanese')
		const china = v.find(node => node.name === 'Chinese')
		eng.value = patchStats[sName["NewName"]]
		//console.log(Stats[sName["NewName"]])
		jap.value = patchStats[sName["JapaneseName"]]
		china.value = patchStats[sName["ChineseName"]]
		return v
	})

}

function sprdSheetRebalance(targetCategory, sheet) {
	console.log("\nBeginning rebalance of:", weaponByCat[targetCategory], "\n- - - - - - - - - -")
	rebalance({
		category: targetCategory
	}, (template, i, meta, text) => {
		//TRY START
		try {
			//console.log(getId(meta))
			var Stats = parsedStats.data.find(row => row[sName["ID"]] === getId(meta))
			//console.log(getId(meta), Stats[sName["NewName"]], "Attempting...")
			var vTouched = []
			//console.log("Beginning rebalance of",Stats[sName["NewName"]],"...")
			//console.log("meta pre assign: ",meta)
			//console.log("Assignment value check: ",(Stats[1]/25))
			//Assign Level
			meta.value[4].value = Stats[sName["Level"]] / 25
			//if(Stats[sName["PlaceAfter"]] === "FIRST"){
			//	template.meta.after = null			}

			//console.log(parsedStats.data[2],"\n",Stats)

			if (Stats[sName["PlaceAfter"]] === "FIRST") {
				template.meta.after = null
				template.meta.before = Stats[sName["PlaceBefore"]]
			} else {
				template.meta.after = Stats[sName["PlaceAfter"]]
				template.meta.before = null
			}

			template.meta.category = +Stats[sName["NewCategory"]]
			template.meta.unlockState = +Stats[sName["UnlockState"]]
			//console.log("meta post assign: ",meta)

			applyCoreStats(template, Stats)

			//Set Weapon Description
			text.value[3].value = Stats[sName["Description"]].replace(/\|/g, "\n")
			//console.log("Name and Description applied successfully")

			//TARGETED CHANGES START

			if (Stats[sName["AmmoClass?"]] === "BombBullet01") {
				patch(template, 'Ammo_CustomParameter', v => {
					const detector = v.find(node => node.name === 'IsDetector')
					const expType = v.find(node => node.name === 'BombExplosionType')
					detector.value = +Stats[sName["Detector?"]]
					expType.value = +Stats[sName["ExplosionType"]]
					if (Stats[sName["RealExplosionType"]] === "Splendor") {
						const splendPar = v.find(node => node.name === 'SplendorParameter')
						const FleCount = splendPar.value.find(node => node.name === 'FlechetteCount')
						const FleLife = splendPar.value.find(node => node.name === 'FlechetteAlive')
						const FleSpeed = splendPar.value.find(node => node.name === 'FlechetteSpeed')
						const FleSize = splendPar.value.find(node => node.name === 'FlechetteSize')
						//Spread Stuff
						const FleSpread = splendPar.value.find(node => node.name === 'FlechetteSpread')
						const FleSpreadH = FleSpread.value.find(node => node.name === 'Horizontal')
						const FleSpreadV = FleSpread.value.find(node => node.name === 'Vertical')
						const FleSpreadVOff = FleSpread.value.find(node => node.name === 'VerticalOffset')
						const searchRange = splendPar.value.find(node => node.name === 'SearchRange')
						FleCount.value = +Stats[sName["FireHits"]]
						FleLife.value = +Stats[sName["SplendorLifetime"]]
						FleSpeed.value = +Stats[sName["SplendorSpeed"]]
						FleSize.value = +Stats[sName["SplendorSize"]]
						FleSpreadH.value = +Stats[sName["SplendorSpreadH"]]
						FleSpreadV.value = +Stats[sName["SplendorSpreadV"]]
						FleSpreadVOff.value = +Stats[sName["SplendorSpreadVOffset"]]
						searchRange.value = +Stats[sName["SecondarySearchRange"]]
					}
					return v
				})
			}

			if (Stats[sName["Type"]] === "Ballistic") {
				patch(template, 'Ammo_CustomParameter', v => {
					const summonDelay = v[2]
					summonDelay.value = +Stats[sName["SummonLeadTime"]]
					const summonCustomParameter = v[4]
					const artilleryInterval = summonCustomParameter.value[3]
					const artilleryCount = summonCustomParameter.value[2]
					const artilleryExplosionRadius = summonCustomParameter.value[9]
					artilleryInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
					artilleryCount.value = +Stats[sName["SecondaryShotCount"]]
					artilleryExplosionRadius.value = +Stats[sName["SecondaryShotAoE"]]
					return v
				})
				//console.log("Ballistic Air Raid specific parameters applied successfuly")
			}

			if (Stats[sName["Type"]] === "Bombing Plan") {
				patch(template, 'Ammo_CustomParameter', v => {
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

					return v
				})
				//console.log("Bombing Plan Air Raid specific parameters applied successfuly")
			}

			if (Stats[sName["Type"]] === "Target Painted") {
				patch(template, 'Ammo_CustomParameter', v => {
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
					return v

				})
				//console.log("Target Painted Air Raid specific parameters applied successfuly")
			}

			if (Stats[sName["Type"]] === "Auto Turret") {
				patch(template, 'Ammo_CustomParameter', v => {
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
					return v
				})
				//console.log("Turret specific parameters applied successfuly")
			}

			if (Stats[sName["Type"]] === "Napalm") {
				patch(template, 'Ammo_CustomParameter', v => {
					const napalmStats = v.find(node => node.name === 'EmitterParameter')
					const napalmHitCount = napalmStats.value.find(node => node.name === 'EmitterAmmoCount')
					const napalmHitInterval = napalmStats.value.find(node => node.name === 'EmitterInterval')
					const napalmFlameSize = napalmStats.value.find(node => node.name === 'EmitterAmmoSize')
					napalmHitCount.value = +Stats[sName["SecondaryAmmoCount"]]
					napalmHitInterval.value = +Stats[sName["SecondaryProjectileInterval"]]
					napalmFlameSize.value = +Stats[sName["SecondaryProjectileSize"]]
					return v
				})
			}

			if (Stats[sName["Type"]] === "Target Painter") {
				patch(template, 'Ammo_CustomParameter', v => {
					const lockSpeed = v[0]
					const lockRange = v[1]
					lockSpeed.value = +Stats[sName["SecondaryLockTime"]]
					lockRange.value = +Stats[sName["SecondaryLockRange"]]
					return v
				})
			}

			if (Stats[sName["Type"]] === "Lock On Launcher") {
				patch(template, 'Ammo_CustomParameter', v => {
					const misAcel = v[4]
					const misTurn = v[5]
					const misMaxSpeed = v[6]
					const misIgniteDelay = v[7].value[0]
					const misFlyStraight = v[8]
					//console.log("Lock On Triggered.  Base Values:", misAcel, misTurn, misMaxSpeed, misIgniteDelay, misFlyStraight )
					misAcel.value = +Stats[sName["SecondaryProjectileAcceleration"]]
					misTurn.value = +Stats[sName["SecondaryTurnSpeed"]]
					misMaxSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
					misIgniteDelay.value = +Stats[sName["SecondaryEngineIgniteDelay"]]
					misFlyStraight.value = +Stats[sName["SecondaryFlyStraightTime"]]
					//console.log("Assigned Values:", misAcel, misTurn, misMaxSpeed, misFlyStraight )
					return v
				})
			}

			if (Stats[sName["Type"]] === "Homing Laser") {
				patch(template, 'Ammo_CustomParameter', v => {
					const laserAcel = v[3]
					const laserTurn = v[4]
					const laserMaxSpeed = v[5]
					const laserFlyStraight = v[6]
					//console.log("Lock On Triggered.  Base Values:", misAcel, misTurn, misMaxSpeed, misFlyStraight )
					laserAcel.value = +Stats[sName["SecondaryProjectileAcceleration"]]
					laserTurn.value = +Stats[sName["SecondaryTurnSpeed"]]
					laserMaxSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
					laserFlyStraight.value = +Stats[sName["SecondaryFlyStraightTime"]]
					//console.log("Assigned Values:", misAcel, misTurn, misMaxSpeed, misFlyStraight )
					return v
				})
			}

			if (Stats[sName["Type"]] === "Energy Cluster") {
				patch(template, 'Ammo_CustomParameter', v => {
					const spreadAngle = v[2]
					const spreadType = v[3]
					const fireCount = v[5].value[2]
					const fireInterval = v[5].value[3]
					const ammoSpeed = v[5].value[5]
					const shotAoE = v[5].value[9]
					const ammoLifetime = v[5].value[10]

					spreadAngle.value = +Stats[sName["SecondarySpreadAngle"]]
					spreadType.value = +Stats[sName["SecondarySpreadTypeFlag"]]
					fireCount.value = +Stats[sName["SecondaryShotCount"]]
					fireInterval.value = Stats[sName["SecondaryProjectileInterval"]] - 1
					ammoSpeed.value = +Stats[sName["SecondaryProjectileSpeed"]]
					shotAoE.value = +Stats[sName["SecondaryShotAoE"]]
					ammoLifetime.value = +Stats[sName["SecondaryProjectileLifetime"]]
					return v
				})
			}

			if (Stats[sName["Type"]] === "CC Piercer") {
				patch(template, 'FireInterval', 1)
				patch(template, 'custom_parameter', v => {

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
					return v
				})
			}

			if (Stats[sName["Type"]] === "Spine Driver") {
				patch(template, 'custom_parameter', v => {
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

					return v
				})
			}

			if (Stats[sName["Type"]] === "CC Striker") {
				patch(template, 'FireInterval', 1)
				patch(template, 'custom_parameter', v => {

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
					return v
				})

			}

			// if(Stats[sName["Type"]] === "Lightning"){
			// patch(template, 'Ammo_CustomParameter', v => {
			// const lightNoise = v[0].value
			// const lightRandVel = v[1].value
			// const lightCurve = v[2].value
			// const lightMod = v[3].value
			// lightNoise.value = 1
			// lightRandVel.value = 0
			// lightCurve.value = 0
			// lightMod.value = 1

			// })
			// }

			if (Stats[sName["Type"]] === "Vehicle Spawner") {

				patch(template, 'Ammo_CustomParameter', v => {
					//Navigate PTR Structure
					var vWeps = []
					const delay = v.find(node => node.name === 'SummonDelay')
					const sumPar = v.find(node => node.name === 'Summon_CustomParameter')
					const vCore = sumPar.value[3]
					const HPmult = sumPar.value[3].value[0].value[0]
					const DMGmult = sumPar.value[3].value[0].value[1]

					//Prepare Resource Variables
					var vRes = []
					const ammoModel = template.variables.find(node => node.name === 'AmmoModel')
					const porterModel = sumPar.value[0]
					const boxModel = sumPar.value[1]
					const vBase = sumPar.value[2]
					vRes.push(ammoModel, porterModel, boxModel, vBase)

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
							var vWepBase = Stats[sName[`VWepBase${vi+1}`]]
							if (Stats[sName["VType"]] === "Mechsuit") {
								basePath = sumPar.value[3].value[4]
							} else {
								basePath = sumPar.value[3].value[2]
							}

							var wepFound = false
							while (wepFound != true) {
								try {
									if (basePath.value[vi + offset].value[0].type === "string") {
										// console.log(`Found a string value at position VI:${vi} Offset:${offset}`)
										// console.log(`Found Weapon: ${basePath.value[vi+offset].value[0].value}`)
										vWeps[vi] = basePath.value[vi + offset].value[0]
										wepFound = true
									} else {
										//console.log(`Did not find a string value at position VI:${vi} Offset:${offset}.  Offset is now ${offset+1}`)
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
							//Add Resource object element
							vRes.push(vWeps[vi])
							//Assign new weapon path
							const path = `./SgottMods/weapon/${vWepBase.toUpperCase()}`
							vWeps[vi].value = path + '.SGO'
							//Apply Vehicle Weapon Stats
							const vWepTemplate = require(`${rbDataPath}${vWepBase.toUpperCase()}`)
							var vStats = parsedStats.data.find(row => row[sName["ID"]] === vWepBase.toUpperCase())
							applyCoreStats(vWepTemplate, vStats)
							rawSgos.set(path.split(/\//).pop(), vWepTemplate)
						}
					}

					//Rebuild Resources Object
					const resourceObj = template.variables.find(node => node.name === "resource")
					resourceObj.value = vRes

					//End Vehicle Specific Changes
					return v
				})

			}

			//TARGETED CHANGES END

			console.log(getId(meta), Stats[sName["NewName"]], "= Success")
			success++
		}
		//TRY END
		catch (err) {
			console.log(`WARNING: Stats for weapon with ID ${getId(meta)} not found or is corrupted.  Skipping...`)
			console.log(err)
			skipped++
		}
		//CATCH END		
	})
	console.log("- - - - - - - - - -\nRebalance of", weaponByCat[targetCategory], "Complete\n")
}

//Load Rebalance stats from spreadsheet
const statsRaw = fs.readFileSync('./rbSource/gunBalanceSheet.csv', 'utf8')
const parsedStats = Papa.parse(statsRaw)
const sName = getIndex(parsedStats)

//sprdSheetRebalance(20, parsedStats)

for (i = 0; i <= 39; i++) {
	if (weaponByCat[i] != null) {
		sprdSheetRebalance(i, parsedStats)
	}
}

rebalance({
	category: 6,
	name: 'PX50 Bound Shot'
}, (template, i, meta, text) => {
	// Remove recoil animation.
	patch(template, 'custom_parameter', value => {
		value[0].value = 'assault_recoil1'
		value[1].value = 1
		value[2].value = 0
		return value
	})
})

// Remove recoil animation from bombs (WIP)
rebalance({
	category: 34,
	id: 'Weapon656'
}, (template, i, meta, text) => {
	patch(template, 'custom_parameter', v => {
		v[0].value = 'throw_recoil2'
		v[2].value = 0
		return v
	})
	patch(template, 'Ammo_CustomParameter', v => {
		v[5].value = 0.05
		return v
	})
})

rebalance({
	category: 37,
	name: /SDL1/
}, (template, i, meta, text) => {
	// Increase grip and weight of all bikes
	patch(template, 'Ammo_CustomParameter', values => {
		const summonParameters = values[4]
		const vehicleParameters = summonParameters.value[3]
		const mobilityParameters = vehicleParameters.value[1]
		const grip = mobilityParameters.value[0]
		grip.value *= 3
		const weight = mobilityParameters.value[2]
		weight.value *= 1.5
		return values
	})
})

rebalance({
	category: 37,
	name: /Grape/
}, (template, i, meta, text) => {
	// Add full rotation to grape's cannon
	const path = './SgottMods/weapon/vehicle401_striker'
	const vehicleTemplate = require(`${rbDataPath}VEHICLE401_STRIKER.json`)
	const cannonControl = getNode(vehicleTemplate, 'striker_cannon_ctrl')
	cannonControl.value[2].value = 60
	rawSgos.set(path.split(/\//).pop(), vehicleTemplate)
	patch(template, 'Ammo_CustomParameter', values => {
		const summonParameters = values[4]
		const vehicleConfig = summonParameters.value[2]
		vehicleConfig.value = path + '.SGO'
		return values
	})
})

function json(obj) {
	return JSON.stringify(obj, null, 2)
}


for (const [path, template] of rawSgos) {
	const filename = `${outDir}/${path}.json`
	//console.log(`Writing ${filename}` )
	fs.writeFileSync(filename, json(template))
}

for (const node of modded) {
	const id = getId(node)
	const path = `${rbDataPath}${id.toUpperCase()}`
	const template = require(path)
	const text = textTable.variables[0].value[table.variables[0].value.indexOf(node)]
	template.meta = {
		id: id,
		level: node.value[4].value * 25,
		description: text.value[3].value,
		after: template.meta.after,
		before: template.meta.before,
		category: template.meta.category,
		unlockState: template.meta.unlockState,
	}

	const name = text.value[2]
		.value
		.replace(/\s+/g, '-')
		.replace(/[^0-9a-zA-Z-]/g, '')
	const filename = `${outDir}/${id}_${name}.json`
	//console.log(`Writing ${filename}` )
	fs.writeFileSync(filename, json(template))
}

console.log('\nRebalancing of', success, 'weapons completed\nSkipped', skipped, 'items.')
