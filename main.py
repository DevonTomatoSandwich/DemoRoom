import pygame
from math import pi, cos, sin
from abc import ABC, abstractmethod

pygame.init()

# screen
X = 600  # width
Y = 600  # height
halfX = X/2
halfY = Y/2
screen = pygame.display.set_mode((X, Y), pygame.FULLSCREEN)
clock = pygame.time.Clock()
pygame.mouse.set_visible(False)
pygame.event.set_grab(True) # for getting relative mouse position when outside the screen
prox = 0.1 # how close you can get to a wall
# this is the local y value that points behind the camera are interpolated to
gamma = prox * 0.577 # see 'Fixing glitchy walls.docx' for explanation

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
YELLOW = (255, 255, 0)
GREEN = (0, 255, 50)
CYAN = (0, 255, 255)
MAGENTA = (255, 0, 255)

# sensitivity
senseTheta = 0.01
senseAlpha = 0.5*pi / halfY
relMouseCap = 10  # limit to how fast you can change direction. Needed as trinket and repl are glitchy

# Coordinates
# World coordinates XYZ stay the same +Z is vertical height up so it is a RH system
# Local coordinates xyz change with the direction the player is looking 
# - y axis is the direction the player is looking straight ahead of them
# - x axis is on the XY plane
# - z axis is in the yZ plane
# x and z fall on the planes mentioned so that xyz is a RH system

# player
stand = [0,0,0.5] # initial eye position of the player in XYZ
t = 0 # angle in radians from positive X axis to positive x axis anticlockwise about positive Z
a = 0 # angle in radians from positive Z axis to positive z axis clockwise about positive x
# derrived from the placement of the local unit vectors depending on t and a
# see ‘Rotation matix.docx’ for explanation
def updateRotationMatrix(t, a):
  return [
    [cos(t), sin(t), 0],
    [-cos(a)*sin(t), cos(a)*cos(t), -sin(a)], 
    [-sin(a)*sin(t), sin(a)*cos(t), cos(a)]
  ]
rotationMatrix = updateRotationMatrix(t, a)

# Polygon 3D is an abstract base class
class Polygon3D(ABC):
  
  def __init__(self, points, color):
    self.points = points # real world coordinates
    self.color = color
    
  # returns the interpolated point on the line q1 q2 where y coordinate is gamma
  # assumes y coordinates are different for q1 and q2
  def interpolateUsingY(self, q1, q2):
    dyFactor = 1 / (q2[1] - q1[1])
    
    mXY = (q2[0] - q1[0]) * dyFactor
    ix = q1[0] + mXY * (gamma - q1[1])
    
    mZY = (q2[2] - q1[2]) * dyFactor
    iz = q1[2] + mZY * (gamma - q1[1])
    
    return [ix, gamma, iz]
  
  # matrix multiplication of a 3x3 matrix with a 3x1 vector to return a 3x1 vector
  def mmult(self, matrix, vector):
    return [
      matrix[0][0]*vector[0] + matrix[0][1]*vector[1] + matrix[0][2]*vector[2],
      matrix[1][0]*vector[0] + matrix[1][1]*vector[1] + matrix[1][2]*vector[2],
      matrix[2][0]*vector[0] + matrix[2][1]*vector[1] + matrix[2][2]*vector[2]
    ]
    
  @abstractmethod
  def draw(self):
    pass
  
# Implementation of Polygon3D which takes 4 points in 3D in either clockwise or anticlockwise order
class Rectangle3D(Polygon3D):
  
  def __init__(self, points, color):
    super().__init__(points, color)
    
    self.t1 = Triangle3D([
      points[0],
      points[1],
      points[3]
    ], color)
    
    self.t2 = Triangle3D([
      points[1],
      points[2],
      points[3]
    ], color)
  
  # draws two triangles that makeup the rectangle
  def draw(self):
    self.t1.draw()
    self.t2.draw()

# Implementation of Polygon3D which takes 3 points in 3D
class Triangle3D(Polygon3D):
    
  def draw(self):

    rotatedPoints = []
    for p in self.points:
      translatedPoint = [
        p[0] - stand[0],
        p[1] - stand[1],
        p[2] - stand[2]
      ]
      rotatedPoints.append( self.mmult(rotationMatrix, translatedPoint) )
    
    # interpolate any points behind y <= 0
    behindCameraCount = 0
    interpolatedPoints = []
    for p in rotatedPoints:
      if p[1] <= 0:
        behindCameraCount += 1
    if behindCameraCount == 0:
      interpolatedPoints = rotatedPoints
    elif behindCameraCount == 1:
      P1 = []
      P2 = []
      P3 = []
      for p in rotatedPoints:
        if p[1] <= 0:
          P1 = p
        else:
          if len(P2) == 0:
            P2 = p
          else:
            P3 = p
      I2 = self.interpolateUsingY(P1, P2)
      I3 = self.interpolateUsingY(P1, P3)
      interpolatedPoints = [I2, P2, P3, I3]
    elif behindCameraCount == 2:
      P1 = []
      P2 = []
      P3 = []
      for p in rotatedPoints:
        if p[1] > 0:
          P1 = p
        else:
          if len(P2) == 0:
            P2 = p
          else:
            P3 = p
      I2 = self.interpolateUsingY(P1, P2)
      I3 = self.interpolateUsingY(P1, P3)
      interpolatedPoints = [I2, P1, I3]
    else:
      return
    
    # alter perspective and scale to canvas
    canvasPoints = []
    for p in interpolatedPoints:
      factor = 1/p[1]
      perspectivePoint = [p[0] * factor, p[2] * factor]
      canvasPoint = [halfX*(1 + perspectivePoint[0]), halfY*(1-perspectivePoint[1])]
      canvasPoints.append(canvasPoint)
    
    pygame.draw.polygon(
      screen, 
      self.color, 
      canvasPoints
    )
    
