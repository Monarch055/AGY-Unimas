package repository

import (
	"context"
	"sync"

	"github.com/rekasains/core-api/internal/domain"
)

// SeededStore implements CatalogRepository, InventoryRepository, and VerificationAndReportRepository
// with thread-safe state and pre-seeded Indonesia (ID) & Malaysia (MY) STEM catalog data.
type SeededStore struct {
	mu                sync.RWMutex
	materials         map[string]domain.CanonicalMaterial
	materialOrder     []string
	substitutes       map[string][]domain.FunctionalSubstituteRule
	hazardRules       []domain.SafetyHazardRule
	experiments       map[string]domain.ExperimentBlueprint
	experimentOrder   []string
	userInventories   map[string][]domain.InventoryItemInput
	stepVerifications map[string][]domain.StepVisionVerifyResponse
	labReports        map[string]domain.LabReportGenerateResponse
	syncedMutations   map[string]map[string]int // userID -> clientMutationID -> xpAwarded
}

func NewSeededStore() *SeededStore {
	s := &SeededStore{
		materials:         make(map[string]domain.CanonicalMaterial),
		substitutes:       make(map[string][]domain.FunctionalSubstituteRule),
		experiments:       make(map[string]domain.ExperimentBlueprint),
		userInventories:   make(map[string][]domain.InventoryItemInput),
		stepVerifications: make(map[string][]domain.StepVisionVerifyResponse),
		labReports:        make(map[string]domain.LabReportGenerateResponse),
		syncedMutations:   make(map[string]map[string]int),
	}
	s.seedCatalog()
	return s
}

func (s *SeededStore) addMaterial(m domain.CanonicalMaterial) {
	s.materials[m.Slug] = m
	s.materialOrder = append(s.materialOrder, m.Slug)
}

func (s *SeededStore) addExperiment(e domain.ExperimentBlueprint) {
	s.experiments[e.Slug] = e
	s.experimentOrder = append(s.experimentOrder, e.Slug)
}

