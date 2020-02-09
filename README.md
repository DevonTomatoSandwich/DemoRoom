# GameRoom
A Pygame where you can walk around in a 3D room in first person.

# Run
The code can be copied to [trinket](https://trinket.io/library/trinkets/create?lang=pygame)
But trinket has problems with handling relative mouse changes when the cursor is out of the trinket window.
For better testing you should run in a python environment on your local system

# Play instructions

- Press run to start 
- you may need to click inside the pygame window
- Move the player with wsad
- Look around by moving the mouse

# How it works

- A list of polygons with points in 3D are provided in global coordinates
- These points are translated by the position the player is standing in the horizontal plane
- The points are then rotated by the direction the player is looking. This is done using matrix multiplication to get the local coordinates of the player
- Points behind the camera must be linearly interpolated to a point infront of the camera along the polygon edges. How far infront it should go is dependent on how close a player can get to a wall. This totally removes glitches near walls 
- The points can be projected onto a virtual surface directly infront of the viewer. Using similar triangles you just divide by the local depth for a surface 1 unit infront.
- Finally the points are scaled to fit on the Pygame screen

# Issues
- low frame rate :( ...so it's not the most amazing user experience but at least the math is there.
- as mentioned: trinket has problems with handling relative mouse changes when the cursor is out of the trinket window

# Todo
I will be uploading documents that show more of the mathematical concepts used in the script. This includes:
 - [ ] Rotation matrix derivation (Linear algebra)
 - [x] Formula to prevent wall glitching (3D Trigonometry) see 'Fixing glitchy walls'
 - [ ] Linear interpolation for rectangles (Quick maths)
