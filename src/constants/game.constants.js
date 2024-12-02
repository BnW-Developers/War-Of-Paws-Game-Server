export const MAX_PLAYERS = 2;
export const GAME_START_TIMEOUT = 30 * 1000; // gameStartRequest를 30초동안 기다림
export const GAME_START_REQUEST_REQUIRE = 2; // 게임 시작을 위해 필요한 플레이어 수
export const INITIAL_MINERAL = 30000;
export const INITIAL_MINERAL_RATE = 1;
export const MINERAL_SYNC_INTERVAL = 1000;
export const INITIAL_BASE_HP = 1000;
export const ATTACK_COOLDOWN_ERROR_MARGIN = 200;
export const SKILL_COOLDOWN_ERROR_MARGIN = 200;
export const ATTACK_RANGE_ERROR_MARGIN = 1.05; // 5%
export const SPEED_MARGIN_OF_ERROR = 1.0001; // 속도 허용 오차배율

export const INITIAL_UNIT_ROTATION = Object.freeze({ up: 0, down: 180 });
