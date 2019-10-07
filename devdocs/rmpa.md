Note: Swiped from KittopiaCreator. Thanks, Kit!

All offsets are calculated from the first byte of the respective data block (relative offsets).
Route and Camera Waypoints aren't extended to keep aligned to 0, so only the first in a route will always be at 0.


**RMPA Header**, which is about 0x30 in length:
- 0x00 RMP file type string, or PMR because of byte-swapping.
- 0x08 boolean denoting if routes are to be processed.
- 0x0C offset to route data.
- 0x10 boolean denoting if shapes are to be processed.
- 0x14 offset to shape data.
- 0x18 boolean denoting if camera paths are to be processed.
- 0x1C offset to camera path data.
- 0x20 boolean denoting if spawnpoints are to be processed.
- 0x24 offset to spawnpoint data.
 When there are less types of data (only spawns for example) the unused offsets will be duplicate pointers.

**Type Headers**, which are exactly 0x20 in length:
- 0x00 is how many Enumeration Sub-Headers there are.
- 0x04 is an offset to the start of the first enumerator?
- 0x0C is an offset to the end of the type's data (ends up at the same place as where the next type of data starts).
- 0x10 is the numeric waypoint identifier based on the whole RMPA.
- 0x18 points to a null string? Or, possibly the string table for some reason?

**Enumeration Sub-Headers**, which are exactly 0x20 in length:
- 0x08 points to where the enumeration will end.
- 0x14 is an offset to a string, possibly just a name.
- 0x18 is how many pieces of data to process. Multiple Enumeration Sub-Headers add up to the total amount of data pieces in the section.
- 0x1C points to where the enumeration will start.

**Camera Type Headers**, which are exactly 0x20 in length:
- 0x04 is an offset to the end of the type's data (ends up at the same place as where the next type of data starts).
- 0x08 is the numeric waypoint identifier based on the whole RMPA.
- 0x14 points to a null string?
- 0x18 is how many Camera Enumeration Sub-Headers there are?
- 0x1C is an offset to the start of the first enumerator?

**Camera Enumeration Sub-Headers**, which are exactly 0x30 in length:
- 0x04 points to where the enumeration will end.
- 0x14 is an offset to a string, possibly just a name.
- 0x18 is how many camera nodes to process.
- 0x1C points to where the enumeration will start.
- 0x24 is an offset to a timing enumerator?
- 0x2C is an offset to a different timing enumerator?

Types:

**Route Waypoints**, which are exactly 0x3C in length:
Remember! All offsets are calculated from the first byte of the _individual waypoint's_ data block.
- 0x00 is the waypoint's number in the current route, starting from 0.
- 0x08 is an offset to a 0x10 sized block that controls what the next waypoint will be.
- 0x10 is an offset to an SGO that'll apply extra settings, mostly just width.
- 0x1C is another offset to the same SGO? (possibly the real offset that's used?)
- 0x14 is the numeric waypoint identifier based on the whole RMPA.
- 0x24 is an offset to the path waypoint's name. Not all waypoints direct to a valid string since not all are used by name.

**Shape Setup**, which are about 0x30 in length:
- 0x08 is the string offset naming the shape type (rectangle, sphere, whatwasthethird).
- 0x10 is the offset to the shape's name.
- 0x24 is the offset to the shape's size data.

**Shape Data**, which are about 0x40 in length:
- 0x00 position X?
- 0x04 position Y?
- 0x08 position Z?
- 0x10 rectangle size X?
- 0x14 rectangle size Y?
- 0x18 rectangle size Z?
- 0x30 sphere diameter?

**Camera Path Nodes**, which are exactly 0x74 in length:
Remember! All offsets are calculated from the first byte of the _individual node's_ data block.
- 0x0C is an offset to an SGO.
- 0x10 is the numeric waypoint identifier based on the whole RMPA.
- 0x14 is 3F80 all the time?
- 0x18 above float 4100 a lot, sometimes zero?
- 0x68 is the offset to the node's name.

**Camera Timing?? Enumerators**, which are about 0x10 in length:
- 0x00 is a float of some kind, but can be zero.
- 0x04 is how many nodes to process (this and the other timing enum add up to the camera path nodes minus one?).
- 0x08 is an offset to the start of the nodes.

**Camera Timing?? Nodes**, which are exactly 0x1C in length:
- 0x00 a float
- 0x04 a float
- 0x08 always int 1?
- 0x14 always float 1?
- 0x18 always float 1?

**Spawnpoints**, which are about 0x40 in length:
- 0x04 has always been an offset pointing to a null string. I have seen a functional spawn not point to the string table, so it has nothing to do with the start of the string table.
- 0x08 is the numeric waypoint identifier based on the whole RMPA?
The first set of floats is the spawnpoint itself, while the second set is where the spawned entity will "Look at".
- 0x34 is the offset to the spawn's name.
