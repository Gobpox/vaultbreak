// alarm.js — the alarm meter. One job: rise while the thief is seen, fall
// while hidden, and decide when the run is caught. A caught moment is fair:
// the meter flashes a SPOTTED warning long before it fills.

import { ALARM_RISE_GUARD, ALARM_RISE_CAMERA, ALARM_RISE_LASER, ALARM_FALL, ALARM_SPOTTED_AT, ALARM_CAUGHT_AT } from './config.js';

export function createAlarm() {
  return { value: 0, spotted: false, caught: false, seenByGuard: false, seenByCamera: false, inLaser: false };
}

export function updateAlarm(alarm, dt, seen) {
  alarm.seenByGuard = seen.guard;
  alarm.seenByCamera = seen.camera;
  alarm.inLaser = seen.laser;
  let rise = 0;
  if (seen.guard) rise += ALARM_RISE_GUARD * (seen.halfRate ? 0.5 : 1);
  if (seen.camera) rise += ALARM_RISE_CAMERA * (seen.halfRate ? 0.5 : 1);
  if (seen.laser) rise += ALARM_RISE_LASER;
  if (rise > 0) {
    alarm.value = Math.min(ALARM_CAUGHT_AT, alarm.value + rise * dt);
  } else {
    alarm.value = Math.max(0, alarm.value - ALARM_FALL * dt);
  }
  alarm.spotted = alarm.value >= ALARM_SPOTTED_AT;
  if (alarm.value >= ALARM_CAUGHT_AT) alarm.caught = true;
  return alarm;
}

export function alarmColor(value) {
  if (value >= ALARM_SPOTTED_AT) return '#ff4d4d';
  if (value >= 30) return '#ffb02e';
  return '#37d67a';
}

export function alarmLabel(value) {
  if (value >= ALARM_CAUGHT_AT) return 'CAUGHT!';
  if (value >= ALARM_SPOTTED_AT) return 'SPOTTED!';
  if (value >= 30) return 'SUSPICIOUS';
  return 'UNSEEN';
}
