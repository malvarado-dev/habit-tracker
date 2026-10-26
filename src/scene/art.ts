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

/** Activity Bar icons (P2-07): food, toy, petting. Metro picks the @1x/@2x/@3x file. */
export const activityArt = {
  food: require('../../assets/private/icon-food-bowl.png'),
  toy: require('../../assets/private/icon-yarn-ball.png'),
  pet: require('../../assets/private/icon-petting-hand.png'),
};

/** Pet looks (P2-15a). Each look's sit, walk and sleep. Tabby-Orange is petArt above. */
export const lookArt = {
  tabbyGray: {
    sit: require('../../assets/private/tabby-gray-sit.png'),
    walk: require('../../assets/private/tabby-gray-walk.png'),
    sleep: require('../../assets/private/tabby-gray-sleep.png'),
  },
  tabbyGrayReal: {
    sit: require('../../assets/private/tabby-grayreal-sit.png'),
    walk: require('../../assets/private/tabby-grayreal-walk.png'),
    sleep: require('../../assets/private/tabby-grayreal-sleep.png'),
  },
};

/** Accessories placed on any look by anchor points (P2-15a). */
export const accessoryArt = {
  bandageTail: require('../../assets/private/accessories-bandage-tail.png'),
  bandageLeg: require('../../assets/private/accessories-bandage-leg.png'),
};
