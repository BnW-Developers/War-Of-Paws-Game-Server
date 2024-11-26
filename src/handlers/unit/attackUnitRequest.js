import { PACKET_TYPE } from '../../constants/header.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const attackUnitRequest = (socket, payload) => {
  try {
    const { unitId, timestamp, opponentUnitIds } = payload; // 여러 대상 유닛 처리

    logger.info(`attack unit request id: ${unitId} to ${opponentUnitIds} time: ${timestamp}`);
    const { userGameData, opponentGameData, opponentSocket } = checkSessionInfo(socket);

    // 공격 유닛 가져오기
    const attackUnit = userGameData.getUnit(unitId);

    let damage = attackUnit.getAttackPower();
    // 결과 저장용 배열
    const opponentUnitInfos = [];
    const deathNotifications = [];

    // 공격 쿨타임 검증
    if (!attackUnit.isAttackAvailable()) {
      damage = 0;
    } else {
      // 대상 유닛 처리
      for (const opponentUnitId of opponentUnitIds) {
        const targetUnit = opponentGameData.getUnit(opponentUnitId);

        // 데미지 적용
        const resultHp = targetUnit.applyDamage(damage);

        if (targetUnit.isDead()) {
          opponentGameData.removeUnit(opponentUnitId); // 유닛 제거
          deathNotifications.push(opponentUnitId); // 사망 알림 추가
        }

        // 공격당한 유닛 정보 추가
        opponentUnitInfos.push({
          unitId: opponentUnitId,
          unitHp: resultHp, // HP는 음수가 될 수 없도록 처리
        });
      }
    }

    // 공격 알림
    sendPacket(socket, PACKET_TYPE.ATTACK_UNIT_RESPONSE, {
      unitInfos: opponentUnitInfos,
    });

    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_ATTACK_NOTIFICATION, {
      unitInfos: opponentUnitInfos,
    });

    // 사망한 유닛이 있다면, A, B 클라이언트에게 사망 알림
    if (deathNotifications.length > 0) {
      sendPacket(socket, PACKET_TYPE.UNIT_DEATH_NOTIFICATION, {
        unitIds: deathNotifications,
      });

      sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_DEATH_NOTIFICATION, {
        unitIds: deathNotifications,
      });
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default attackUnitRequest;