func (s *SeededStore) seedCatalog() {
	// 1. Canonical Materials (ID & MY with Integer Currency IDR & MYR_SEN)
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "battery_aa_1_5v",
		Category:       "ELECTRONICS",
		NameID:         "Baterai AA 1.5V",
		NameMY:         "Bateri AA 1.5V",
		AliasesID:      []string{"baterai jam", "baterai abc"},
		AliasesMY:      []string{"bateri jam", "bateri aa"},
		FunctionalTags: []string{"DC_VOLTAGE_SOURCE"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    3500,
		EstPriceMYRSen: 220,
		StoreTypesID:   []string{"Warung Kelontong", "Indomaret/Alfamart", "Toko Listrik"},
		StoreTypesMY:   []string{"Kedai Runcit", "99 Speedmart", "MR.DIY"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "copper_wire_jumper",
		Category:       "ELECTRONICS",
		NameID:         "Kabel Tembaga / Jumper",
		NameMY:         "Wayar Tembaga / Pelompat",
		AliasesID:      []string{"kabel kecil", "kawat tembaga"},
		AliasesMY:      []string{"wayar kuprum", "kabel jumper"},
		FunctionalTags: []string{"ELECTRICAL_CONDUCTOR"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    2000,
		EstPriceMYRSen: 150,
		StoreTypesID:   []string{"Toko Listrik", "Toko Bangunan"},
		StoreTypesMY:   []string{"MR.DIY", "Kedai Elektronik"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "aluminum_foil_strip",
		Category:       "HOUSEHOLD_TOOL",
		NameID:         "Strip Aluminium Foil Dapur",
		NameMY:         "Jalur Kerajang Aluminium Dapur",
		AliasesID:      []string{"kertas timah", "alumunium foil"},
		AliasesMY:      []string{"aluminum foil", "kertas perak"},
		FunctionalTags: []string{"ELECTRICAL_CONDUCTOR", "HEAT_REFLECTOR"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    1500,
		EstPriceMYRSen: 100,
		StoreTypesID:   []string{"Warung Kelontong", "Indomaret/Alfamart"},
		StoreTypesMY:   []string{"Kedai Runcit", "99 Speedmart", "Eco-Shop"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "aluminum_can_recycled",
		Category:       "RECYCLED",
		NameID:         "Kaleng Minuman Aluminium Bekas (Amplas)",
		NameMY:         "Tin Minuman Aluminium Terpakai",
		AliasesID:      []string{"kaleng soda bekas", "kaleng susu"},
		AliasesMY:      []string{"tin minuman kosong", "tin aluminium"},
		FunctionalTags: []string{"ELECTRICAL_CONDUCTOR", "THERMAL_VESSEL"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    0,
		EstPriceMYRSen: 0,
		StoreTypesID:   []string{"Barang Bekas Rumah"},
		StoreTypesMY:   []string{"Barangan Kitar Semula Rumah"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "led_diode_5mm",
		Category:       "ELECTRONICS",
		NameID:         "Lampu LED Kecil 5mm",
		NameMY:         "Lampu LED Kecil 5mm",
		AliasesID:      []string{"lampu led", "bohlam kecil"},
		AliasesMY:      []string{"mentol led", "lampu diod"},
		FunctionalTags: []string{"LIGHT_INDICATOR_LOAD"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    1000,
		EstPriceMYRSen: 80,
		StoreTypesID:   []string{"Toko Listrik", "Tokopedia/Shopee"},
		StoreTypesMY:   []string{"MR.DIY", "Kedai Elektronik"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "pvc_pipe_half_inch",
		Category:       "HOUSEHOLD_TOOL",
		NameID:         "Pipa PVC 1/2 Inci (30 cm)",
		NameMY:         "Paip PVC 1/2 Inci (30 cm)",
		AliasesID:      []string{"paralon kecil", "pipa air"},
		AliasesMY:      []string{"paip air pvc", "batang pvc"},
		FunctionalTags: []string{"FLUID_AIR_CONDUIT"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    5000,
		EstPriceMYRSen: 300,
		StoreTypesID:   []string{"Toko Bangunan", "Mitra10"},
		StoreTypesMY:   []string{"MR.DIY", "Kedai Perkakas Hardware"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "thick_plastic_straw",
		Category:       "RECYCLED",
		NameID:         "Sedotan Plastik Tebal (Boba)",
		NameMY:         "Straw Plastik Tebal",
		AliasesID:      []string{"sedotan minuman", "sedotan boba"},
		AliasesMY:      []string{"straw minuman", "penyedut minuman tebal"},
		FunctionalTags: []string{"FLUID_AIR_CONDUIT"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    500,
		EstPriceMYRSen: 30,
		StoreTypesID:   []string{"Warung Kelontong", "Barang Bekas Rumah"},
		StoreTypesMY:   []string{"Kedai Runcit", "Eco-Shop"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "cardboard_roll_core",
		Category:       "RECYCLED",
		NameID:         "Gulungan Karton Bekas Tisu",
		NameMY:         "Gulungan Kadbod Tisu Terpakai",
		AliasesID:      []string{"tabung tisu gulung", "karton silinder"},
		AliasesMY:      []string{"gegelung tisu", "silinder kadbod"},
		FunctionalTags: []string{"FLUID_AIR_CONDUIT"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    0,
		EstPriceMYRSen: 0,
		StoreTypesID:   []string{"Barang Bekas Rumah"},
		StoreTypesMY:   []string{"Barangan Kitar Semula Rumah"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "plastic_bottle_pet_600ml",
		Category:       "RECYCLED",
		NameID:         "Botol Plastik Air Mineral 600ml Bekas",
		NameMY:         "Botol Plastik Air Mineral 600ml Terpakai",
		AliasesID:      []string{"botol aqua bekas", "botol pet"},
		AliasesMY:      []string{"botol mineral kosong", "botol plastik"},
		FunctionalTags: []string{"PRESSURE_VESSEL", "GRADUATED_CONTAINER"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    0,
		EstPriceMYRSen: 0,
		StoreTypesID:   []string{"Barang Bekas Rumah", "Warung Kelontong"},
		StoreTypesMY:   []string{"Barangan Kitar Semula Rumah", "Kedai Runcit"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "balloon_latex",
		Category:       "HOUSEHOLD_TOOL",
		NameID:         "Balon Karet",
		NameMY:         "Belon Getah",
		AliasesID:      []string{"balon tiup"},
		AliasesMY:      []string{"belon tiup"},
		FunctionalTags: []string{"ELASTIC_MEMBRANE", "GAS_COLLECTOR"},
		DefaultUnit:    "pcs",
		EstPriceIDR:    1500,
		EstPriceMYRSen: 100,
		StoreTypesID:   []string{"Warung Kelontong", "Toko Alat Tulis", "Indomaret/Alfamart"},
		StoreTypesMY:   []string{"Kedai Runcit", "Eco-Shop", "MR.DIY"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "vinegar_kitchen",
		Category:       "KITCHEN_CHEMICAL",
		NameID:         "Cuka Dapur (Asam Asetat CH3COOH 5%)",
		NameMY:         "Cuka Makan (Asid Asetik CH3COOH 5%)",
		AliasesID:      []string{"cuka makan", "cuka botol"},
		AliasesMY:      []string{"cuka buatan", "cuka dapur"},
		FunctionalTags: []string{"WEAK_ACID_REAGENT"},
		DefaultUnit:    "bottle",
		EstPriceIDR:    4000,
		EstPriceMYRSen: 250,
		StoreTypesID:   []string{"Warung Kelontong", "Indomaret/Alfamart", "Pasar"},
		StoreTypesMY:   []string{"Kedai Runcit", "99 Speedmart", "Pasar Raya"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "sodium_bicarbonate",
		Category:       "KITCHEN_CHEMICAL",
		NameID:         "Soda Kue (Natrium Bikarbonat NaHCO3)",
		NameMY:         "Serbuk Penaik (Natrium Bikarbonat NaHCO3)",
		AliasesID:      []string{"baking soda", "soda roti"},
		AliasesMY:      []string{"baking soda", "bikarbonat soda"},
		FunctionalTags: []string{"CARBONATE_BASE_REAGENT"},
		DefaultUnit:    "pack",
		EstPriceIDR:    5000,
		EstPriceMYRSen: 280,
		StoreTypesID:   []string{"Warung Kelontong", "Toko Bahan Kue", "Indomaret/Alfamart"},
		StoreTypesMY:   []string{"Kedai Runcit", "99 Speedmart", "Kedai Bakeri"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "sodium_hypochlorite",
		Category:       "KITCHEN_CHEMICAL",
		NameID:         "Pemutih Pakaian (Natrium Hipoklorit NaOCl)",
		NameMY:         "Peluntur Pakaian (Natrium Hipoklorit NaOCl)",
		AliasesID:      []string{"bayclin", "pemutih baju"},
		AliasesMY:      []string{"clorox", "peluntur baju"},
		FunctionalTags: []string{"STRONG_OXIDIZER_BLEACH"},
		DefaultUnit:    "bottle",
		EstPriceIDR:    6000,
		EstPriceMYRSen: 350,
		StoreTypesID:   []string{"Warung Kelontong", "Indomaret/Alfamart"},
		StoreTypesMY:   []string{"Kedai Runcit", "99 Speedmart"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "floor_cleaner_acidic",
		Category:       "KITCHEN_CHEMICAL",
		NameID:         "Pembersih Lantai/Porselen Asam Kuat (HCl)",
		NameMY:         "Pencuci Lantai/Tandas Berasid (HCl)",
		AliasesID:      []string{"pembersih keramik", "porstex", "vixal"},
		AliasesMY:      []string{"pencuci tandas asid", "harpic asid"},
		FunctionalTags: []string{"STRONG_ACID_CLEANER"},
		DefaultUnit:    "bottle",
		EstPriceIDR:    12000,
		EstPriceMYRSen: 650,
		StoreTypesID:   []string{"Indomaret/Alfamart", "Supermarket"},
		StoreTypesMY:   []string{"99 Speedmart", "MR.DIY"},
	})
	s.addMaterial(domain.CanonicalMaterial{
		Slug:           "ammonia_cleaner",
		Category:       "KITCHEN_CHEMICAL",
		NameID:         "Pembersih Kaca Amonia (NH3)",
		NameMY:         "Pencuci Cermin Amonia (NH3)",
		AliasesID:      []string{"pembersih kaca"},
		AliasesMY:      []string{"pencuci tingkap amonia"},
		FunctionalTags: []string{"AMMONIA_BASE_CLEANER"},
		DefaultUnit:    "bottle",
		EstPriceIDR:    10000,
		EstPriceMYRSen: 550,
		StoreTypesID:   []string{"Supermarket", "Toko Bangunan"},
		StoreTypesMY:   []string{"99 Speedmart", "MR.DIY"},
	})

	// 2. Functional Physics/Chemistry Substitute Rules (USP #3)
	s.substitutes["pvc_pipe_half_inch"] = []domain.FunctionalSubstituteRule{
		{
			MissingMaterialSlug:         "pvc_pipe_half_inch",
			SubstituteMaterialSlug:      "thick_plastic_straw",
			SharedScientificPrincipleID: "Prinsip Konduksi Aliran Udara & Tekanan Fluida Silindris (Hukum Bernoulli & Kontinuitas A1*v1 = A2*v2)",
			SharedScientificPrincipleMY: "Prinsip Konduksi Aliran Udara & Tekanan Bendalir Silinder (Hukum Bernoulli & Keselanjaran A1*v1 = A2*v2)",
			AdaptationStepsID: []string{
				"Gabungkan 2 sedotan plastik tebal sejajar atau rekatkan ujungnya dengan selotip agar kedap udara.",
				"Pastikan sambungan sedotan pada mulut botol dilapisi plastisin/selotip agar tekanan udara tersalur 100%.",
			},
			AdaptationStepsMY: []string{
				"Gabungkan 2 straw plastik tebal atau lekatkan hujungnya dengan pita pelekat supaya kedap udara.",
				"Pastikan sambungan straw pada mulut botol ditutup rapat supaya tekanan udara tersalur 100%.",
			},
		},
		{
			MissingMaterialSlug:         "pvc_pipe_half_inch",
			SubstituteMaterialSlug:      "cardboard_roll_core",
			SharedScientificPrincipleID: "Prinsip Tabung Pengarah Aliran Udara & Peluncur Aerodinamis Silindris",
			SharedScientificPrincipleMY: "Prinsip Tiub Pengarah Aliran Udara & Pelancar Aerodinamik Silinder",
			AdaptationStepsID: []string{
				"Lapisi bagian luar gulungan karton bekas tisu menggunakan selotip bening agar kedap udara dan kaku.",
				"Pasangkan sebagai selongsong pengarah tekanan udara pengganti pipa PVC.",
			},
			AdaptationStepsMY: []string{
				"Balut bahagian luar gulungan kadbod tisu dengan pita pelekat lutsinar supaya kedap udara dan kukuh.",
				"Pasangkan sebagai tiub pengarah tekanan udara menggantikan paip PVC.",
			},
		},
	}

	s.substitutes["copper_wire_jumper"] = []domain.FunctionalSubstituteRule{
		{
			MissingMaterialSlug:         "copper_wire_jumper",
			SubstituteMaterialSlug:      "aluminum_foil_strip",
			SharedScientificPrincipleID: "Prinsip Konduktivitas Elektron Logam (Ikatan Logam & Lautan Elektron Bebas pada Aluminium)",
			SharedScientificPrincipleMY: "Prinsip Kekonduksian Elektron Logam (Ikatan Logam & Lautan Elektron Bebas pada Aluminium)",
			AdaptationStepsID: []string{
				"Gunting lembaran aluminium foil dapur dengan lebar 2 cm dan panjang 20 cm.",
				"Lipat memanjang 4 kali hingga membentuk pita konduktor padat pengganti kabel tembaga.",
			},
			AdaptationStepsMY: []string{
				"Gunting kerajang aluminium dapur dengan lebar 2 cm dan panjang 20 cm.",
				"Lipat memanjang 4 kali sehingga membentuk jalur konduktor padat menggantikan wayar tembaga.",
			},
		},
	}

	// 3. Active Safety & Co-Location Hazard Rules (USP #7)
	s.hazardRules = []domain.SafetyHazardRule{
		{
			RuleCode:      "HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER",
			MaterialSlugA: "sodium_hypochlorite",
			MaterialSlugB: "floor_cleaner_acidic",
			Severity:      domain.SeverityCriticalCoLocationWarning,
			WarningID:     "PERINGATAN MERAH AKTIF: Terdeteksi Pemutih Pakaian (NaOCl) dan Pembersih Lantai Asam (HCl) berada di satu area meja kerja! Segera jauhkan salah satu bahan. Pencampuran keduanya menghasilkan Gas Klorin (Cl2) mematikan!",
			WarningMY:     "AMARAN MERAH AKTIF: Dikesan Peluntur Pakaian (NaOCl) dan Pencuci Lantai Berasid (HCl) berada di kawasan meja yang sama! Sila asingkan segera. Campuran kedua-duanya menghasilkan Gas Klorin (Cl2) beracun!",
		},
		{
			RuleCode:      "HAZ_NAOCL_VINEGAR_CHLORINE_GAS",
			MaterialSlugA: "sodium_hypochlorite",
			MaterialSlugB: "vinegar_kitchen",
			Severity:      domain.SeverityCriticalHazardBlocked,
			WarningID:     "BAHAYA KRITIS DIBLOKIR: Jangan pernah mencampur Pemutih Pakaian (NaOCl) dengan Cuka Dapur (Asam Asetat) karena menghasilkan uap gas klorin beracun!",
			WarningMY:     "BAHAYA KRITIKAL DISEKAT: Jangan sesekali mencampurkan Peluntur Pakaian (NaOCl) dengan Cuka Makan (Asid Asetik) kerana membebaskan gas klorin beracun!",
		},
		{
			RuleCode:      "HAZ_NAOCL_AMMONIA_CHLORAMINE",
			MaterialSlugA: "sodium_hypochlorite",
			MaterialSlugB: "ammonia_cleaner",
			Severity:      domain.SeverityCriticalHazardBlocked,
			WarningID:     "BAHAYA KRITIS DIBLOKIR: Jangan mencampur Pemutih Pakaian (NaOCl) dengan Pembersih Amonia (NH3) karena menghasilkan gas Kloramin beracun!",
			WarningMY:     "BAHAYA KRITIKAL DISEKAT: Jangan mencampurkan Peluntur Pakaian (NaOCl) dengan Pencuci Amonia (NH3) kerana menghasilkan gas Kloramin beracun!",
		},
	}

	// 4. Experiment Catalog with 4-Level Age-Adaptive Scaffolding, Step Vision Criteria & Normalized AR Overlays
	varsOhmID := &domain.ScientificVariablesAndGraphSchemaDTO{
		FormulasLatex:       []string{`I = \frac{V}{R}`, `P = V \cdot I`, `R = \rho \frac{L}{A}`},
		IndependentVariable: "Tegangan Sumber Baterai V (Volt) — variasi 1x AA (1.5V) vs 2x AA Seri (3.0V)",
		DependentVariable:   "Kuat Arus Listrik I (mA) & Intensitas Nyala LED",
		ControlVariables:    []string{"Panjang konduktor kaleng/kabel", "Jenis lampu beban LED 5mm", "Suhu ruang"},
		XAxisLabel:          "Tegangan Sumber V (Volt)",
		YAxisLabel:          "Kuat Arus Listrik I (mA)",
		ExpectedTrend:       "LINEAR_PROPORTIONAL",
	}
	varsOhmMY := &domain.ScientificVariablesAndGraphSchemaDTO{
		FormulasLatex:       []string{`I = \frac{V}{R}`, `P = V \cdot I`, `R = \rho \frac{L}{A}`},
		IndependentVariable: "Voltan Sumber Bateri V (Volt) — variasi 1x AA (1.5V) vs 2x AA Siri (3.0V)",
		DependentVariable:   "Arus Elektrik I (mA) & Kecerahan Nyalaan LED",
		ControlVariables:    []string{"Panjang konduktor tin/wayar", "Jenis beban LED 5mm", "Suhu bilik"},
		XAxisLabel:          "Voltan Sumber V (Volt)",
		YAxisLabel:          "Arus Elektrik I (mA)",
		ExpectedTrend:       "LINEAR_PROPORTIONAL",
	}

	s.addExperiment(domain.ExperimentBlueprint{
		Slug:           "rangkaian-listrik-baterai-kaleng-ar",
		TitleID:        "Rangkaian Listrik Konduktor Kaleng Bekas & Simulasi AR Arus Elektron",
		TitleMY:        "Litar Elektrik Konduktor Tin Terpakai & Simulasi AR Aliran Elektron",
		SafetySeverity: domain.SeveritySafe,
		RequiredMaterials: []domain.ExperimentRequiredMaterial{
			{MaterialSlug: "battery_aa_1_5v", MinQuantity: 2, Unit: "pcs"},
			{MaterialSlug: "copper_wire_jumper", MinQuantity: 2, Unit: "pcs"},
			{MaterialSlug: "aluminum_can_recycled", MinQuantity: 1, Unit: "pcs"},
			{MaterialSlug: "led_diode_5mm", MinQuantity: 1, Unit: "pcs"},
		},
		AdaptiveScaffolds: map[domain.AgeAdaptiveLevel]domain.AdaptiveLevelMetadata{
			domain.LevelSDElementary: {
				CurriculumBadgeID:   "Kurikulum Merdeka SD Fase C (Kelas 5-6): Energi Listrik & Benda Penghantar di Sekitar Kita",
				CurriculumBadgeMY:   "KSSR Sains Tahun 5: Elektrik & Litar Lengkap",
				CompetencyCodeID:    "IPAS-SD-FASE-C-3.2",
				CompetencyCodeMY:    "KSSR-SN-T5-5.2",
				LearningObjectiveID: "Menemukan bahwa kaleng minuman bekas yang diamplas dapat menghantarkan energi listrik untuk menyalakan lampu LED.",
				LearningObjectiveMY: "Menemui bahawa tin minuman terpakai yang digosok dapat mengalirkan tenaga elektrik untuk menyalakan mentol LED.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Kaleng minuman terbuat dari logam aluminium yang mengizinkan elektron bergerak bebas seperti jalan tol listrik!",
					Technology:  "Menggunakan lampu LED hemat energi sebagai penanda rangkaian tertutup.",
					Engineering: "Merekayasa sakelar sentuh sederhana dari kaleng bekas.",
					Mathematics: "Menghitung jumlah baterai AA (2 x 1.5 Volt = 3 Volt) agar lampu menyala terang.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Tin minuman diperbuat daripada logam aluminium yang membenarkan elektron mengalir bebas!",
					Technology:  "Menggunakan lampu LED jimat tenaga sebagai penunjuk litar lengkap.",
					Engineering: "Merekacipta suis sentuh mudah daripada tin terpakai.",
					Mathematics: "Mengira jumlah bateri AA (2 x 1.5 Volt = 3 Volt) supaya lampu menyala terang.",
				},
			},
			domain.LevelSMPLowerSec: {
				CurriculumBadgeID:   "Kurikulum Merdeka SMP Fase D (Kelas 7-9): Listrik Dinamis, Konduktor vs Isolator",
				CurriculumBadgeMY:   "KSSM Sains Tingkatan 2: Keelektrikan & Kemagnetan",
				CompetencyCodeID:    "IPA-SMP-FASE-D-4.1",
				CompetencyCodeMY:    "KSSM-SN-T2-7.1",
				LearningObjectiveID: "Membuktikan perbedaan sifat isolator lapisan cat kaleng terhadap sifat konduktor logam aluminium murni dalam rangkaian arus searah (DC).",
				LearningObjectiveMY: "Membuktikan perbezaan sifat penebat lapisan cat tin berbanding sifat konduktor logam aluminium tulen dalam litar arus terus (DC).",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Lapisan cat luar kaleng bersifat isolator, sedangkan logam aluminium di bawahnya memiliki elektron valensi bebas.",
					Technology:  "Dioda LED hanya mengalirkan arus searah (bias maju dari anoda ke katoda).",
					Engineering: "Merancang rangkaian seri 2 baterai AA dengan jembatan konduktor barang bekas.",
					Mathematics: "Menghitung tegangan total seri V_total = V1 + V2 = 3.0 V.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Lapisan cat luar tin bersifat penebat, manakala logam aluminium di bawahnya mempunyai elektron bebas.",
					Technology:  "Diod LED hanya mengalirkan arus satu arah (pincang depan dari anod ke katod).",
					Engineering: "Membina litar bersiri 2 bateri AA dengan jambatan konduktor barangan kitar semula.",
					Mathematics: "Mengira jumlah voltan bersiri V_jumlah = V1 + V2 = 3.0 V.",
				},
			},
			domain.LevelSMAUpperSec: {
				CurriculumBadgeID:   "Kurikulum Merdeka SMA Fase E/F (Kelas 10-12): Hukum Ohm, Hambatan Jenis Logam & Rangkaian DC",
				CurriculumBadgeMY:   "KSSM Fizik Tingkatan 4/5: Elektrik, Hukum Ohm & Rintangan Dalam",
				CompetencyCodeID:    "FIS-SMA-FASE-F-12.1",
				CompetencyCodeMY:    "KSSM-FIZ-T5-2.2",
				LearningObjectiveID: "Menganalisis hubungan linier antara tegangan sumber (V) dan kuat arus listrik (I) berdasarkan Hukum Ohm serta memvisualisasikan arah aliran elektron vs arus konvensional melalui AR.",
				LearningObjectiveMY: "Menganalisis hubungan linear antara voltan (V) dan arus elektrik (I) berdasarkan Hukum Ohm serta memvisualisasikan aliran elektron melalui AR.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Analisis Hukum Ohm (I = V/R) dan hambatan jenis aluminium (rho = 2.65 x 10^-8 Ohm.m).",
					Technology:  "Simulasi AR Overlay berbasis koordinat untuk membedakan arah gerak elektron (-) ke (+) dan arus konvensional (+) ke (-).",
					Engineering: "Minimasi resistansi kontak pada sambungan elektroda baterai dan permukaan kaleng.",
					Mathematics: "Regresi linier grafik V terhadap I untuk menentukan nilai hambatan ekuivalen rangkaian.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Analisis Hukum Ohm (I = V/R) dan kerintangan aluminium (rho = 2.65 x 10^-8 Ohm.m).",
					Technology:  "Simulasi AR Overlay untuk membezakan arah pergerakan elektron (-) ke (+) dan arus konvensional (+) ke (-).",
					Engineering: "Meminimumkan rintangan sentuhan pada sambungan elektrod bateri dan permukaan tin.",
					Mathematics: "Regresi linear graf V melawan I untuk menentukan nilai rintangan setara litar.",
				},
				VariablesAndGraphID: varsOhmID,
				VariablesAndGraphMY: varsOhmMY,
			},
			domain.LevelHigherEdUni: {
				CurriculumBadgeID:   "Standar DIKTI Fisika Dasar II / Teknik Elektro: Konduktivitas Drude, Hukum Kirchoff & Analisis Galat",
				CurriculumBadgeMY:   "Matrikulasi / Universiti Fizik Asas: Model Konduktiviti Drude & Analisis Ralat Litar DC",
				CompetencyCodeID:    "DIKTI-FIS2-ELK-01",
				CompetencyCodeMY:    "UNI-PHY2-ELC-01",
				LearningObjectiveID: "Menentukan kurva karakteristik I-V non-linier dioda LED yang terhubung seri dengan konduktor silindris aluminium serta menghitung ketidakpastian pengukuran berulang.",
				LearningObjectiveMY: "Menentukan lengkung ciri I-V tak linear diod LED yang disambung bersiri dengan konduktor aluminium serta mengira ketidakpastian pengukuran berulang.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Model elektron bebas Drude-Lorentz dan tegangan kynnys (forward threshold voltage ~1.8V-2.2V) pada sambungan p-n LED.",
					Technology:  "Kalibrasi titik anchor AR untuk pemetaan gradien potensial listrik pada konduktor.",
					Engineering: "Evaluasi rugi tegangan jatuh (voltage drop) akibat hambatan dalam baterai (r_int).",
					Mathematics: "Perhitungan regresi kuadrat terkecil (Least Squares) dan analisis galat relatif (% error).",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Model elektron bebas Drude-Lorentz dan voltan ambang depan (~1.8V-2.2V) pada simpang p-n LED.",
					Technology:  "Kalibrasi titik anchor AR untuk pemetaan kecerunan keupayaan elektrik pada konduktor.",
					Engineering: "Penilaian susutan voltan akibat rintangan dalam bateri (r_int).",
					Mathematics: "Pengiraan regresi kuasa dua terkecil (Least Squares) dan analisis ralat relatif (% error).",
				},
				VariablesAndGraphID: varsOhmID,
				VariablesAndGraphMY: varsOhmMY,
			},
		},
		StepsID: []domain.ExperimentStepDTO{
			{
				StepNumber:                 1,
				Instruction:                "Susun 2 baterai AA 1.5V secara seri (kutub positif menyentuh negatif) dan hubungkan kabel pertama ke kutub positif (+) baterai.",
				RequiresVisionVerification: true,
				VisionVerificationPrompt:   "Periksa apakah 2 baterai AA tersusun seri dan kabel terhubung ke kutub positif (+) baterai.",
				DefaultAROverlay: domain.AROverlaySimulationDTO{
					OverlayType:  "ELECTRON_FLOW",
					CaptionLocal: "AR Overlay: Kutub (+) memiliki potensial tinggi (+3.0V) dan kutub (-) memiliki potensial rendah (0V).",
					VectorPaths: []domain.ARVectorPathDTO{
						{
							Label:          "Potensial +3.0V (Kutub +)",
							StartXNorm:     0.22,
							StartYNorm:     0.50,
							EndXNorm:       0.48,
							EndYNorm:       0.50,
							ColorHex:       "#FF5252",
							AnimationStyle: "PULSING_ARROW",
						},
					},
				},
				Checkable: true,
			},
			{
				StepNumber:                 2,
				Instruction:                "Tempelkan ujung kabel dari kutub (+) ke bagian permukaan kaleng aluminium yang sudah diamplas (tanpa cat), lalu hubungkan kaki panjang LED (Anoda +) ke sisi kaleng lainnya dan kaki pendek LED (Katoda -) kembali ke kutub (-) baterai.",
				RequiresVisionVerification: true,
				VisionVerificationPrompt:   "Periksa apakah rangkaian tertutup melalui permukaan kaleng aluminium dan lampu LED menyala.",
				DefaultAROverlay: domain.AROverlaySimulationDTO{
					OverlayType:  "ELECTRON_FLOW",
					CaptionLocal: "Simulasi AR Aktif: Panah biru menunjukkan aliran elektron bebas dari kutub (-) melewati kaleng aluminium menuju kutub (+).",
					VectorPaths: []domain.ARVectorPathDTO{
						{
							Label:          "Aliran Elektron (e-)",
							StartXNorm:     0.18,
							StartYNorm:     0.62,
							EndXNorm:       0.52,
							EndYNorm:       0.38,
							ColorHex:       "#00E5FF",
							AnimationStyle: "FLOWING_PARTICLES",
						},
						{
							Label:          "Arus Konvensional (I)",
							StartXNorm:     0.52,
							StartYNorm:     0.38,
							EndXNorm:       0.84,
							EndYNorm:       0.62,
							ColorHex:       "#FFD740",
							AnimationStyle: "PULSING_ARROW",
						},
					},
				},
				Checkable: true,
			},
		},
		StepsMY: []domain.ExperimentStepDTO{
			{
				StepNumber:                 1,
				Instruction:                "Susun 2 bateri AA 1.5V secara bersiri dan sambungkan wayar pertama ke kutub positif (+) bateri.",
				RequiresVisionVerification: true,
				VisionVerificationPrompt:   "Periksa sama ada 2 bateri AA disusun bersiri dan wayar disambung ke kutub positif (+).",
				DefaultAROverlay: domain.AROverlaySimulationDTO{
					OverlayType:  "ELECTRON_FLOW",
					CaptionLocal: "AR Overlay: Kutub (+) mempunyai keupayaan tinggi (+3.0V) dan kutub (-) mempunyai keupayaan rendah (0V).",
					VectorPaths: []domain.ARVectorPathDTO{
						{
							Label:          "Voltan +3.0V (Kutub +)",
							StartXNorm:     0.22,
							StartYNorm:     0.50,
							EndXNorm:       0.48,
							EndYNorm:       0.50,
							ColorHex:       "#FF5252",
							AnimationStyle: "PULSING_ARROW",
						},
					},
				},
				Checkable: true,
			},
			{
				StepNumber:                 2,
				Instruction:                "Sentuhkan hujung wayar ke permukaan tin aluminium yang telah digosok, dan sambungkan kaki panjang LED (Anod +) ke tin serta kaki pendek (Katod -) kembali ke kutub (-) bateri.",
				RequiresVisionVerification: true,
				VisionVerificationPrompt:   "Periksa sama ada litar lengkap melalui permukaan tin aluminium dan lampu LED menyala.",
				DefaultAROverlay: domain.AROverlaySimulationDTO{
					OverlayType:  "ELECTRON_FLOW",
					CaptionLocal: "Simulasi AR Aktif: Anak panah biru menunjukkan aliran elektron bebas melalui tin aluminium.",
					VectorPaths: []domain.ARVectorPathDTO{
						{
							Label:          "Aliran Elektron (e-)",
							StartXNorm:     0.18,
							StartYNorm:     0.62,
							EndXNorm:       0.52,
							EndYNorm:       0.38,
							ColorHex:       "#00E5FF",
							AnimationStyle: "FLOWING_PARTICLES",
						},
					},
				},
				Checkable: true,
			},
		},
		ReflectionQuestions: map[domain.RegionCode][]domain.ReflectionQuestionDTO{
			domain.RegionID: {
				{
					QuestionID:   "q-ohm-1",
					Prompt:       "Mengapa bagian luar kaleng minuman harus diamplas terlebih dahulu agar lampu LED dapat menyala?",
					Options:      []string{"Agar kaleng menjadi lebih ringan", "Untuk mengikis lapisan cat isolator sehingga logam aluminium konduktor terbuka", "Agar warna kaleng memantulkan cahaya", "Untuk menaikkan suhu kaleng"},
					CorrectIndex: 1,
					Explanation:  "Permukaan kaleng dilapisi cat/polimer yang bersifat isolator listrik. Mengamplasnya membuka logam aluminium murni yang memiliki elektron bebas untuk menghantarkan arus.",
				},
			},
			domain.RegionMY: {
				{
					QuestionID:   "q-ohm-1-my",
					Prompt:       "Mengapakah bahagian luar tin minuman perlu digosok terlebih dahulu supaya lampu LED dapat menyala?",
					Options:      []string{"Supaya tin menjadi lebih ringan", "Untuk menanggalkan lapisan cat penebat supaya logam aluminium konduktor terdedah", "Supaya warna tin memantulkan cahaya", "Untuk meningkatkan suhu tin"},
					CorrectIndex: 1,
					Explanation:  "Permukaan tin disaluti cat polimer yang bersifat penebat elektrik. Menggosoknya mendedahkan logam aluminium tulen yang mempunyai elektron bebas.",
				},
			},
		},
	})

	// Experiment 2: Fluid Pressure & Pneumatic Rocket (Demonstrates PVC Pipe -> Thick Straw / Cardboard Roll Functional Substitute!)
	varsFluidID := &domain.ScientificVariablesAndGraphSchemaDTO{
		FormulasLatex:       []string{`P_1 + \frac{1}{2}\rho v_1^2 = P_2 + \frac{1}{2}\rho v_2^2`, `A_1 v_1 = A_2 v_2`, `F = \Delta P \cdot A`},
		IndependentVariable: "Volume Tekanan Injeksi Udara Botol Pendorong (cm^3)",
		DependentVariable:   "Jarak Tempuh Horizontal Proyektil Kertas / Kecepatan Aliran (m)",
		ControlVariables:    []string{"Sudut elevasi peluncur (45 derajat)", "Diameter saluran konduktor udara", "Massa roket kertas"},
		XAxisLabel:          "Tekanan Kompresi Relatif (kPa)",
		YAxisLabel:          "Jarak Lontar Horizontal (m)",
		ExpectedTrend:       "LINEAR_PROPORTIONAL",
	}

	s.addExperiment(domain.ExperimentBlueprint{
		Slug:           "roket-tekanan-fluida-pipa-air",
		TitleID:        "Peluncur Roket Pneumatik: Hukum Bernoulli & Tekanan Udara Silindris",
		TitleMY:        "Pelancar Roket Pneumatik: Hukum Bernoulli & Tekanan Udara Silinder",
		SafetySeverity: domain.SeveritySafe,
		RequiredMaterials: []domain.ExperimentRequiredMaterial{
			{MaterialSlug: "plastic_bottle_pet_600ml", MinQuantity: 1, Unit: "pcs"},
			{MaterialSlug: "pvc_pipe_half_inch", MinQuantity: 1, Unit: "pcs"},
		},
		AdaptiveScaffolds: map[domain.AgeAdaptiveLevel]domain.AdaptiveLevelMetadata{
			domain.LevelSDElementary: {
				CurriculumBadgeID:   "Kurikulum Merdeka SD Fase B/C: Gaya Dorong Udara & Energi Gerak",
				CurriculumBadgeMY:   "KSSR Sains Tahun 4: Daya & Tekanan Udara",
				CompetencyCodeID:    "IPAS-SD-FASE-C-2.1",
				CompetencyCodeMY:    "KSSR-SN-T4-6.1",
				LearningObjectiveID: "Mengamati bagaimana udara di dalam botol plastik yang ditekan dapat melontarkan roket kertas melalui pipa/sedotan.",
				LearningObjectiveMY: "Memerhati bagaimana udara di dalam botol plastik yang ditekan dapat melancarkan roket kertas melalui paip/straw.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Udara menempati ruang dan menghasilkan gaya dorong saat ditekan.",
					Technology:  "Memanfaatkan barang bekas botol plastik sebagai pompa udara manual.",
					Engineering: "Mendesain sambungan kedap udara antara botol dan pipa/sedotan peluncur.",
					Mathematics: "Mengukur jarak terbang roket menggunakan penggaris atau ubin lantai.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Udara memenuhi ruang dan menghasilkan daya tolakan apabila ditekan.",
					Technology:  "Memanfaatkan botol plastik terpakai sebagai pam udara manual.",
					Engineering: "Merekabentuk sambungan kedap udara antara botol dan paip/straw pelancar.",
					Mathematics: "Mengukur jarak penerbangan roket menggunakan pembaris.",
				},
			},
			domain.LevelSMPLowerSec: {
				CurriculumBadgeID:   "Kurikulum Merdeka SMP Fase D: Tekanan Zat Gas & Hukum Pascal/Boyle",
				CurriculumBadgeMY:   "KSSM Sains Tingkatan 2: Tekanan Udara",
				CompetencyCodeID:    "IPA-SMP-FASE-D-3.4",
				CompetencyCodeMY:    "KSSM-SN-T2-8.2",
				LearningObjectiveID: "Menjelaskan hubungan penyempitan volume botol (P1*V1 = P2*V2) terhadap lonjakan tekanan udara pendorong.",
				LearningObjectiveMY: "Menjelaskan hubungan pengurangan isi padu botol (P1*V1 = P2*V2) terhadap peningkatan tekanan udara.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Saat volume botol diperkecil dengan cepat, tekanan udara di dalamnya meningkat sesuai Hukum Boyle.",
					Technology:  "Substitusi pipa PVC dengan sedotan plastik tebal atau gulungan karton berdasarkan prinsip konduksi fluida silindris.",
					Engineering: "Menentukan sudut kemiringan 45 derajat untuk jarak tempuh maksimum.",
					Mathematics: "Menghitung rata-rata jarak tempuh dari 3 kali percobaan.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Apabila isi padu botol dikurangkan dengan cepat, tekanan udara meningkat mengikut Hukum Boyle.",
					Technology:  "Penggantian paip PVC dengan straw plastik tebal berdasarkan prinsip aliran bendalir silinder.",
					Engineering: "Menentukan sudut kecondongan 45 darjah untuk jarak maksimum.",
					Mathematics: "Mengira purata jarak daripada 3 kali percubaan.",
				},
			},
			domain.LevelSMAUpperSec: {
				CurriculumBadgeID:   "Kurikulum Merdeka SMA Fase F: Mekanika Fluida Dinamis (Persamaan Kontinuitas & Bernoulli) + Gerak Parabola",
				CurriculumBadgeMY:   "KSSM Fizik Tingkatan 4/5: Prinsip Bernoulli, Keabadian Momentum & Gerakan Projektil",
				CompetencyCodeID:    "FIS-SMA-FASE-F-11.3",
				CompetencyCodeMY:    "KSSM-FIZ-T4-3.5",
				LearningObjectiveID: "Menghitung kecepatan semburan udara menggunakan Persamaan Kontinuitas (A1*v1 = A2*v2) dan menganalisis lintasan parabola proyektil.",
				LearningObjectiveMY: "Mengira halaju pancutan udara menggunakan Persamaan Keselanjaran (A1*v1 = A2*v2) dan menganalisis lintasan projektil.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Penyempitan penampang dari botol (A1) ke pipa/sedotan (A2) melipatgandakan laju aliran udara v2 = (A1/A2)*v1.",
					Technology:  "Visualisasi AR Vektor Tekanan Fluida dan Gaya Dorong (Thrust Vector) pada mulut peluncur.",
					Engineering: "Optimasi rasio diameter konduktor udara terhadap efisiensi impuls.",
					Mathematics: "Analisis persamaan jangkauan parabola X_max = (v0^2 * sin(2*theta)) / g.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Penyempitan keratan rentas daripada botol (A1) ke paip/straw (A2) menggandakan laju aliran udara v2 = (A1/A2)*v1.",
					Technology:  "Visualisasi AR Vektor Tekanan Bendalir dan Daya Tolakan pada muncung pelancar.",
					Engineering: "Pengoptimuman nisbah diameter konduktor udara terhadap kecekapan impuls.",
					Mathematics: "Analisis persamaan julat parabola X_max = (v0^2 * sin(2*theta)) / g.",
				},
				VariablesAndGraphID: varsFluidID,
				VariablesAndGraphMY: varsFluidID,
			},
			domain.LevelHigherEdUni: {
				CurriculumBadgeID:   "Standar DIKTI Mekanika Fluida & Termodinamika: Kompresi Adiabatik & Rugi Gesek Poiseuille",
				CurriculumBadgeMY:   "Universiti Mekanik Bendalir: Mampatan Adiabatik & Kehilangan Geseran Poiseuille",
				CompetencyCodeID:    "DIKTI-MEKF-202",
				CompetencyCodeMY:    "UNI-FLUID-202",
				LearningObjectiveID: "Mengevaluasi pengaruh rugi viskositas aliran di dalam pipa silindris (Hagen-Poiseuille) antara pipa PVC vs substitusi sedotan/karton.",
				LearningObjectiveMY: "Menilai kesan kehilangan kelikatan aliran di dalam tiub silinder (Hagen-Poiseuille) antara paip PVC vs straw/kadbod.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Proses ekspansi adiabatik cepat (P*V^gamma = konstan) dan bilangan Reynolds aliran turbulen di dalam tabung.",
					Technology:  "Pemetaan vektor kecepatan aksial melalui AR Coordinate Anchoring.",
					Engineering: "Perbandingan koefisien gesek dinding dalam (roughness) antara PVC, sedotan PP, dan karton berlapis.",
					Mathematics: "Pemodelan diferensial impuls F(t) dt = m * dv dan regresi polinomial.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Proses pengembangan adiabatik pantas (P*V^gamma = malar) dan nombor Reynolds aliran bergelora.",
					Technology:  "Pemetaan vektor halaju paksi melalui AR Coordinate Anchoring.",
					Engineering: "Perbandingan pekali geseran dinding dalam antara PVC, straw PP, dan kadbod bersalut.",
					Mathematics: "Pemodelan pembezaan impuls F(t) dt = m * dv dan regresi polinomial.",
				},
				VariablesAndGraphID: varsFluidID,
				VariablesAndGraphMY: varsFluidID,
			},
		},
		StepsID: []domain.ExperimentStepDTO{
			{
				StepNumber:                 1,
				Instruction:                "Pasangkan pipa PVC 1/2 inci (atau bahan substitusi: sedotan plastik tebal / gulungan karton yang dilapisi selotip) ke mulut botol plastik 600ml hingga kedap udara.",
				RequiresVisionVerification: true,
				VisionVerificationPrompt:   "Periksa apakah tabung peluncur (pipa PVC / sedotan tebal / gulungan karton) sudah terpasang rapat pada mulut botol plastik.",
				DefaultAROverlay: domain.AROverlaySimulationDTO{
					OverlayType:  "FLUID_PRESSURE",
					CaptionLocal: "Simulasi AR Tekanan Fluida: Penyempitan penampang dari badan botol (A1) ke tabung peluncur (A2) meningkatkan kecepatan aliran udara secara drastis!",
					VectorPaths: []domain.ARVectorPathDTO{
						{
							Label:          "Kompresi Tekanan Udara (Delta P)",
							StartXNorm:     0.30,
							StartYNorm:     0.65,
							EndXNorm:       0.55,
							EndYNorm:       0.45,
							ColorHex:       "#00E676",
							AnimationStyle: "PRESSURE_WAVE",
						},
						{
							Label:          "Vektor Kecepatan Semburan (v2 >> v1)",
							StartXNorm:     0.55,
							StartYNorm:     0.45,
							EndXNorm:       0.88,
							EndYNorm:       0.20,
							ColorHex:       "#FF9100",
							AnimationStyle: "PULSING_ARROW",
						},
					},
				},
				Checkable: true,
			},
		},
		StepsMY: []domain.ExperimentStepDTO{
			{
				StepNumber:                 1,
				Instruction:                "Pasangkan paip PVC 1/2 inci (atau bahan ganti: straw plastik tebal / gulungan kadbod) ke mulut botol plastik 600ml sehingga kedap udara.",
				RequiresVisionVerification: true,
				VisionVerificationPrompt:   "Periksa sama ada tiub pelancar telah dipasang rapat pada mulut botol plastik.",
				DefaultAROverlay: domain.AROverlaySimulationDTO{
					OverlayType:  "FLUID_PRESSURE",
					CaptionLocal: "Simulasi AR Tekanan Bendalir: Penyempitan keratan rentas daripada botol (A1) ke tiub (A2) meningkatkan halaju aliran udara!",
					VectorPaths: []domain.ARVectorPathDTO{
						{
							Label:          "Tekanan Mampatan Udara (Delta P)",
							StartXNorm:     0.30,
							StartYNorm:     0.65,
							EndXNorm:       0.55,
							EndYNorm:       0.45,
							ColorHex:       "#00E676",
							AnimationStyle: "PRESSURE_WAVE",
						},
					},
				},
				Checkable: true,
			},
		},
		ReflectionQuestions: map[domain.RegionCode][]domain.ReflectionQuestionDTO{
			domain.RegionID: {
				{
					QuestionID:   "q-fluid-1",
					Prompt:       "Mengapa sedotan plastik tebal atau gulungan karton dapat menggantikan pipa PVC dalam eksperimen peluncur roket udara ini?",
					Options:      []string{"Karena warnanya sama", "Karena memiliki fungsi fisika yang sama sebagai konduktor/saluran fluida silindris yang memfokuskan tekanan udara (Prinsip Kontinuitas & Bernoulli)", "Karena lebih berat dari besi", "Karena bereaksi kimia dengan plastik"},
					CorrectIndex: 1,
					Explanation:  "Berdasarkan persamaan kontinuitas (A1*v1 = A2*v2), tabung silindris kaku (baik pipa PVC, sedotan tebal, maupun gulungan karton kedap udara) sama-sama berfungsi menyalurkan dan mempercepat aliran fluida udara dari botol.",
				},
			},
			domain.RegionMY: {
				{
					QuestionID:   "q-fluid-1-my",
					Prompt:       "Mengapakah straw plastik tebal atau gulungan kadbod boleh menggantikan paip PVC dalam eksperimen ini?",
					Options:      []string{"Kerana warnanya sama", "Kerana mempunyai fungsi fizik yang sama sebagai saluran bendalir silinder yang memfokuskan tekanan udara", "Kerana lebih berat", "Kerana bertindak balas kimia"},
					CorrectIndex: 1,
					Explanation:  "Berdasarkan persamaan keselanjaran (A1*v1 = A2*v2), sebarang tiub silinder kedap udara berfungsi menyalurkan dan memecutkan aliran udara dari botol.",
				},
			},
		},
	})

	// Experiment 3: Acid-Base CO2 Gas Inflation (Vinegar + Baking Soda + Bottle + Balloon)
	varsChemID := &domain.ScientificVariablesAndGraphSchemaDTO{
		FormulasLatex:       []string{`\text{NaHCO}_3 + \text{CH}_3\text{COOH} \rightarrow \text{CH}_3\text{COONa} + \text{H}_2\text{O} + \text{CO}_2\uparrow`, `P V = n R T`},
		IndependentVariable: "Massa Natrium Bikarbonat / Soda Kue (gram)",
		DependentVariable:   "Volume / Keliling Balon Gas CO2 yang Terbentuk (cm)",
		ControlVariables:    []string{"Volume dan konsentrasi Cuka Dapur (50 mL)", "Ukuran botol reaksi 600ml", "Suhu lingkungan (T)"},
		XAxisLabel:          "Massa Soda Kue NaHCO3 (gram)",
		YAxisLabel:          "Keliling Balon Gas CO2 (cm)",
		ExpectedTrend:       "LINEAR_PROPORTIONAL",
	}

	s.addExperiment(domain.ExperimentBlueprint{
		Slug:           "reaksi-asam-basa-balon-soda-cuka",
		TitleID:        "Stoikiometri Gas CO2: Balon Mengembang Otomatis dengan Cuka & Soda Kue",
		TitleMY:        "Stoikiometri Gas CO2: Belon Mengembang Automatik dengan Cuka & Serbuk Penaik",
		SafetySeverity: domain.SeveritySafe,
		RequiredMaterials: []domain.ExperimentRequiredMaterial{
			{MaterialSlug: "plastic_bottle_pet_600ml", MinQuantity: 1, Unit: "pcs"},
			{MaterialSlug: "vinegar_kitchen", MinQuantity: 1, Unit: "bottle"},
			{MaterialSlug: "sodium_bicarbonate", MinQuantity: 1, Unit: "pack"},
			{MaterialSlug: "balloon_latex", MinQuantity: 1, Unit: "pcs"},
		},
		AdaptiveScaffolds: map[domain.AgeAdaptiveLevel]domain.AdaptiveLevelMetadata{
			domain.LevelSDElementary: {
				CurriculumBadgeID:   "Kurikulum Merdeka SD Fase C: Perubahan Wujud & Gas Ajaib dari Dapur",
				CurriculumBadgeMY:   "KSSR Sains Tahun 5: Jirim & Tindak Balas Bahan Dapur",
				CompetencyCodeID:    "IPAS-SD-FASE-C-1.4",
				CompetencyCodeMY:    "KSSR-SN-T5-8.1",
				LearningObjectiveID: "Mengamati terbentuknya gelembung gas karbon dioksida yang dapat meniup balon tanpa ditiup dengan mulut.",
				LearningObjectiveMY: "Memerhati pembentukan gelembung gas karbon dioksida yang dapat mengembangkan belon secara automatik.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Campuran cuka (asam) dan soda kue (basa) menghasilkan gelembung gas karbon dioksida (CO2).",
					Technology:  "Menggunakan balon karet elastis sebagai penangkap gas.",
					Engineering: "Memasang mulut balon secara rapat di leher botol agar gas tidak bocor.",
					Mathematics: "Menakar 2 sendok makan soda kue dan 5 sendok makan cuka.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Campuran cuka (asid) dan serbuk penaik (bes) menghasilkan gelembung gas karbon dioksida (CO2).",
					Technology:  "Menggunakan belon getah elastik sebagai perangkap gas.",
					Engineering: "Memasang mulut belon dengan rapat pada leher botol.",
					Mathematics: "Menyukat 2 sudu besar serbuk penaik dan 5 sudu besar cuka.",
				},
			},
			domain.LevelSMPLowerSec: {
				CurriculumBadgeID:   "Kurikulum Merdeka SMP Fase D: Reaksi Kimia Asam-Basa & Ciri Perubahan Kimia",
				CurriculumBadgeMY:   "KSSM Sains Tingkatan 2: Asid dan Alkali",
				CompetencyCodeID:    "IPA-SMP-FASE-D-5.2",
				CompetencyCodeMY:    "KSSM-SN-T2-6.1",
				LearningObjectiveID: "Mengidentifikasi pembentukan gas dan penurunan suhu (endotermik ringan) pada reaksi asam asetat dan natrium bikarbonat.",
				LearningObjectiveMY: "Mengenal pasti pembentukan gas pada tindak balas asid asetik dan natrium bikarbonat.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Reaksi kimia menghasilkan zat baru berupa gas CO2, air, dan garam natrium asetat.",
					Technology:  "Pemanfaatan botol PET bekas sebagai reaktor tertutup sederhana.",
					Engineering: "Teknik pencampuran tunda (soda kue dimasukkan ke dalam balon terlebih dahulu).",
					Mathematics: "Membandingkan ukuran diameter balon terhadap jumlah takaran soda kue.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Tindak balas kimia menghasilkan bahan baharu iaitu gas CO2, air, dan natrium asetat.",
					Technology:  "Penggunaan botol PET terpakai sebagai reaktor tertutup mudah.",
					Engineering: "Teknik pencampuran tertunda (serbuk penaik dimasukkan ke dalam belon dahulu).",
					Mathematics: "Membandingkan ukuran diameter belon terhadap jumlah sukatan serbuk penaik.",
				},
			},
			domain.LevelSMAUpperSec: {
				CurriculumBadgeID:   "Kurikulum Merdeka SMA Fase E/F: Stoikiometri Reaksi, Pereaksi Pembatas & Hukum Gas Ideal",
				CurriculumBadgeMY:   "KSSM Kimia Tingkatan 4/5: Stoikiometri,Bahan Tindak Balas Pengehad & Hukum Gas Unggul",
				CompetencyCodeID:    "KIM-SMA-FASE-F-11.1",
				CompetencyCodeMY:    "KSSM-KIM-T4-3.4",
				LearningObjectiveID: "Menghitung jumlah mol gas CO2 berdasarkan stoikiometri reaksi dan menentukan titik pereaksi pembatas (limiting reactant).",
				LearningObjectiveMY: "Mengira bilangan mol gas CO2 berdasarkan stoikiometri tindak balas dan menentukan bahan tindak balas pengehad.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Reaksi ekuimolar 1:1 antara NaHCO3 (Mr = 84 g/mol) dan CH3COOH (Mr = 60 g/mol) menghasilkan gas CO2.",
					Technology:  "Simulasi AR Overlay pergerakan molekul gas CO2 dan vektor tekanan membran balon.",
					Engineering: "Minimalisasi dead-volume pada reaktor botol 600ml.",
					Mathematics: "Menghitung volume gas ideal V = n*R*T/P dan memplot grafik massa NaHCO3 terhadap keliling balon.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Tindak balas 1:1 antara NaHCO3 (Mr = 84 g/mol) dan CH3COOH (Mr = 60 g/mol) menghasilkan gas CO2.",
					Technology:  "Simulasi AR Overlay pergerakan molekul gas CO2 dan vektor tekanan membran belon.",
					Engineering: "Meminimumkan ruang kosong pada reaktor botol 600ml.",
					Mathematics: "Mengira isi padu gas unggul V = n*R*T/P dan memplot graf jisim NaHCO3 melawan lilitan belon.",
				},
				VariablesAndGraphID: varsChemID,
				VariablesAndGraphMY: varsChemID,
			},
			domain.LevelHigherEdUni: {
				CurriculumBadgeID:   "Standar DIKTI Kimia Dasar I: Kinetika Pelepasan Gas, Elastisitas Non-Linier Membran & Hukum Gas Nyata",
				CurriculumBadgeMY:   "Universiti Kimia Fizikal: Kinetik Pembebasan Gas & Keanjalan Membran",
				CompetencyCodeID:    "DIKTI-KIM1-104",
				CompetencyCodeMY:    "UNI-CHEM1-104",
				LearningObjectiveID: "Menganalisis deviasi volume balon terhadap persamaan gas ideal akibat tegangan permukaan elastis karet lateks (Persamaan Mooney-Rivlin).",
				LearningObjectiveMY: "Menganalisis sisihan isi padu belon terhadap persamaan gas unggul akibat tegangan permukaan getah lateks.",
				STEMConceptsID: domain.STEMConceptsBreakdownDTO{
					Science:     "Kinetika reaksi orde semu dan keseimbangan tekanan internal balon P_in = P_atm + 2*gamma/r.",
					Technology:  "AR Overlay visualisasi tumbukan kinetik molekul CO2 terhadap dinding elastis.",
					Engineering: "Evaluasi efisiensi penangkapan gas dalam sistem tertutup.",
					Mathematics: "Analisis regresi dan penentuan titik jenuh stoikiometri saat asam asetat habis bereaksi.",
				},
				STEMConceptsMY: domain.STEMConceptsBreakdownDTO{
					Science:     "Kinetik tindak balas dan keseimbangan tekanan dalaman belon P_in = P_atm + 2*gamma/r.",
					Technology:  "AR Overlay visualisasi perlanggaran kinetik molekul CO2 terhadap dinding elastik.",
					Engineering: "Penilaian kecekapan pemerangkapan gas dalam sistem tertutup.",
					Mathematics: "Analisis regresi dan penentuan titik tepu stoikiometri apabila asid asetik habis bertindak balas.",
				},
				VariablesAndGraphID: varsChemID,
				VariablesAndGraphMY: varsChemID,
			},
		},
		StepsID: []domain.ExperimentStepDTO{
			{
				StepNumber:                 1,
				Instruction:                "Tuangkan 50 mL cuka dapur ke dalam botol plastik 600ml, masukkan 2 sendok teh soda kue ke dalam balon, lalu pasang mulut balon dengan rapat di leher botol.",
				RequiresVisionVerification: true,
				VisionVerificationPrompt:   "Periksa apakah mulut balon sudah terpasang rapat pada leher botol plastik berisi cuka.",
				DefaultAROverlay: domain.AROverlaySimulationDTO{
					OverlayType:  "MOLECULAR_REACTION",
					CaptionLocal: "Simulasi AR Reaksi Molekul: Ion H+ dari cuka bereaksi dengan HCO3- dari soda kue melepaskan molekul gas CO2 ke atas menuju balon!",
					VectorPaths: []domain.ARVectorPathDTO{
						{
							Label:          "Pelepasan Gas CO2 (Naik ke Balon)",
							StartXNorm:     0.50,
							StartYNorm:     0.72,
							EndXNorm:       0.50,
							EndYNorm:       0.25,
							ColorHex:       "#00E5FF",
							AnimationStyle: "FLOWING_PARTICLES",
						},
					},
				},
				Checkable: true,
			},
		},
		StepsMY: []domain.ExperimentStepDTO{
			{
				StepNumber:                 1,
				Instruction:                "Tuangkan 50 mL cuka makan ke dalam botol plastik 600ml, masukkan 2 sudu teh serbuk penaik ke dalam belon, dan pasangkan mulut belon dengan rapat pada leher botol.",
				RequiresVisionVerification: true,
				VisionVerificationPrompt:   "Periksa sama ada mulut belon telah dipasang rapat pada leher botol plastik berisi cuka.",
				DefaultAROverlay: domain.AROverlaySimulationDTO{
					OverlayType:  "MOLECULAR_REACTION",
					CaptionLocal: "Simulasi AR Tindak Balas Molekul: Gas CO2 terbebas ke atas mengembangkan belon!",
					VectorPaths: []domain.ARVectorPathDTO{
						{
							Label:          "Pembebasan Gas CO2",
							StartXNorm:     0.50,
							StartYNorm:     0.72,
							EndXNorm:       0.50,
							EndYNorm:       0.25,
							ColorHex:       "#00E5FF",
							AnimationStyle: "FLOWING_PARTICLES",
						},
					},
				},
				Checkable: true,
			},
		},
		ReflectionQuestions: map[domain.RegionCode][]domain.ReflectionQuestionDTO{
			domain.RegionID: {
				{
					QuestionID:   "q-chem-1",
					Prompt:       "Gas apakah yang dihasilkan dari reaksi antara cuka dapur (asam asetat) dan soda kue (natrium bikarbonat) sehingga membuat balon mengembang?",
					Options:      []string{"Oksigen (O2)", "Karbon Dioksida (CO2)", "Nitrogen (N2)", "Helium (He)"},
					CorrectIndex: 1,
					Explanation:  "Reaksi asam asetat (CH3COOH) dan natrium bikarbonat (NaHCO3) menghasilkan natrium asetat, air (H2O), dan gas karbon dioksida (CO2).",
				},
			},
			domain.RegionMY: {
				{
					QuestionID:   "q-chem-1-my",
					Prompt:       "Apakah gas yang terhasil daripada tindak balas antara cuka makan dan serbuk penaik sehingga mengembangkan belon?",
					Options:      []string{"Oksigen (O2)", "Karbon Dioksida (CO2)", "Nitrogen (N2)", "Helium (He)"},
					CorrectIndex: 1,
					Explanation:  "Tindak balas asid asetik dan natrium bikarbonat menghasilkan gas karbon dioksida (CO2).",
				},
			},
		},
	})
}

func (s *SeededStore) GetMaterialBySlug(_ context.Context, slug string) (domain.CanonicalMaterial, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	m, ok := s.materials[slug]
	return m, ok
}

func (s *SeededStore) ListAllMaterials(_ context.Context) []domain.CanonicalMaterial {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.CanonicalMaterial, 0, len(s.materialOrder))
	for _, slug := range s.materialOrder {
		out = append(out, s.materials[slug])
	}
	return out
}

func (s *SeededStore) GetFunctionalSubstitutesForMissing(_ context.Context, missingSlug string) []domain.FunctionalSubstituteRule {
	s.mu.RLock()
	defer s.mu.RUnlock()
	rules := s.substitutes[missingSlug]
	out := make([]domain.FunctionalSubstituteRule, len(rules))
	copy(out, rules)
	return out
}

func (s *SeededStore) ListSafetyHazardRules(_ context.Context) []domain.SafetyHazardRule {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.SafetyHazardRule, len(s.hazardRules))
	copy(out, s.hazardRules)
	return out
}

func (s *SeededStore) GetExperimentBySlug(_ context.Context, slug string) (domain.ExperimentBlueprint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	exp, ok := s.experiments[slug]
	return exp, ok
}

func (s *SeededStore) ListAllExperiments(_ context.Context) []domain.ExperimentBlueprint {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.ExperimentBlueprint, 0, len(s.experimentOrder))
	for _, slug := range s.experimentOrder {
		out = append(out, s.experiments[slug])
	}
	return out
}

func (s *SeededStore) SaveUserInventory(_ context.Context, userID string, items []domain.InventoryItemInput) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	copied := make([]domain.InventoryItemInput, len(items))
	copy(copied, items)
	s.userInventories[userID] = copied
	return nil
}

func (s *SeededStore) GetUserInventory(_ context.Context, userID string) ([]domain.InventoryItemInput, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := s.userInventories[userID]
	copied := make([]domain.InventoryItemInput, len(items))
	copy(copied, items)
	return copied, nil
}

func (s *SeededStore) SaveStepVerification(_ context.Context, userID, experimentSlug string, resp domain.StepVisionVerifyResponse) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	key := userID + ":" + experimentSlug
	s.stepVerifications[key] = append(s.stepVerifications[key], resp)
	return nil
}

func (s *SeededStore) SaveLabReport(_ context.Context, _ string, _ string, _ domain.LabReportGenerateRequest, resp domain.LabReportGenerateResponse) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.labReports[resp.ReportID] = resp
	return nil
}

func (s *SeededStore) RecordOfflineCompletionIdempotent(_ context.Context, userID string, item domain.OfflineCompletionItemInput, xpAwarded int) (alreadySynced bool, totalUserXP int, totalSyncedCount int, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	userMap, exists := s.syncedMutations[userID]
	if !exists {
		userMap = make(map[string]int)
		s.syncedMutations[userID] = userMap
	}

	if _, seen := userMap[item.ClientMutationID]; seen {
		alreadySynced = true
	} else {
		userMap[item.ClientMutationID] = xpAwarded
	}

	for _, xp := range userMap {
		totalUserXP += xp
		totalSyncedCount++
	}
	return alreadySynced, totalUserXP, totalSyncedCount, nil
}
