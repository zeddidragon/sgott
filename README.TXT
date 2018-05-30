How to install mods
============
1, Unzip this file inside the root folder of EDF, in the same folder where EDF41.exe is located.
   This might be somewhere along the lines of C:/Program Files/Steam/steamapps/common/Earth Defense Force 4.1/

2. Run sgottstrap.exe

Your AF99-ST should now be buffed, and Electric Grenade should be added to the drop pool.

Feel free to edit their respective files and run sgottstrap.exe again to reflect your changes.

If something gets messed up while you're modding you can always restore the backup executable sgottstrap makes for you before patching it.
Deleting the folder SgottMods and running sgottstrap.exe will also allow all settings to revert.

If someone makes a weapon mod using SGOTT, place the json file inside of SgottTemplates/weapon, then run sgottstrap.exe.

Currently, mods only affect the main campaign. DLC campaigns will remain untouched.

Making mods
===========
Use CriPakGUI https://github.com/wmltogether/CriPakTools/releases to open root.cpk
then find the weapon file you wish to edit or base your new weapon on.
If you don't know which file is which weapon, refer to this table:

https://docs.google.com/spreadsheets/d/1fEb_OVwe_Z0XndrJ3J-psQ4rQ_n2ai95uJOq26XoDl0/edit#gid=0

After extracting the file, convert it to json using sgott.js or sgott.exe

Edit the JSON file until you're satisfied, then use the same tool to convert it back.

See the above section for how to test your mod.
