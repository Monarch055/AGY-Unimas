-- Migration 003: Seed Indonesia (ID) & Malaysia (MY) Canonical Materials, Functional Substitutes & Active Hazard Rules
-- Owning Service: services/core-api (PostgreSQL 16)

INSERT INTO canonical_materials (
    slug, category, name_id, name_my, aliases_id, aliases_my, functional_tags, default_unit, est_price_idr, est_price_myr_sen, store_types_id, store_types_my
) VALUES
    ('battery_aa_1_5v', 'ELECTRONICS', 'Baterai AA 1.5V', 'Bateri AA 1.5V', '{"baterai jam","baterai abc"}', '{"bateri jam","bateri aa"}', '{"DC_VOLTAGE_SOURCE"}', 'pcs', 3500, 220, '{"Warung Kelontong","Indomaret/Alfamart","Toko Listrik"}', '{"Kedai Runcit","99 Speedmart","MR.DIY"}'),
    ('copper_wire_jumper', 'ELECTRONICS', 'Kabel Tembaga / Jumper', 'Wayar Tembaga / Pelompat', '{"kabel kecil","kawat tembaga"}', '{"wayar kuprum","kabel jumper"}', '{"ELECTRICAL_CONDUCTOR"}', 'pcs', 2000, 150, '{"Toko Listrik","Toko Bangunan"}', '{"MR.DIY","Kedai Elektronik"}'),
    ('aluminum_foil_strip', 'HOUSEHOLD_TOOL', 'Strip Aluminium Foil Dapur', 'Jalur Kerajang Aluminium Dapur', '{"kertas timah","alumunium foil"}', '{"aluminum foil","kertas perak"}', '{"ELECTRICAL_CONDUCTOR","HEAT_REFLECTOR"}', 'pcs', 1500, 100, '{"Warung Kelontong","Indomaret/Alfamart"}', '{"Kedai Runcit","99 Speedmart","Eco-Shop"}'),
    ('aluminum_can_recycled', 'RECYCLED', 'Kaleng Minuman Aluminium Bekas (Amplas)', 'Tin Minuman Aluminium Terpakai', '{"kaleng soda bekas","kaleng susu"}', '{"tin minuman kosong","tin aluminium"}', '{"ELECTRICAL_CONDUCTOR","THERMAL_VESSEL"}', 'pcs', 0, 0, '{"Barang Bekas Rumah"}', '{"Barangan Kitar Semula Rumah"}'),
    ('led_diode_5mm', 'ELECTRONICS', 'Lampu LED Kecil 5mm', 'Lampu LED Kecil 5mm', '{"lampu led","bohlam kecil"}', '{"mentol led","lampu diod"}', '{"LIGHT_INDICATOR_LOAD"}', 'pcs', 1000, 80, '{"Toko Listrik","Tokopedia/Shopee"}', '{"MR.DIY","Kedai Elektronik","Shopee MY"}'),
    ('pvc_pipe_half_inch', 'HOUSEHOLD_TOOL', 'Pipa PVC 1/2 Inci (30 cm)', 'Paip PVC 1/2 Inci (30 cm)', '{"paralon kecil","pipa air"}', '{"paip air pvc","batang pvc"}', '{"FLUID_AIR_CONDUIT"}', 'pcs', 5000, 300, '{"Toko Bangunan","Mitra10"}', '{"MR.DIY","Kedai Perkakas Hardware"}'),
    ('thick_plastic_straw', 'RECYCLED', 'Sedotan Plastik Tebal (Boba)', 'Straw Plastik Tebal', '{"sedotan minuman","sedotan boba"}', '{"straw minuman","penyedut minuman tebal"}', '{"FLUID_AIR_CONDUIT"}', 'pcs', 500, 30, '{"Warung Kelontong","Barang Bekas Rumah"}', '{"Kedai Runcit","Eco-Shop"}'),
    ('cardboard_roll_core', 'RECYCLED', 'Gulungan Karton Bekas Tisu', 'Gulungan Kadbod Tisu Terpakai', '{"tabung tisu gulung","karton silinder"}', '{"gegelung tisu","silinder kadbod"}', '{"FLUID_AIR_CONDUIT"}', 'pcs', 0, 0, '{"Barang Bekas Rumah"}', '{"Barangan Kitar Semula Rumah"}'),
    ('plastic_bottle_pet_600ml', 'RECYCLED', 'Botol Plastik Air Mineral 600ml Bekas', 'Botol Plastik Air Mineral 600ml Terpakai', '{"botol aqua bekas","botol pet"}', '{"botol mineral kosong","botol plastik"}', '{"PRESSURE_VESSEL","GRADUATED_CONTAINER"}', 'pcs', 0, 0, '{"Barang Bekas Rumah","Warung Kelontong"}', '{"Barangan Kitar Semula Rumah","Kedai Runcit"}'),
    ('balloon_latex', 'HOUSEHOLD_TOOL', 'Balon Karet', 'Belon Getah', '{"balon tiup"}', '{"belon tiup"}', '{"ELASTIC_MEMBRANE","GAS_COLLECTOR"}', 'pcs', 1500, 100, '{"Warung Kelontong","Toko Alat Tulis","Indomaret/Alfamart"}', '{"Kedai Runcit","Eco-Shop","MR.DIY"}'),
    ('vinegar_kitchen', 'KITCHEN_CHEMICAL', 'Cuka Dapur (Asam Asetat CH3COOH 5%)', 'Cuka Makan (Asid Asetik CH3COOH 5%)', '{"cuka makan","cuka botol"}', '{"cuka buatan","cuka dapur"}', '{"WEAK_ACID_REAGENT"}', 'bottle', 4000, 250, '{"Warung Kelontong","Indomaret/Alfamart","Pasar"}', '{"Kedai Runcit","99 Speedmart","Pasar Raya"}'),
    ('sodium_bicarbonate', 'KITCHEN_CHEMICAL', 'Soda Kue (Natrium Bikarbonat NaHCO3)', 'Serbuk Penaik (Natrium Bikarbonat NaHCO3)', '{"baking soda","soda roti"}', '{"baking soda","bikarbonat soda"}', '{"CARBONATE_BASE_REAGENT"}', 'pack', 5000, 280, '{"Warung Kelontong","Toko Bahan Kue","Indomaret/Alfamart"}', '{"Kedai Runcit","99 Speedmart","Kedai Bakeri"}'),
    ('sodium_hypochlorite', 'KITCHEN_CHEMICAL', 'Pemutih Pakaian (Natrium Hipoklorit NaOCl)', 'Peluntur Pakaian (Natrium Hipoklorit NaOCl)', '{"bayclin","pemutih baju"}', '{"clorox","peluntur baju"}', '{"STRONG_OXIDIZER_BLEACH"}', 'bottle', 6000, 350, '{"Warung Kelontong","Indomaret/Alfamart"}', '{"Kedai Runcit","99 Speedmart"}'),
    ('floor_cleaner_acidic', 'KITCHEN_CHEMICAL', 'Pembersih Lantai/Porselen Asam Kuat (HCl)', 'Pencuci Lantai/Tandas Berasid (HCl)', '{"pembersih keramik","porstex","vixal"}', '{"pencuci tandas asid","harpic asid"}', '{"STRONG_ACID_CLEANER"}', 'bottle', 12000, 650, '{"Indomaret/Alfamart","Supermarket"}', '{"99 Speedmart","MR.DIY"}'),
    ('ammonia_cleaner', 'KITCHEN_CHEMICAL', 'Pembersih Kaca Amonia (NH3)', 'Pencuci Cermin Amonia (NH3)', '{"pembersih kaca"}', '{"pencuci tingkap amonia"}', '{"AMMONIA_BASE_CLEANER"}', 'bottle', 10000, 550, '{"Supermarket","Toko Bangunan"}', '{"99 Speedmart","MR.DIY"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO functional_substitutes (
    missing_material_slug, substitute_material_slug, shared_scientific_principle_id, shared_scientific_principle_my, adaptation_steps_id, adaptation_steps_my
) VALUES
    (
        'pvc_pipe_half_inch',
        'thick_plastic_straw',
        'Prinsip Konduksi Aliran Udara & Tekanan Fluida Silindris (Hukum Bernoulli & Kontinuitas A1*v1 = A2*v2)',
        'Prinsip Konduksi Aliran Udara & Tekanan Bendalir Silinder (Hukum Bernoulli & Keselanjaran A1*v1 = A2*v2)',
        '{"Gabungkan 2 sedotan plastik tebal sejajar atau rekatkan ujungnya dengan selotip agar kedap udara","Pastikan ujung sedotan yang masuk ke mulut botol dilapisi plastisin/selotip agar tidak ada kebocoran tekanan"}',
        '{"Gabungkan 2 straw plastik tebal atau lekatkan hujungnya dengan pita pelekat supaya kedap udara","Pastikan sambungan straw pada mulut botol ditutup rapat supaya tiada kebocoran tekanan"}'
    ),
    (
        'pvc_pipe_half_inch',
        'cardboard_roll_core',
        'Prinsip Tabung Pengarah Aliran Udara & Peluncur Aerodinamis Silindris',
        'Prinsip Tiub Pengarah Aliran Udara & Pelancar Aerodinamik Silinder',
        '{"Lapisi bagian dalam dan luar gulungan karton bekas tisu menggunakan selotip bening agar tahan lembap dan kaku","Pasangkan secara presisi sebagai selongsong pengarah tekanan udara"}',
        '{"Balut bahagian luar gulungan kadbod tisu dengan pita pelekat lutsinar supaya kalis lembap dan kukuh","Pasangkan sebagai tiub pengarah tekanan udara"}'
    ),
    (
        'copper_wire_jumper',
        'aluminum_foil_strip',
        'Prinsip Konduktivitas Elektron Logam (Ikatan Logam & Elektron Bebas pada Aluminium)',
        'Prinsip Kekonduksian Elektron Logam (Ikatan Logam & Elektron Bebas pada Aluminium)',
        '{"Gunting lembaran aluminium foil dapur dengan ukuran lebar 2 cm dan panjang 20 cm","Lipat memanjang 4 kali hingga membentuk pita konduktor padat seperti kabel pipih"}',
        '{"Gunting kerajang aluminium dapur dengan lebar 2 cm dan panjang 20 cm","Lipat memanjang 4 kali sehingga membentuk jalur konduktor padat menggantikan wayar"}'
    )
