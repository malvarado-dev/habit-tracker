import { describe, expect, it } from '@jest/globals';

import { contrastRatio } from '@/design/theme/theme';
import { background as sky } from '@/design/tokens';
import { textStyle, urbanist } from '@/design/fonts';

describe('menu button contrast on every sky (3:1, background.md)', () => {
  it.each([
    ['day', sky.onSkyDay, sky.dayTop],
    ['dusk', sky.onSkyDark, sky.duskTop],
    ['night', sky.onSkyDark, sky.nightTop],
  ])('%s sky', (_time, ink, top) => {
    expect(contrastRatio(ink, top)).toBeGreaterThanOrEqual(3);
  });
});

describe('Urbanist', () => {
  it('maps each font weight to its own font family', () => {
    expect(urbanist('300')).toBe('Urbanist_300Light');
    expect(urbanist('700')).toBe('Urbanist_700Bold');
    expect(textStyle('label')).toMatchObject({ fontSize: 13, fontFamily: 'Urbanist_700Bold' });
    expect(textStyle('habitName')).not.toHaveProperty('fontWeight');
  });
});
