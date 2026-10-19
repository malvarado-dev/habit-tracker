// Urbanist, the app font (design-system.md). Each weight loads as its own font family,
// because phones pick a font file by family name, not by fontWeight.

import {
  Urbanist_300Light,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';

import { typography } from './tokens';

export const URBANIST_FONTS = {
  Urbanist_300Light,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
};

const FAMILY_BY_WEIGHT: Record<string, keyof typeof URBANIST_FONTS> = {
  '300': 'Urbanist_300Light',
  '500': 'Urbanist_500Medium',
  '600': 'Urbanist_600SemiBold',
  '700': 'Urbanist_700Bold',
};

/** The Urbanist family for a weight. Nothing below 500 is used under 16 pt (design-system.md). */
export function urbanist(weight: '300' | '500' | '600' | '700'): string {
  return FAMILY_BY_WEIGHT[weight] ?? 'Urbanist_500Medium';
}

type TypeRole = keyof typeof typography;

/** A ready-to-use text style for a type role, in Urbanist. */
export function textStyle(role: TypeRole, weight?: '300' | '500' | '600' | '700') {
  const { fontWeight, ...rest } = typography[role];
  return { ...rest, fontFamily: urbanist(weight ?? fontWeight) };
}
