import type { InventoryItemDTO, MaterialCategoryEnum, RegionCode } from '@rekasains/shared-types';

/** Catalog materials (same slugs as services/ai-agent and core-api), offered as quick-add templates. */
interface MaterialTemplate {
  slug: string;
  category: MaterialCategoryEnum;
  nameId: string;
  nameMy: string;
  unit: string;
}

export const MATERIAL_TEMPLATES: MaterialTemplate[] = [
  { slug: 'battery_aa_1_5v', category: 'ELECTRONICS', nameId: 'Baterai AA 1.5V', nameMy: 'Bateri AA 1.5V', unit: 'pcs' },
  { slug: 'copper_wire_jumper', category: 'ELECTRONICS', nameId: 'Kabel Tembaga / Jumper', nameMy: 'Wayar Tembaga / Pelompat', unit: 'pcs' },
  { slug: 'led_diode_5mm', category: 'ELECTRONICS', nameId: 'Lampu LED Kecil 5mm', nameMy: 'Lampu LED Kecil 5mm', unit: 'pcs' },
  { slug: 'aluminum_foil_strip', category: 'HOUSEHOLD_TOOL', nameId: 'Strip Aluminium Foil Dapur', nameMy: 'Jalur Kerajang Aluminium Dapur', unit: 'pcs' },
  { slug: 'aluminum_can_recycled', category: 'RECYCLED', nameId: 'Kaleng Minuman Aluminium Bekas', nameMy: 'Tin Minuman Aluminium Terpakai', unit: 'pcs' },
  { slug: 'pvc_pipe_half_inch', category: 'HOUSEHOLD_TOOL', nameId: 'Pipa PVC 1/2 Inci (30 cm)', nameMy: 'Paip PVC 1/2 Inci (30 cm)', unit: 'pcs' },
  { slug: 'thick_plastic_straw', category: 'RECYCLED', nameId: 'Sedotan Plastik Tebal', nameMy: 'Straw Plastik Tebal', unit: 'pcs' },
  { slug: 'cardboard_roll_core', category: 'RECYCLED', nameId: 'Gulungan Karton Bekas Tisu', nameMy: 'Gulungan Kadbod Tisu Terpakai', unit: 'pcs' },
  { slug: 'plastic_bottle_pet_600ml', category: 'RECYCLED', nameId: 'Botol Plastik 600ml Bekas', nameMy: 'Botol Plastik 600ml Terpakai', unit: 'pcs' },
  { slug: 'balloon_latex', category: 'HOUSEHOLD_TOOL', nameId: 'Balon Karet', nameMy: 'Belon Getah', unit: 'pcs' },
  { slug: 'vinegar_kitchen', category: 'KITCHEN_CHEMICAL', nameId: 'Cuka Dapur', nameMy: 'Cuka Makan', unit: 'bottle' },
  { slug: 'sodium_bicarbonate', category: 'KITCHEN_CHEMICAL', nameId: 'Soda Kue', nameMy: 'Serbuk Penaik', unit: 'pack' },
  { slug: 'sodium_hypochlorite', category: 'KITCHEN_CHEMICAL', nameId: 'Pemutih Pakaian', nameMy: 'Peluntur Pakaian', unit: 'bottle' },
  { slug: 'floor_cleaner_acidic', category: 'KITCHEN_CHEMICAL', nameId: 'Pembersih Lantai Asam', nameMy: 'Pencuci Lantai Berasid', unit: 'bottle' },
  { slug: 'ammonia_cleaner', category: 'KITCHEN_CHEMICAL', nameId: 'Pembersih Kaca Amonia', nameMy: 'Pencuci Cermin Amonia', unit: 'bottle' },
];

export function templateName(t: MaterialTemplate, region: RegionCode): string {
  return region === 'MY' ? t.nameMy : t.nameId;
}

export function templateToItem(t: MaterialTemplate, region: RegionCode, quantity: number): InventoryItemDTO {
  return {
    material_slug: t.slug,
    name_local: templateName(t, region),
    category: t.category,
    quantity,
    unit: t.unit,
    confidence: 1,
  };
}
