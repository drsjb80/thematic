# Thematic

[![SonarCloud](https://sonarcloud.io/images/project_badges/sonarcloud-white.svg)](https://sonarcloud.io/dashboard?id=drsjb80_thematic)

Easily switch between themes in Firefox and Thunderbird. This extension
allows you to switch between themes via keyboard combinations or every N
minutes. It also allows one to specify switching to a random next theme.
Autoswitching and having Thematic on the tools menu is not supported in
Thunderbird.

* https://addons.mozilla.org/en-US/firefox/addon/personaswitcher/
* https://addons.thunderbird.net/en-US/thunderbird/addon/thematic/

This is a re-implementation of personaswitcher that was developed for Firefox 4.

For Thunderbird, you can use any of Firefox's themes, with a little effort.
First, find the theme you want and right-click on the Install Theme. Choose
Copy Link and use another program to download the file locally. Curl, wget,
or even another browser will do the trick.

<img src="install2.png">


In Thunderbird, go to Tools -> Extensions and Themes. Click the settings
icon and choose Install Add-on From File...

<img src="install1.png">

Click on the .xpi you downloaded and you should be good to go. It appears
that Thunderbird currently doesn't notify Thematic of the new theme, so a
restart is in order.
