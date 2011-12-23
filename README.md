# What does it do?

It's a simple application thats uses THREE.js' particle system to display point
clouds in the browser using WebGL. It also has controls to navigate the cloud.

It currently supports the [Point Cloud Librarys](http://www.pointclouds.org/)
.pcd ASCII format, using the convert script to wrap its contents in a .js file
that the viewer can import.

# What's wrong with it?

A lot. While point clouds are displayed, the very simplistic camera
manipulations make it very hard to move around. Additionally, the code is
unstructured at times and still a mess. Colored points aren't supported either,
even though variables/classes for that exist.

It's pretty much just a proof of concept for an idea I had, as well as a
playground for me.

# Usage

You propably shouldn't, as of yet. But, if you must:

## Controls

Once (if) you get it running, the mouse wheel moves the camera forward/backward,
and pressing the left mouse button moves the camera left/right up/down.

Pressing the right mouse button rotates the camera (looking around).

Due to the simplistic camera manipulations, this doens't really work and if
you move/rotate too much, the movements get very confusing.

## Setup

Put your .pcd file in the "resources/" directory. Run convert:

    chmod +x convert
    ./convert your_file.pcd > your_file.pcd.js
    
Change the line

    <script type="text/javascript" id="point_cloud" src="resources/room.pcd.js"></script>
    
in the viewer.html file so it points to your file.

Open viewer.html in a web browser that supports WebGL. Since everything is
static and the paths are relative, you could make the files available with any
webserver and it should work. Haven't tried it, though.
