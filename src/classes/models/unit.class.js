import { DIRECTION } from '../../constants/assets.js';
import { getPath } from '../../utils/assets/getAssets.js';

class Unit {
  constructor(unitId, unitData, toTop, spawnTime) {
    // ID 및 종족 관련
    this.unitId = unitId;
    this.species = unitData.species;

    // 능력치 관련
    this.maxHp = unitData.maxHp;
    this.hp = unitData.maxHp;
    this.attackPower = unitData.atk;
    this.def = unitData.def;
    this.speed = unitData.spd;
    this.cooldown = unitData.cd;

    // 코스트 관련
    this.cost = unitData.cost;

    // 이동 관련
    this.path = getPath(this.species, toTop ? DIRECTION.UP : DIRECTION.DOWN);
    this.position = this.path[0];
    this.destinationIndex = 1;
    this.moving = true;
    this.startedMovingAt = spawnTime;
    this.stoppedMovingAt = null;
  }

  getUnitId() {
    return this.unitId;
  }

  getHp() {
    return this.hp;
  }

  getAttackPower() {
    return this.attackPower;
  }

  getPosition() {
    return this.position;
  }

  getDestination() {
    return this.path[this.destinationIndex];
  }

  halt(timestamp) {
    if (this.moving) {
      this.stoppedMovingAt = timestamp;
    }
    this.moving = false;
  }

  // 체력 감소 메서드
  applyDamage(damage) {
    this.hp = Math.max(0, this.hp - damage); // 체력은 0 이하로 감소하지 않음
    return this.hp;
  }

  // 사망 여부 확인 메서드
  isDead() {
    return this.hp <= 0;
  }
}

export default Unit;
