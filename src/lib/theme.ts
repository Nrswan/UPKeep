import { useColorScheme } from 'react-native';

import type { DueStatus } from './types';

const light = {
  bg: '#F4F5F2',
  card: '#FFFFFF',
  text: '#16201B',
  sub: '#5E6B64',
  line: '#E2E5DF',
  primary: '#1F6F54',
  onPrimary: '#FFFFFF',
  danger: '#B3261E',
  dangerBg: '#FBE9E7',
  warn: '#8A5A00',
  warnBg: '#FFF1D6',
  okBg: '#E3F1EA',
  muted: '#ECEEE9',
};

const dark: typeof light = {
  bg: '#0F1512',
  card: '#19211D',
  text: '#ECF1EE',
  sub: '#9BA8A1',
  line: '#2A332E',
  primary: '#58C39B',
  onPrimary: '#06251A',
  danger: '#FF8A80',
  dangerBg: '#3A1A17',
  warn: '#F2C265',
  warnBg: '#3A2D0E',
  okBg: '#163126',
  muted: '#222B26',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export function statusColors(t: Theme, status: DueStatus): { fg: string; bg: string } {
  switch (status) {
    case 'overdue':
      return { fg: t.danger, bg: t.dangerBg };
    case 'soon':
      return { fg: t.warn, bg: t.warnBg };
    case 'ok':
      return { fg: t.primary, bg: t.okBg };
    default:
      return { fg: t.sub, bg: t.muted };
  }
}
