import Timer from '../utils/Timer.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import { handleErr } from '../../utils/error/handlerErr.js';

class CheckPoint {
  #users;
  #status;
  currentStatus;

  constructor(playerA, playerB, isTop) {
    this.isTop = isTop; // top 여부
    this.name = this.isTop ? 'top' : 'bottom'; // 콘솔 임시용
    this.playerA = playerA; // 플레이어 A 객체
    this.playerB = playerB; // 플레이어 B 객체
    this.#users = [[], []]; // 0: 팀 0, 1: 팀 1
    this.#status = 'waiting';
    this.currentStatus = this.#status; // 점령 초기화 시 상태 원복을 위한 변수
    this.timer = new Timer(5000, this.completeOccupation.bind(this)); // 5초 타이머, 콜백함수: 점령완료
  }

  // 유닛 추가/제거
  modifyUnit(team, unit, action) {
    const array = this.#users[team];

    switch (action) {
      case 'add':
        array.push(unit);
        this.checkStatus(team); // 상태 확인 (waiting, occupied(0,1), attempting(0,1))
        break;
      case 'remove':
        array.splice(array.indexOf(unit), 1);
        this.checkStatus(team);
        break;
      default:
        break;
    }
  }

  checkStatus(team) {
    const myUnits = this.getUsersCount(team); // 내 유닛 수
    const opponentUnits = this.getUsersCount(1 - team); // 상대 유닛 수
    const timerStatus = this.timer.status; // 타이머 상태

    /*
    상태에 따른 행동
    waiting - 내 유닛이 있으면 점령 시도 (동시에 적팀도 들어갈 확률은 없음, 패킷도착순)
    occupied(0,1) - 점령 상태 기준에서 상대방 유닛만 있을 경우 점령시도
    attempting(0,1) - 점령 시도 중 상대방 유닛이 들어올 경우 일시정지

    handleAttempt 함수에서 상태에 따른 행동 처리
    */
    const actions = {
      waiting: () => {
        if (myUnits) this.attemptedOccupation(team);
      },
      [`occupied${team}`]: () => {
        if (!myUnits && opponentUnits) this.attemptedOccupation(1 - team);
      },
      [`occupied${1 - team}`]: () => {
        if (myUnits && !opponentUnits) this.attemptedOccupation(team);
      },
      [`attempting${team}`]: () => {
        this.handleAttempt(opponentUnits, myUnits, timerStatus);
      },
      [`attempting${1 - team}`]: () => {
        this.handleAttempt(myUnits, opponentUnits, timerStatus);
      },
    };

    const action = actions[this.#status];
    if (action) action();
  }

  handleAttempt(opponentUnits, myUnits, timerStatus) {
    if (opponentUnits && timerStatus) {
      this.pauseOccupation();
    } else if (!opponentUnits && !timerStatus) {
      this.resumeOccupation();
    } else if (!myUnits) {
      this.clearOccupation();
    }
  }

  getUsersCount(team) {
    return this.#users[team].length;
  }

  attemptedOccupation(team) {
    this.#status = `attempting${team}`;
    console.log(`${team} 팀 ${this.name}점령시도중 현재 상태: ${this.#status}`);
    this.timer.start();

    // 점령 시도 패킷 전송
    this.sendOccupationPacket(PACKET_TYPE.TRY_OCCUPATION_NOTIFICATION, false, team.toString());
  }

  clearOccupation() {
    this.#status = this.currentStatus;
    console.log(`${this.name}점령초기화 현재 상태: ${this.#status}`);
    this.timer.allClear();

    // 점령 타이머 초기화 패킷 전송
    this.sendOccupationPacket(PACKET_TYPE.OCCUPATION_TIMER_RESET_NOTIFICATION, true);

    // 초기화 이후 상태 갱신
    const team0Units = this.getUsersCount(0); // 팀 0의 유닛 수
    const team1Units = this.getUsersCount(1); // 팀 1의 유닛 수

    // 유닛 상태에 따라 점령 재시도 확인
    if (team0Units || team1Units) {
      this.checkStatus(team0Units > team1Units ? 0 : 1);
    }
  }

  pauseOccupation() {
    console.log(`${this.name}점령일시정지 현재 상태: ${this.#status}`);
    this.timer.pause();

    // 점령 일시정지 패킷 전송
    this.sendOccupationPacket(PACKET_TYPE.PAUSE_OCCUPATION_NOTIFICATION, true);
  }

  resumeOccupation() {
    console.log(`${this.name}점령재개 현재 상태: ${this.#status}`);
    this.timer.resume();

    // 점령 재개 패킷 전송
    const attemptingTeam = this.#status.replace('attempting', ''); // attempting0 -> 0
    this.sendOccupationPacket(PACKET_TYPE.TRY_OCCUPATION_NOTIFICATION, false, attemptingTeam);
  }

  completeOccupation() {
    const completeTeam = this.#status.replace('attempting', '');
    this.#status = `occupied${this.#status.replace('attempting', '')}`;
    console.log(`${this.name}점령완료 현재 상태: ${this.#status}`);
    this.currentStatus = this.#status;
    this.timer.allClear();

    //점령완료 패킷 전송
    this.sendOccupationPacket(PACKET_TYPE.OCCUPATION_SUCCESS_NOTIFICATION, false, completeTeam);
  }

  // 중복 코드로 인한 메서드화
  sendOccupationPacket(packetType, payload, target = null) {
    // payload false 인 상황이면 payloadB를 사용한다는 뜻으로 target 지정이 필요
    try {
      if (!payload && target === null) throw new Error('payload or target is required');
      for (let i = 0; i < 2; i++) {
        const payloadA = { isTop: this.isTop };
        const payloadB = {
          isTop: this.isTop,
          isOpponent: i === Number(target) ? false : true,
        };

        sendPacket(
          this[`player${i === 0 ? 'A' : 'B'}`].socket,
          packetType,
          payload ? payloadA : payloadB,
        );
      }
    } catch (err) {
      handleErr(null, err);
    }
  }

  getStatus() {
    return this.#status;
  }

  delete() {
    this.timer.allClear();
    this.timer = null;
    console.log('체크포인트 딜리트 진행:', this.timer);
  }
}

export default CheckPoint;