allPolys = []

# Wall front
allPolys.append(Rectangle3D([
  [-1,2,1],
  [1 ,2,1],
  [1 ,2,0],
  [-1,2,0]
], CYAN))

# Wall left
allPolys.append(Rectangle3D([
  [-1,-2,1],
  [-1, 2,1],
  [-1, 2,0],
  [-1,-2,0]
], MAGENTA))

# Wall right
allPolys.append(Rectangle3D([
  [ 1, 2,1],
  [ 1,-2,1],
  [ 1,-2,0],
  [ 1, 2,0]
], GREEN))
  
# Wall back
allPolys.append(Rectangle3D([
  [ 1,-2,1],
  [-1,-2,1],
  [-1,-2,0],
  [ 1,-2,0]
], YELLOW))

# floor
allPolys.append(Rectangle3D([
  [-1, 2,0],
  [ 1, 2,0],
  [ 1,-2,0],
  [-1,-2,0]
], BLACK))

# draws a white cross in the screen center for when shooting is implemented :)
def drawSight(): 
  p = [halfX, halfY]
  d = 10
  
  pygame.draw.line(screen, WHITE, (p[0]-d,p[1]-d), (p[0]+d,p[1]+d), 2)
  pygame.draw.line(screen, WHITE, (p[0]+d,p[1]-d), (p[0]-d,p[1]+d), 2)

  pygame.draw.line(screen, WHITE, (p[0]-d,p[1]-d), (p[0]+d,p[1]-d), 2)
  pygame.draw.line(screen, WHITE, (p[0]-d,p[1]-d), (p[0]-d,p[1]+d), 2)
  pygame.draw.line(screen, WHITE, (p[0]-d,p[1]+d), (p[0]+d,p[1]+d), 2)
  pygame.draw.line(screen, WHITE, (p[0]+d,p[1]+d), (p[0]+d,p[1]-d), 2)

running = True
while running:
  
  # move position
  pygame.event.pump()
  keys=pygame.key.get_pressed()
  if keys[pygame.K_w]:
    stand[0] += -0.05*sin(t)
    stand[1] += 0.05*cos(t)
  elif keys[pygame.K_s]:
    stand[0] -= -0.05*sin(t)
    stand[1] -= 0.05*cos(t)
  if keys[pygame.K_d]:
    stand[0] += 0.05*cos(t)
    stand[1] += 0.05*sin(t)
  elif keys[pygame.K_a]:
    stand[0] -= 0.05*cos(t)
    stand[1] -= 0.05*sin(t)
  # boundaries
  if stand[0] < -1 + prox:
    stand[0] = -1 + prox
  elif stand[0] > 1 - prox:
    stand[0] = 1 - prox
  if stand[1] < -2 + prox:
    stand[1] = -2 + prox
  elif stand[1] > 2 - prox:
    stand[1] = 2 - prox
  
  for event in pygame.event.get():
            
    if event.type == pygame.MOUSEMOTION:
      mouseMove = [event.rel[0], event.rel[1]]
      
      if mouseMove[0] < -relMouseCap:
        mouseMove[0] = -relMouseCap
      elif mouseMove[0] > relMouseCap:
        mouseMove[0] = relMouseCap
      if mouseMove[1] < -relMouseCap:
        mouseMove[1] = -relMouseCap
      elif mouseMove[1] > relMouseCap:
        mouseMove[1] = relMouseCap
        
      t -= mouseMove[0] * senseTheta
      a += mouseMove[1] * senseAlpha
      if a > 0.5*pi:
        a = 0.5*pi
      elif a < -0.5*pi:
        a = -0.5*pi
      rotationMatrix = updateRotationMatrix(t, a)
      
    if event.type == pygame.KEYDOWN:
      if event.key == pygame.K_ESCAPE:
        running = False
        break
    
  screen.fill(WHITE)
  
  for poly in allPolys:
    poly.draw()
  drawSight()
  
  pygame.display.flip()
  clock.tick(40)
  
pygame.quit()
