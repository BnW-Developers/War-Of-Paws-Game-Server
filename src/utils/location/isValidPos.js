import isOnWrongSide from './isOnWrongSide.js';
import isOutOfBounds from './isOutOfBounds.js';
import isTooFast from './isTooFast.js';
import formatCoords from '../formatter/formatCoords.js';
import { LOG_ENABLED_WRONG_SIDE } from '../log/logSwitch.js';

/**
 * 클라이언트가 보낸 유닛의 위치값이 정상인지 여부를 판단
 * @param {Unit} unit 유닛
 * @param {{x: float, z: float}} pos 움직이려는 위치
 * @param {int64} timestamp 도착시간
 * @return boolean
 */
const isValidPos = (unit, pos, timestamp) => {
  // 맵 경계를 벗어났는지 확인
  if (isOutOfBounds(pos)) {
    return false;
  }

  // 잘못된 공격로 (반대편)에 있는지 확인
  if (isOnWrongSide(unit, pos)) {
    if (LOG_ENABLED_WRONG_SIDE) console.log('지정된 공격로 이탈:', formatCoords(pos, 2));
    return false;
  }

  // 해당 유닛의 이동속도보다 빠르게 움직였는지 확인
  if (isTooFast(unit, pos, timestamp)) {
    return false;
  }

  // 정상적인 위치임
  return true;
};

export default isValidPos;
