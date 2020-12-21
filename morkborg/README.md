# morkborkFVTT
A Mork Borg game system for foundry vtt

This is forked from Joseph Hopson's version here:
https://gitlab.com/foundryvtt-mods/morkborg

I believe the original is no longer being updated, and I wanted to make some design changes anyway. Feel free to contact me if you want to collaborate, as front-end is not my forte at all, so progress on this will be slow.

The most significant change between this and Joseph's version is that I have added a compendium for all the class features/abilities, and a tab for holding them on the character sheet, so it is a bit easier to see what your character can do (and to make it possible to have custom characters). Features can be dragged/dropped from the compendium to the character sheet just like weapons, armor, etc. 

BE AWARE, THIS IS A VERY EARLY VERSION AND THERE ARE PROBABLY BUGS. So you know maybe don't build hundreds of npcs yet and bank some massive campaign on it, though tbh they are so simple it probably won't matter.

Long term goals:
1. Add the MBC Feats
2. Clean up UI, improve feature icons.
3. Make the character sheets more customizable.

Known bugs:
1: The features can't initially be expanded, you have to press the edit button first, then they will expand.
2: Most sheet macros aren't drag and drop yet (or don't exist at all yet). This is less a bug and more of a planned enhancement.
3: Updating tokens often doesn't update the actor. No idea why this is happening, but it's a priority to fix.


Open an issue (or just message me) if you find any other bugs.

Recent changes:
1. Fixed the bug with dice in the format of dx not rolling.
2. Added crit/fumble highlighting.
3. Fixed the manifest so the system can be automatically installed/updated through foundry.

