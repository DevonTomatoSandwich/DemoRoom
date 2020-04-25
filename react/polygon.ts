// Polygon 3D is an abstract base class
export abstract class Polygon3D {

  // todo access modifiers
  points: number[][];
  color: string;

  static stand: number[];
  static rotationMatrix: number[][];
  static hiddenY: number;
  static halfX: number;
  static halfY: number;
  static HALF_VIEW_WIDTH: number;
  static ctx: CanvasRenderingContext2D;

  constructor(points: number[][], color: string) {
    this.points = points; // real world coordinates
    this.color = color;
  }

  // returns the interpolated point on the line P1 P2 where y coordinate is y
  // assumes y coordinates are different for P1 and P2
  interpolateUsingY(P1: number[], P2: number[], y: number){
    var dyFactor = 1 / (P2[1] - P1[1]);
    
    var mXY = (P2[0] - P1[0]) * dyFactor;
    var x = P1[0] + mXY * (y - P1[1]);
    
    var mZY = (P2[2] - P1[2]) * dyFactor;
    var z = P1[2] + mZY * (y - P1[1]);
    
    return [x, y, z];
  }
  
  // matrix multiplication of a 3x3 matrix with a 3x1 vector to return a 3x1 vector
  mmult(matrix: number[][], vector: number[]){
    // console.log("matrix = " + matrix);
    // console.log("vector = " + vector);
    return [
      matrix[0][0]*vector[0] + matrix[0][1]*vector[1] + matrix[0][2]*vector[2],
      matrix[1][0]*vector[0] + matrix[1][1]*vector[1] + matrix[1][2]*vector[2],
      matrix[2][0]*vector[0] + matrix[2][1]*vector[1] + matrix[2][2]*vector[2]
    ];
  }

  // e is proximity, W and S are canvas dims, 
  static setHiddenY(e: number, W: number, H: number){
    let r = W / H; // aspect ratio
    let Sx = Polygon3D.HALF_VIEW_WIDTH;

    let limit = e / Math.sqrt(Sx*Sx + Sx*Sx/(r*r) + 1);
    console.log('limit = ' + limit);
    
    Polygon3D.hiddenY = Math.floor(limit*1000)/1000; // now round down to 3dp
    console.log('Polygon3D.hiddenY = ' + Polygon3D.hiddenY);
  }
  
  abstract draw(): void;

}


// Implementation of Polygon3D which takes 4 points in 3D in either clockwise or anticlockwise order
export class Rectangle3D extends Polygon3D{

  tri1: Triangle3D;
  tri2: Triangle3D;

  constructor(points: number[][], color: string) {
    super(points, color);

    this.tri1 = new Triangle3D([
      points[0],
      points[1],
      points[3]
    ], color);

    this.tri2 = new Triangle3D([
      points[1],
      points[2],
      points[3]
    ], color)
  }

  draw(){
    this.tri1.draw();
    this.tri2.draw();
  }
}


// Implementation of Polygon3D which takes 3 points in 3D
export class Triangle3D extends Polygon3D {

  draw(){
    // console.log("Triangle3D draw");
    // console.log("this.points.length = " + this.points.length);
    var rotatedPoints = [];

    // console.log("this.points = " + this.points);
    for(var i = 0; i < this.points.length; i++){
      // console.log("for point at index i = " + i);
      var worldPoint = this.points[i];
      var translatedPoint = [
        worldPoint[0] - Polygon3D.stand[0],
        worldPoint[1] - Polygon3D.stand[1],
        worldPoint[2] - Polygon3D.stand[2]
      ];
      // console.log("translatedPoint = " + translatedPoint);
      // translatedPoint
      rotatedPoints.push( this.mmult(Polygon3D.rotationMatrix, translatedPoint) )
    }
    // console.log("bottomLeft = " + rotatedPoints[2]);
    // todo translate point
      
    
    // interpolate any points behind y <= 0
    var behindCameraCount = 0;
    var interpolatedPoints = [];
    for(var index = 0; index < rotatedPoints.length; index++){
      var p = rotatedPoints[index];
      // console.log('p = ' + p);
      // console.log('p[1] <= 0 = ' + (p[1] <= 0));
      if(p[1] <= 0)
        behindCameraCount += 1
    }
    // console.log("behindCameraCount = " + behindCameraCount);
        // todo === not ==
    if (behindCameraCount === 0){
      interpolatedPoints = rotatedPoints;
    }
    else if (behindCameraCount === 1){
      let P1: number[] = [];
      let P2: number[] = [];
      let P3: number[] = [];
      // for(let p of rotatedPoints){
      for(index = 0; index < rotatedPoints.length; index++){
        p = rotatedPoints[index];
        if (p[1] <= 0){
          P1 = p;
        }
        else{
          if (P2.length === 0){
            P2 = p;
          } // todo ternary
          else{
            P3 = p;
          }
        }
      }
      
      var I2 = this.interpolateUsingY(P1, P2, Polygon3D.hiddenY);
      var I3 = this.interpolateUsingY(P1, P3, Polygon3D.hiddenY);
      interpolatedPoints = [I2, P2, P3, I3];
    }
    else if (behindCameraCount === 2){
      let P1: number[] = [];
      let P2: number[] = [];
      let P3: number[] = [];
      for(var indexRot = 0; indexRot < rotatedPoints.length; indexRot++){
        let p = rotatedPoints[indexRot];
        // console.log("rotatedPoints[" + indexRot + "] = " + p);
        if (p[1] > 0){
          // console.log("p[1] > 0 for p = " + p);
          P1 = p;
        }
        else{
          if (P2.length === 0){
            P2 = p;
          }
          else{
            P3 = p;
          }
        }
      }
      // console.log("P1 = " + P1); // > 0
      // console.log("P2 = " + P2);
      // console.log("P3 = " + P3);
      let I2 = this.interpolateUsingY(P1, P2, Polygon3D.hiddenY);
      let I3 = this.interpolateUsingY(P1, P3, Polygon3D.hiddenY);
      // console.log("I2 = " + I2);
      // console.log("I3 = " + I3);
      interpolatedPoints = [I2, P1, I3];
    }
    else{
      return; // todo will this return ??
    }

    // alter perspective and scale to canvas
    let canvasPoints: number[][] = [];
    for(var x = 0; x < interpolatedPoints.length; x++){
      
      // console.log("something");
      // console.log("x = " + x);
      var pI = interpolatedPoints[x];
      // console.log("p = " + p);
      var factor = 1/pI[1]; // this is where Ys = 1 is used
      var perspectivePoint = [pI[0] * factor, pI[2] * factor];
      var canvasPoint = [
        Polygon3D.halfX + perspectivePoint[0] * (Polygon3D.halfX/Polygon3D.HALF_VIEW_WIDTH), 
        Polygon3D.halfY - perspectivePoint[1] * (Polygon3D.halfX/Polygon3D.HALF_VIEW_WIDTH)
      ];
      // console.log("canvasPoint = " + canvasPoint);
      canvasPoints.push(canvasPoint);

    }

    Polygon3D.ctx.fillStyle = this.color;
    Polygon3D.ctx.strokeStyle = this.color;
    // for first point
    Polygon3D.ctx.beginPath();
    Polygon3D.ctx.moveTo(canvasPoints[0][0], canvasPoints[0][1]);
    for(i = 1; i < canvasPoints.length; i++){
      Polygon3D.ctx.lineTo(canvasPoints[i][0], canvasPoints[i][1]);
    }
    Polygon3D.ctx.closePath();
    Polygon3D.ctx.fill();
    Polygon3D.ctx.stroke();
  }
}

// export Polygon3D;