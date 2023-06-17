# Simple Music Player

Adapted from

[https://www.geeksforgeeks.org/create-a-music-player-using-javascript/](https://www.geeksforgeeks.org/create-a-music-player-using-javascript/)

[https://github.com/sayantanm19/js-music-player](https://github.com/sayantanm19/js-music-player)

HTML 5 provides multimedia functionality to play mp3 files. I have authored JS code to dynamically generate HTML and JS to stream music files from one's own hard drive. I extended Sayantanm19's code to allow the user to host his own music files instead of the author suggested music on the free music archive. Indeed, Sayantanm19's README even suggests that the songs can be changed by editing the tracklist object.

The app is a simple node web server. It listens to requests, and uses the requested path to either serve up static files or to dynamically generate directery listings for directories. The key function is directery_listing. It dynamically generates an HTML 'file' with the requisite JS to allow the browser to play the contents of the given directory.

Further development goals are to use the express library, to make the code a bit cleaner and also to allow the hosting of multiple directories in a virtual directory composition.