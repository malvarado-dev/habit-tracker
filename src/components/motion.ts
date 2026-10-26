// Shared motion, so the ring and the Activity Bar fill move the same way (P2-08a).

import { Easing } from 'react-native-reanimated';

import { tuning } from '@/config/tuning';

/** The Activity Bar's fill easing. Each ring segment fills with it too. */
export const fillEasing = Easing.out(Easing.cubic);

/** How long a fill takes, for the bar and each ring segment. */
export const fillMs = tuning.energy.fillMs;