ON CONFLICT (missing_material_slug, substitute_material_slug) DO NOTHING;

INSERT INTO safety_hazard_rules (
    rule_code, material_slug_a, material_slug_b, severity, warning_id, warning_my
) VALUES
    (
        'HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER',
        'sodium_hypochlorite',
        'floor_cleaner_acidic',
        'CRITICAL_CO_LOCATION_WARNING',
        'PERINGATAN MERAH AKTIF: Terdeteksi Pemutih Pakaian (NaOCl) dan Pembersih Lantai Asam (HCl) berada di meja yang sama! Segera pisahkan salah satu bahan dari area kerja. Pencampuran keduanya menghasilkan Gas Klorin (Cl2) mematikan!',
        'AMARAN MERAH AKTIF: Dikesan Peluntur Pakaian (NaOCl) dan Pencuci Lantai Berasid (HCl) berada di kawasan meja yang sama! Sila asingkan segera. Campuran kedua-duanya menghasilkan Gas Klorin (Cl2) beracun!'
    ),
    (
        'HAZ_NAOCL_VINEGAR_CHLORINE_GAS',
        'sodium_hypochlorite',
        'vinegar_kitchen',
        'CRITICAL_HAZARD_BLOCKED',
        'BAHAYA KRITIS DIBLOKIR: Dilarang keras mencampur Pemutih Pakaian (NaOCl) dengan Cuka Dapur (Asam Asetat) karena melepaskan uap gas klorin beracun yang merusak saluran pernapasan!',
        'BAHAYA KRITIKAL DISEKAT: Dilarang sama sekali mencampurkan Peluntur Pakaian (NaOCl) dengan Cuka Makan (Asid Asetik) kerana membebaskan gas klorin beracun!'
    ),
    (
        'HAZ_NAOCL_AMMONIA_CHLORAMINE',
        'sodium_hypochlorite',
        'ammonia_cleaner',
        'CRITICAL_HAZARD_BLOCKED',
        'BAHAYA KRITIS DIBLOKIR: Dilarang mencampur Pemutih Pakaian (NaOCl) dengan Pembersih Kaca Amonia (NH3) karena menghasilkan gas Kloramin beracun!',
        'BAHAYA KRITIKAL DISEKAT: Dilarang mencampurkan Peluntur Pakaian (NaOCl) dengan Pencuci Amonia (NH3) kerana menghasilkan gas Kloramin beracun!'
    )
ON CONFLICT (rule_code) DO NOTHING;
