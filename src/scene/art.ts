// The private art (P2-06). scripts/sync-art.mjs copies it into assets/private/ from the private
// bad-neko-art repo, or plain placeholders when that repo isn't there (CI, the public web build).
// The folder is git ignored, so the art never lands in this public repo.

export const roomArt = {
  base: require('../../assets/private/room-base.png'),
  bedBack: require('../../assets/private/bed-back.png'),
  bedFront: require('../../assets/private/bed-front.png'),
};

export const petArt = {
  sit: require('../../assets/private/pet-cat-sit.png'),
  sitEyesClosed: require('../../assets/private/pet-cat-sit-eyes-closed.png'),
  sleep: require('../../assets/private/pet-cat-sleep.png'),
  sleepEyesOpen: require('../../assets/private/pet-cat-sleep-eyes-open.png'),
  walk: require('../../assets/private/pet-cat-walk.png'),
  walkEyesClosed: require('../../assets/private/pet-cat-walk-eyes-closed.png'),
};
