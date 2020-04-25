import  React from 'react';
import './demo.css';
// import Polygon3D;
import {Polygon3D, Triangle3D, Rectangle3D} from './polygon.ts';

// Coordinates
  // World coordinates XYZ stay the same +Z is vertical height up so it is a RH system
  // Local coordinates xyz change with the direction the player is looking 
  // - y axis is the direction the player is looking straight ahead of them
  // - x axis is on the XY plane
  // - z axis is in the yZ plane
  // x and z fall on the planes mentioned so that xyz is a RH system

class DemoRoom extends React.Component {

  constructor(){
    super();
    
    this.state = {
      mounted: false,

      isTopPressed: false,
      isDownPressed: false,
      isRightPressed: false,
      isLeftPressed: false,
      moveX: 0,
      moveY: 0,

      pointerLocked: false, // todo set back to false when esc clicked ?
      
      polygons: [], // todo is json easier than from .txt ?
      // player states // todo maybe these states not needed. or in separate component
      // stand: [0, 0, 0.5], // initial eye position of the player in XYZ
      // t: 0, // angle in radians from positive X axis to positive x axis anticlockwise about positive Z
      // a: 0, // angle in radians from positive Z axis to positive z axis clockwise about positive x
    }
    this.nextTop = false;
    this.nextDown = false;
    this.nextRight = false;
    this.nextLeft = false;
    this.nextMoveX = 0;
    this.nextMoveY = 0;

    this.stand = [0, 0, 0.5];
    this.t = 0;
    this.a = 0;
    
    // Constants
    this.SCREEN_WIDTH = 700; // px note width in css has to change
    this.SCREEN_HEIGHT = 400; // px
    Polygon3D.HALF_VIEW_WIDTH = 1; // sx at Ys = 1
    Polygon3D.halfX = this.SCREEN_WIDTH / 2;
    Polygon3D.halfY = this.SCREEN_HEIGHT / 2;
    this.RADIUS = 30;
    this.PROX = 0.1; // how close you can get to a wall
    // hiddenY is the local y value that points behind the camera are interpolated to
    Polygon3D.setHiddenY(this.PROX, this.SCREEN_WIDTH, this.SCREEN_HEIGHT); // hiddenY = this.PROX * 0.577; // see 'Fixing glitchy walls.docx' for explanation
    // Colors
    this.WHITE = (255, 255, 255); // todo
    this.BLACK = (0, 0, 0);
    this.YELLOW = (255, 255, 0);
    this.GREEN = (0, 255, 50);
    this.CYAN = (0, 255, 255);
    this.MAGENTA = (255, 0, 255);
    // Sensitivity // todo should some of these constants be in Polygon3D?
    this.SENSE_THETA = 0.01;
    this.SENSE_ALPHA = 0.5*Math.PI / Polygon3D.halfY;
    this.SENSE_MOVE = 0.02;

    this.FRAME_PERIOD = 16; // 16ms is 62.5fps

    // this.polygons = [];
    

    this.canvas = null;
    // this.ctx = null;
    Polygon3D.ctx = null;
    this.tracker = null;
    this.animation = null;


    this.canvasClicked = this.canvasClicked.bind(this); // todo remove
    this.lockChangeAlert = this.lockChangeAlert.bind(this);

    this.mouseMove = this.mouseMove.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.keyUp = this.keyUp.bind(this);
  }

  fromRGBToStr(r,g,b) {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }

