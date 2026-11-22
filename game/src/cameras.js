// cameras.js — sweeping security cameras. One job: sweep the camera's cone
// back and forth and report whether it can see the thief right now.

import { CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE } from './config.js';
import { coneSees } from './vision.js';

export function cameraWatcher(camera) {
  return {
    x: camera.x,
    y: camera.y,
    angle: camera.angle,
    range: CAMERA_CONE_RANGE,
    halfAngle: CAMERA_CONE_HALF_ANGLE,
  };
}

export function cameraSeesPlayer(camera, player, blockers, time) {
  if (time < camera.disabledUntil) return false;
  return coneSees(cameraWatcher(camera), player.x, player.y, blockers);
}

// Sinusoidal sweep around the base angle; EMP sets disabledUntil in the future.
export function updateCamera(camera, time) {
  const phase = (time + camera.phase) * ((Math.PI * 2) / camera.period);
  camera.angle = camera.baseAngle + Math.sin(phase) * camera.amp;
}

export function cameraIsDisabled(camera, time) {
  return time < camera.disabledUntil;
}
