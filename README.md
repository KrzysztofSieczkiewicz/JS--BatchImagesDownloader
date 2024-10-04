Based on JS electron. Application serves to download images based on .xlsx file input.

File setup:
.xlsx file should contain header row. 
First column should contain unique indentifiers (downloaded files will be named using row identifier and numerical suffix if there are more than one image per row).
Any other cell in a row is assumed as url (invalid entries will be listed as download failures).

How to use:
1. Select .xlsx file from Your disk
2. Load .xlsx file (it might take a while depending on size as the whole thing needs to be parsed)
3. Press download and wait. There will be "ImagesDownload_xxx" folder created in Your downloads folder, images should appear as this program runs through
4. After finishing information will show up on success/failures and eventual list of failed entries.

How to run:
1. Running command 'npm run start'
2. Running command 'npx electronmon .' will allow for live updates
3. Packaging via 'npm run dist -- --x64' will create working installer for win x64 (other systems might require package.json alteration)
   Command will create dist directory in which You ready application and installer can be found
   Might require running with admin permissions