  setWorldPolygons(){
    // console.log('setWorldPolygons');
    fetch("/demo_room", {method: "POST",})
      .then(res => res.text())
      .then(text => {

        var polygonStrings = text.split('NEW ');
        polygonStrings.shift(); // removes first empty element

        var polygons = [];

        // for each NEW polygon
        for(var i = 0; i < polygonStrings.length; i++){
          var polyStr = polygonStrings[i];
          
          var polygonPoints = [];

          // fill the polygon data
          if(polyStr.substr(0,3) === 'REC'){ // if rectangle
            // console.log(polyStr);
            var recArr = polyStr.split('\n');
            recArr.shift(); // remove description
            recArr.pop(); // remove last empty line element
            // console.log("recArr = " + recArr);
            // console.log("recArr.length = " + recArr.length);
            var colorStr;
            for(var j = 0; j < recArr.length; j++){
              var recLine = recArr[j];
              var commaArr = recLine.split(',');
              if(j === 0){
                colorStr = this.fromRGBToStr(commaArr[0], commaArr[1], commaArr[2]);
                // console.log('colorStr = ' + colorStr);
              }
              else{
                polygonPoints.push(commaArr);
              }
            }
            polygons.push(new Rectangle3D(polygonPoints, colorStr));
          }
          else if(polyStr.substr(0,3) === 'TRI'){ // if triangle
            // console.log("TRI");
            var triArr = polyStr.split('\n');
            triArr.shift(); // remove description
            triArr.pop(); // remove last empty line element
            // console.log("triArr = " + triArr);
            // console.log("triArr.length = " + triArr.length);
            
            var triColorStr;
            for(var k = 0; k < triArr.length; k++){
              var triLine = triArr[k];
              var commaTri = triLine.split(',');
              if(j === 0){
                triColorStr = this.fromRGBToStr(commaTri[0], commaTri[1], commaTri[2]);
              }
              else{
                polygonPoints.push(commaTri);
              }
            }
            polygons.push(new Triangle3D(polygonPoints, triColorStr));
          }
        }

        this.setState({ polygons: polygons })
      });
    
  }

