# Bean Ops: Shadow Strike

Side-scrolling 2D run-and-gun in the browser. This is not a Unity project and it does not build an Android APK. Touch controls are the same on-screen pads used for a phone in landscape.

Music and sound effects are original tones synthesized in the browser. No licensed tracks or recorded sound libraries are included.

## Play

- **Play** opens a short briefing, then the warehouse quick raid: 40 hostiles, then the warehouse defender at the blast door.
- **Mission map** is thirty levels across five zones: City 1–6, Factory 7–12, Military Base 13–18, Desert 19–24, Final Base 25–30. Level 1 starts unlocked. Clearing a level unlocks the next, saves stars and best score, and lets you replay earlier levels. Zone commanders are levels 6, 12, 18, 24, and 30. Commander Zero is still a three-phase fight. The warehouse quick raid is unchanged.

| # | Mission | Goal |
| --- | --- | --- |
| 1 | City Chaos | Clear street squads, drop the Street Boss, reach extraction |
| 2 | Factory Mayhem | Destroy 3 generators, then the Foreman. Belts, steam, a moving platform |
| 3 | Military Base | Destroy 2 antennas, survive the alarm, drop the Gate Warden, reach the exit |
| 4 | Desert Strike | Cross collapsing bridges, burn the supply depot, drop the Dune Commander |
| 5 | Commander Zero | Arena fight in three phases, then the campaign-complete screen |

Bosses get a short name call and a music change, then control returns. Victory and defeat show the result, then you can continue, retry, or leave.

## Operatives

Five soldiers share the same move set and sprite rig. Color, accent, and stats change the run. Commando is free. The others unlock with coins or by clearing campaign missions (Speedster after mission 1, Tank after 2, Gunner after 3, Shadow after 4).

| Operative | Difference |
| --- | --- |
| Commando | Balanced health, speed, and weapons |
| Speedster | Faster run and reload, less health |
| Tank | More health and armor, slower run |
| Gunner | Faster fire and larger magazines |
| Shadow | Shorter dodge, melee grants a brief phase |

Double-tap a direction to dodge. Selected operative is saved.

## Coins and upgrades

Coins show on the menu and in the raid HUD. The banked number is saved. A `+` amount is coins from this run that are not banked until you clear it.

A first clear pays 50. New stars pay 20 each. The first time you drop that mission's boss pays 30. Extra kills above your best on that mission pay 1 each. A coin pickup pays 5 once. Replaying does not pay the same clear, star, boss, or pickup again.

Weapon shop (pistol, rifle, shotgun), levels 0–5: damage, fire rate, magazine, reload, accuracy. Prices start at 12 and rise by 12 each level. Player upgrades (health, armor, speed, jump, dodge, ability recharge, reserve ammo) cap at 5 and start at 16. Armor never passes 42%. Buys at 48 coins or more ask you to confirm. A purchase that you cannot afford does nothing.

## Settings

Master, music, and effects volume. Difficulty Easy / Normal / Hard changes enemy health, enemy damage, and your damage. Vibration, screen shake, aim assist, pad size, pad opacity, left-handed layout, graphics (particle cap), and 30 or 60 FPS display. The simulation still steps at 60; 30 FPS only skips draws. English and Spanish cover the menu chrome. Privacy explains that nothing leaves the device. Reset settings and reset progress are separate. Reset progress asks you to confirm.

## Profile and achievements

Profile shows the operative, coins, kills, deaths, clears, best score, boss bonuses, unlocked operatives, and play time. You can export or import a JSON save.

Achievements unlock once from real records: First Blood (1 kill), Sharpshooter (50 kills), Survivor (clear a mission with no deaths, including no Continue), Boss Slayer (Commander Zero), Weapon Master (one weapon maxed), Campaign Hero (all thirty levels).

## Controls

Move with the left and right pads, or A / D / arrow keys. Jump with the jump pad, Space, or W. Shoot with the fire pad, J, or X. Hold fire for the rifle. Reload R, swap weapon E. Melee and grenade are on the right cluster. Pause with the pause pad or Esc.

Shooting works while running, jumping, and falling. It only stops during a reload or a melee swing.

## Checkpoints

Campaign missions remember the last safe ground. **Continue** puts you back without respawning cleared enemies or spent pickups, and it counts as a death. **Restart** starts that mission over. Older mission progress is kept.

## Save

One local save (`beanops-shadow-strike-v2`, format version 4) holds coins, the operative, purchases, weapon and player levels, campaign records, achievements, stats, and settings. A backup copy is written before each save. Corrupt data falls back to the backup, then to a fresh file. Older saves with the same key still load. There is no account and no cloud save.

## Audio

Menu, roster, each mission, the boss, victory, and defeat each use a different synthesized pattern, plus ambience in the city, factory, base, and desert cues. Shots, reloads, steps, jumps, landings, melee, hurt, explosions, pickups, alerts, and UI clicks are synthesized too, with a voice cap so they do not stack without limit. The tab muting the page suspends audio. The first tap unlocks sound, which is what mobile browsers require. This was not tested on a physical Android device.
