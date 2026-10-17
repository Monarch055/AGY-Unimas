import type {
  AgeAdaptiveLevelEnum,
  MatchTierEnum,
  MaterialCategoryEnum,
  RegionCode,
  SafetySeverityEnum,
} from '@rekasains/shared-types';

export const AGE_LEVELS: AgeAdaptiveLevelEnum[] = [
  'SD_ELEMENTARY',
  'SMP_LOWER_SEC',
  'SMA_UPPER_SEC',
  'HIGHER_ED_UNI',
];

export function ageLevelLabel(level: AgeAdaptiveLevelEnum, region: RegionCode): string {
  const isMY = region === 'MY';
  switch (level) {
    case 'SD_ELEMENTARY':
      return isMY ? 'Sekolah Rendah' : 'SD';
    case 'SMP_LOWER_SEC':
      return isMY ? 'Menengah Rendah' : 'SMP';
    case 'SMA_UPPER_SEC':
      return isMY ? 'Menengah Atas' : 'SMA/SMK';
    case 'HIGHER_ED_UNI':
      return isMY ? 'Universiti' : 'Perguruan Tinggi';
  }
}

export function categoryLabel(category: MaterialCategoryEnum | string): string {
  switch (category) {
    case 'RECYCLED':
      return 'Barang bekas';
    case 'KITCHEN_CHEMICAL':
      return 'Bahan kimia rumah';
    case 'HOUSEHOLD_TOOL':
      return 'Alat rumah';
    case 'ELECTRONICS':
      return 'Elektronik';
    case 'LAB_APPARATUS':
      return 'Alat lab';
    default:
      return String(category);
  }
}

export function severityLabel(severity: SafetySeverityEnum): string {
  switch (severity) {
    case 'SAFE':
      return 'Aman';
    case 'ADULT_SUPERVISION':
      return 'Perlu pendamping dewasa';
    case 'CRITICAL_CO_LOCATION_WARNING':
      return 'Bahaya: jangan diletakkan berdekatan';
    case 'CRITICAL_HAZARD_BLOCKED':
      return 'Bahaya: diblokir';
  }
}

export function tierLabel(tier: MatchTierEnum): string {
  switch (tier) {
    case 'STRICT_100':
      return 'Bahan lengkap';
    case 'DIY_SUBSTITUTE':
      return 'Pakai bahan pengganti';
    case 'LOCAL_MICRO_SHOP':
      return 'Perlu beli sedikit';
  }
}