  componentDidMount(){
    // console.log("componentDidMount");
    
    this.setWorldPolygons();

    // todo some of this shit could be in mount
    this.canvas = document.querySelector('canvas');
    // this.ctx = this.canvas.getContext('2d');
    Polygon3D.ctx = this.canvas.getContext('2d');

    this.canvas.requestPointerLock = this.canvas.requestPointerLock ||
      this.canvas.mozRequestPointerLock;

    document.exitPointerLock = document.exitPointerLock ||
      document.mozExitPointerLock;

    // pointer lock event listeners

    // Hook pointer lock state change events for different browsers
    document.addEventListener('pointerlockchange', this.lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', this.lockChangeAlert, false);
    
    this.tracker = document.getElementById('tracker');

    this.setState({
      mounted: true,
    });
  }

  lockChangeAlert() {
    // console.log('lockChangeAlert');
    if (document.pointerLockElement === this.canvas ||
        document.mozPointerLockElement === this.canvas) {
      // console.log('The pointer lock status is now locked');
      document.getElementById("canvas").addEventListener("mousemove", this.mouseMove);
      document.addEventListener('keydown', this.keyDown);
      document.addEventListener('keyup', this.keyUp);

      this.interval = setInterval(() => this.updateFrame(), this.FRAME_PERIOD);

      this.setState({
        pointerLocked: true,
      });
      
    } else {
      // console.log('The pointer lock status is now unlocked');  
      document.getElementById("canvas").removeEventListener("mousemove", this.mouseMove);
      document.removeEventListener('keydown', this.keyDown);
      document.removeEventListener('keyup', this.keyUp);

      clearInterval(this.interval);

      this.setState({
        pointerLocked: false,
      });
    }
  }

  updateFrame(){
    // console.log('updateFrame');
    console.log('this.nextMoveX = ' + this.nextMoveX);
  	if (
    	this.nextTop ||
    	this.nextDown ||
    	this.nextRight ||
    	this.nextLeft ||
      this.nextMoveX !== 0 ||
      this.nextMoveY !== 0
    ){
      let updateFrameStr = ''; // todo remove
      if(this.nextTop){
        updateFrameStr += '^';
      }
      if(this.nextDown){
        updateFrameStr += 'v';
      }
      if(this.nextRight){
        updateFrameStr += '>';
      }
      if(this.nextLeft){
        updateFrameStr += '<';
      }
      console.log('updateFrameStr = ' + updateFrameStr);
      
      this.setState({
        isTopPressed: this.nextTop,
        isDownPressed: this.nextDown,
        isRightPressed: this.nextRight,
        isLeftPressed: this.nextLeft,
        
        moveX: this.nextMoveX,
        moveY: this.nextMoveY,
      });
    }
  }

  canvasClicked(){
    // console.log('canvasClicked');
    this.canvas.requestPointerLock();
  }

  keyDown(e){
    if(e.code === 'KeyW' || e.code === 'KeyS' || 
      e.code === 'KeyD' || e.code === 'KeyA')
    {
      
      if(e.code === 'KeyW'){
        this.nextTop = true;
        this.nextDown = false;
      }
      else if(e.code === 'KeyS'){
        this.nextTop = false;
        this.nextDown = true;
      }
      if(e.code === 'KeyD'){
        this.nextRight = true;
        this.nextLeft = false;
      }
      else if(e.code === 'KeyA'){
        this.nextRight = false;
        this.nextLeft = true;
      }
    }
  }

  keyUp(e){
    if(e.code === 'KeyW' || e.code === 'KeyS' || 
      e.code === 'KeyD' || e.code === 'KeyA')
    {
      
      if(e.code === 'KeyW'){
        this.nextTop = false;
      }
      else if(e.code === 'KeyS'){
      	this.nextDown = false;
      }
      if(e.code === 'KeyD'){
      	this.nextRight = false;
      }
      else if(e.code === 'KeyA'){
      	this.nextLeft = false;
      }
    }
  }

  // keyDown(e){
  //   if(e.code === 'KeyW' || e.code === 'KeyS' || 
  //     e.code === 'KeyD' || e.code === 'KeyA')
  //   {
      
  //     var x = this.state.stand[0];
  //     var y = this.state.stand[1];
  //     var z = this.state.stand[2];
  //     var t = this.state.t;

  //     console.log(e.code);
      
  //     if(e.code === 'KeyW'){
  //       x += -0.05 * Math.sin(t);
  //       y += 0.05 * Math.cos(t);
  //     }
  //     else if(e.code === 'KeyS'){
  //       x -= -0.05 * Math.sin(t);
  //       y -= 0.05 * Math.cos(t);
  //     }
  //     if(e.code === 'KeyD'){
  //       x += 0.05 * Math.cos(t);
  //       y += 0.05 * Math.sin(t);
  //     }
  //     else if(e.code === 'KeyA'){
  //       x -= 0.05 * Math.cos(t);
  //       y -= 0.05 * Math.sin(t);
  //     }
  //     // boundaries
  //     if (x < -1 + this.PROX)
  //       x = -1 + this.PROX;
  //     else if (x > 1 - this.PROX)
  //       x = 1 - this.PROX;
  //     if (y < -2 + this.PROX)
  //       y = -2 + this.PROX;
  //     else if (y > 2 - this.PROX)
  //       y = 2 - this.PROX;

  //     this.setState({
  //       stand: [x, y, z]
  //     });
  //   }
  // }

  mouseMove(e){
  	this.nextMoveX = e.movementX;
  	this.nextMoveY = e.movementY;
  }

  // mouseMove(e) {
  //   console.log('mouseMove');
  //   if(this.state.pointerLocked){ // todo remove this state and instead bind mouse move only
      
  //     var newT = this.state.t  -  e.movementX * this.SENSE_THETA;
  //     var newA = this.state.a  +  e.movementY * this.SENSE_ALPHA;

  //     if (newA > 0.5*Math.PI)
  //       newA = 0.5*Math.PI
  //     else if (newA < -0.5*Math.PI)
  //       newA = -0.5*Math.PI

  //     // console.log('newT = ' + newT + ', newA = ' + newA);
  //     this.setState({
  //       t: newT,
  //       a: newA,
  //     });
      

  //   }
    
  // }

  

  // derrived from the placement of the local unit vectors depending on t and a
  // see ‘Rotation matix.docx’ for explanation
  updateRotationMatrix(t, a){
    return [
      [Math.cos(t), Math.sin(t), 0],
      [-Math.cos(a)*Math.sin(t), Math.cos(a)*Math.cos(t), -Math.sin(a)], 
      [-Math.sin(a)*Math.sin(t), Math.sin(a)*Math.cos(t), Math.cos(a)]
    ];
  }

  // matrix multiplication of a 3x3 matrix with a 3x1 vector to return a 3x1 vector (i.e. an array length 3)
  mmult(matrix, vector){
    // console.log("mmult");
    // console.log(" matrix = " + matrix);
    // console.log(" vector = " + vector);
    return [
      matrix[0][0]*vector[0] + matrix[0][1]*vector[1] + matrix[0][2]*vector[2],
      matrix[1][0]*vector[0] + matrix[1][1]*vector[1] + matrix[1][2]*vector[2],
      matrix[2][0]*vector[0] + matrix[2][1]*vector[1] + matrix[2][2]*vector[2]
    ];
  }

  render(){
    if(this.state.mounted){ // todo and locked
      console.log('render mounted');
      
      // todo fill background does this even matter
      Polygon3D.ctx.fillStyle = "black";
      Polygon3D.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // mouse
      this.t  -=  this.state.moveX * this.SENSE_THETA;
      this.a  +=  this.state.moveY * this.SENSE_ALPHA;
      if (this.a > 0.5*Math.PI)
        this.a = 0.5*Math.PI
      else if (this.a < -0.5*Math.PI)
        this.a = -0.5*Math.PI
      Polygon3D.rotationMatrix = this.updateRotationMatrix(
        this.t,
        this.a
      );

      // keys
      var x = this.stand[0];
      var y = this.stand[1];
      var z = this.stand[2];
      var t = this.t;
      
      if(this.state.isTopPressed){ // todo is this fair movement???
        x += -this.SENSE_MOVE * Math.sin(t);
        y += this.SENSE_MOVE * Math.cos(t);
      }
      else if(this.state.isDownPressed){
        x -= -this.SENSE_MOVE * Math.sin(t);
        y -= this.SENSE_MOVE * Math.cos(t);
      }
      if(this.state.isRightPressed){
        x += this.SENSE_MOVE * Math.cos(t);
        y += this.SENSE_MOVE * Math.sin(t);
      }
      else if(this.state.isLeftPressed){
        x -= this.SENSE_MOVE * Math.cos(t);
        y -= this.SENSE_MOVE * Math.sin(t);
      }
      // boundaries
      if (x < -1 + this.PROX)
        x = -1 + this.PROX;
      else if (x > 1 - this.PROX)
        x = 1 - this.PROX;
      if (y < -2 + this.PROX)
        y = -2 + this.PROX;
      else if (y > 2 - this.PROX)
        y = 2 - this.PROX;
      // setting for next render
      this.stand = [x, y, z];
      Polygon3D.stand = this.stand;
      
      // draw all polygons
      for(var polyIndex = 0; polyIndex < this.state.polygons.length; polyIndex++){
        this.state.polygons[polyIndex].draw();
      }
      
    }
    
    return (<div className='main' width={this.SCREEN_WIDTH}>
      <div>
        <h1>Pointer lock demo</h1>

        <p>This demo demonstrates usage of the pointer lock API. 
          Click on the canvas area and your mouse will directly control 
          the ball inside the canvas, not your mouse pointer. 
          You can press escape to return to the standard expected state.
        </p>
      </div>

      <canvas id="canvas" onClick={(e) => this.canvasClicked(e)} onMouseMove={this.mouseMove} width={this.SCREEN_WIDTH} height={this.SCREEN_HEIGHT}>
        Your browser does not support HTML5 canvas
      </canvas>
      
      <div id="tracker"></div>
    </div>);
  }

  componentDidUpdate(prevProps, prevState) {
    this.nextMoveX = 0;
    this.nextMoveY = 0;
  }
  
}

export default DemoRoom;