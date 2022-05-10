//import path from 'path';
import { FBXLoader } from '../vendors/FBXLoader.js';
import * as THREE from '../vendors/three.module.js';
import {math} from './math.js';

//export const obstacle = (function() { 
    
const model_obstacle = new Promise((res, rej) => {
  const loader = new FBXLoader();
    
  let rand = math._randomInt(0,6);
  let pathStr ='';
  switch(rand){
    case 0:
        pathStr= 'resources/car_pack/FBX/NormalCar1.fbx';
        break;
    case 1:
        pathStr= 'resources/car_pack/FBX/NormalCar2.fbx';
        break;
    case 2:
        pathStr ='resources/car_pack/FBX/SportsCar2.fbx';
        break;
    case 3:
        pathStr='resources/car_pack/FBX/SUV.fbx';
        break;
    case 4:
        pathStr='resources/car_pack/FBX/Taxi.fbx';
        break;
    case 5:
        pathStr='resources/car_pack/FBX/Cop.fbx';
        break;
    default:
        pathStr='resources/car_pack/FBX/NormalCar1.fbx';
        break;
  }
  //console.log(rand);
  loader.load(pathStr, function (fbx) {

    fbx.scale.setScalar(0.005);


    fbx.quaternion.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0), -90*(Math.PI/180));

  fbx.traverse(c => {
    let materials = c.material;
    if (!(c.material instanceof Array)) {
      materials = [c.material];
    }

    for (let m of materials) {
      if (m) {
        m.specular = new THREE.Color(0x000000);
        m.color.offsetHSL(0, 0.25, 0);
      }
    }    
    c.castShadow = true;
    c.receiveShadow = true;
  });
  res(fbx);
    
  });
})
//return model_obstacle;
export default model_obstacle;
//})