meta usage
=======================

|Name|Description|Value Type|
|---|---|---|
|id|Name in weapontable|String|
|level|Weapon level|Number|
|category|Weapon category|Integral|
|unlockState|Whether it is the initial weapon||
||0 is to be obtained, 1 is the initial||
|dropRateModifier|The drop probability of the weapon|Float|
||The initial weapon with no star rating is 0||
|StarRating|Set the star rating of each attribute of the weapon|Structure|
||Should refer to weapontable, null if not needed||
|DLCWeapon|Whether it is a DLC weapon||
||0 is main, 1 is MP01, 2 is MP02||
||3 is dlc unlock(can't use it)||
||||
|AbilityDescCN|Chinese language|Structure|
|AbilityDescEN|English language|Structure|
|AbilityDescJA|Japanese language|Structure|
|AbilityDescKR|Korean language|Structure|
||Performance description of the weapon||
||Can include star rating, null if not needed||
||Should refer to WEAPONTEXT.language||
||||
|TextDescCN|Chinese language|String|
|TextDescEN|English language|String|
|TextDescJA|Japanese language|String|
|TextDescKR|Korean language|String|
||Weapon description, is the text||
||If you want to describe the performance of the weapon||
||It is also feasible. The vehicle is like that||
