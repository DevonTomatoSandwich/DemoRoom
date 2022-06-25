# DemoRoom
Walk around a 3D room in first person. Uses typescript/react (originally a pygame)
![](https://github.com/DevonTomatoSandwich/DemoRoom/blob/master/github_images/demo_home.png)

# Run

For the most up to date react code
1. Click [this codesandbox](https://codesandbox.io/s/demo-room-shsie?file=/src/polygons.txt) to open the codesandbox
2. In "browser pane" on the right, click picture to start

 
You can also run the old python pygame demo in [repl](https://repl.it/@billybud/Demo-Room) but repl is a bit glitchy. It has problems with handling relative mouse changes when the cursor is out of the trinket window. For better testing you should run in a python environment on your local system

# Play instructions
- Move the player with wsad
- Look around by moving the mouse

# How it works

- A list of polygons with points in 3D world coordinates are provided in a txt file
- These points are translated by the position the player is standing
- The points are then rotated depending on the angle the player is looking. This is done using matrix calculations to adjust the points into the player's local coordinate system
- Points behind the camera must be linearly interpolated to a point infront of the camera along the polygon edges. How far infront it should go is dependent on how close a player can get to a wall and also their field of view. This totally removes glitches near walls 
- The points can be projected onto a virtual 2d surface directly infront of the viewer. Using similar triangles you just divide by the local depth for a surface 1 unit infront.
- Finally the points are scaled to fit onto the screen



# Explanation todos
I ~~will be uploading~~ have uploaded documents that show more of the mathematical concepts used in the script. These include:
 - [x] Rotation matrix derivation (Linear algebra) see 'Rotation matrix.docx'
 - [x] Formula to prevent wall glitching (3D Trigonometry) see 'Fixing glitchy walls.docs'
 - [x] Linear interpolation for points on a polygon (Quick mafs) see 'Interpolating Polygons.docs'
 
 # Future Ideas
  - [ ] textures
  - [ ] animations
  - [ ] furniture
  - [ ] jumping
  - [ ] better collision detection

 - [ ] convert js to typescript
 - [ ] there are also minor todos mentioned in the code
 - [ ] update 'Fixing glitchy walls.docs' to include different canvas sizes
