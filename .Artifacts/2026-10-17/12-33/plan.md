req:
Make the UI in English across apps/web. Translate all user-facing interface text (headers, tabs, buttons, forms, tooltips, guidance prompts, hazard banners, and PDF report labels) into English while preserving the underlying curriculum datasets, country flags (ID / MY), math/LaTeX formulas, and zero-breaking test compatibility.

initial_plan:
1. Translate `apps/web/src/app/layout.tsx`:
   - Set `<html lang="en">`
   - Translate metadata title and description into concise English.
2. Translate `apps/web/src/app/page.tsx`:
   - Header title: "RekaSains — Engineering Science from Household Resources"
   - Tagline: "AI-Native STEM Lab, Physical-to-Digital Inventory Mapping, Interactive Vision/AR Step Guidance & Automated Academic Lab Report PDF Generator"
   - Country buttons: "🇮🇩 Indonesia (Kurikulum Merdeka • Rp)" and "🇲🇾 Malaysia (KSSR / KSSM • RM)"
   - Role switcher button: "👤 Role: Student / University" / "👤 Role: Teacher / Lecturer"
   - Mode switcher button: "📡 Offline Mode (IndexedDB)" / "🌐 Online Mode (ADK Live)"
3. Translate `apps/web/src/components/WorkspaceScannerAndHazardBanner.tsx`:
   - Section heading: "1. Camera Inventory Mapping & Active Co-Location Hazard Detection"
   - Subtitle: "Photograph your workbench or recyclable materials. The system automatically detects item quantities without manual typing and triggers a Red Alert immediately if hazardous chemical combinations share the same space."
   - Camera upload/capture button: "📷 Capture / Upload Workbench Photo"
   - Simulation buttons: "⚡ Demo Safe Workbench Scan" and "🚨 Active Hazard Test (Bleach + Acid Cleaner)"
   - Hazard banner: "🚨 ACTIVE WORKSPACE HAZARD DETECTED", severity badge, "🛡️ Isolate Hazardous Chemicals from Workbench Now"
   - Inventory table headers: "Material / Apparatus (Local)", "Category", "Quantity", "AI Confidence", "Adjust Quantity"
   - Confirmation footer and button: "Review item quantities detected by camera before confirming inventory." and "✅ Confirm Physical Inventory"
4. Translate `apps/web/src/components/ThreeTierRecommendationExplorer.tsx`:
   - Section heading: "2. 3-Tier Experiment Recommendations, Functional Substitutes & Local Stores"
   - Tabs: "🟢 Tier 1: 100% Ready", "🛠️ Tier 2: Functional / DIY Substitutes", "🛒 Tier 3: Local Stores (Warung / MR.DIY)"
   - Card button: "✓ Active Module" / "Open Module & AR Lab →"
   - Functional substitute panel: "🔄 Alternative Material Recommendation — Similar Physics/Chemistry Function (USP #3)", labels "Missing Material:", "Substituted With:", "Equivalent Scientific Principle:"
   - Local shop guide panel: "🛒 Local Low-Cost Store Purchasing Guide (USP #4)", labels "Recommended Store:", "📍 Find on Google Maps", "🛍️ Buy on Marketplace"
5. Translate `apps/web/src/components/AdaptiveSTEMModuleAndARLab.tsx`:
   - AGE_LEVEL_LABELS:
     - SD_ELEMENTARY: "🎒 Elementary School (Visual Phenomena & Qualitative)"
     - SMP_LOWER_SEC: "🔬 Junior High / Lower Secondary (Concepts & Causality)"
     - SMA_UPPER_SEC: "📐 Senior High / Upper Secondary (LaTeX Formulas & Analytical Graph)"
     - HIGHER_ED_UNI: "🎓 Higher Education / University (Regression & Error Analysis)"
   - Subheading: "Select Difficulty Level & Adaptive Scientific Depth (USP #5):"
   - Offline lab pack badge: "📦 OfflineLabPack v{version} Cached in IndexedDB"
   - STEM Concepts headers: "🔬 SCIENCE", "💻 TECHNOLOGY", "⚙️ ENGINEERING", "📐 MATHEMATICS"
   - Step guidance header: "📸 Step-by-Step Guidance & AI Vision Step Checker (USP #8)", "Step X / Y"
   - Step buttons: "Step 1", "Step 2", etc.
   - Vision prompt label: "🎯 AI Camera Verification Criteria:"
   - Action buttons: "📷 Verify This Step with AI Camera", "✓ Offline Self-Checkpoint / Manual Mode"
   - Verification status: "✅ AI Vision Confidence:", "✓ Step X confirmed via Hybrid Offline Checkpoint."
   - AR Overlay card: "🕶️ Augmented Reality (AR) Overlay Simulation on Physical Objects (USP #9)"
   - Simulated workbench object labels in SVG: "AA Battery 1.5V", "(-) Negative | Positive (+)", "Aluminum Can", "Stripped Conductor"
   - Scientific variables header: "📊 Physics Formulas (LaTeX), Scientific Variables & Analytical Graph (Senior High / University)"
   - Variable labels: "Independent Variable (X):", "Dependent Variable (Y):", "Controlled Variables:"
   - Observation table header: "📋 Multi-Trial Observation Data Table", "+ Add Trial"
   - Table columns: "Trial", X Label, Y Label, "Notes"
   - Analytical graph title: "📈 Automated OLS Linear Regression Graph"
   - Reflection questions header: "🧠 STEM Concept Discussion & Reflection Questions (USP #6)", "Explanation:"
6. Translate `apps/web/src/components/AcademicLabReportPDFGenerator.tsx`:
   - Section heading: '4. Automated Academic "Lab Report Generator" (PDF Format) & Offline Badge Claims'
   - Subtitle: "Automatically synthesize an official laboratory report (Title, Objective, Theory/Formulas, Apparatus & Materials, Procedures, Results/Graphs, Scientific Discussion & Conclusion) ready for teacher or lecturer submission."
   - Action buttons: "📄 Synthesize Lab Report (AI)", "🏅 Sync Progress & Claim Badges"
   - Form field labels: "Student Full Name", "School / University Institution", "Class / Student ID", "Instructor / Advisor Name"
   - Preview card header: "✏️ Academic Lab Report Preview (Editable Before PDF Export)"
   - Print button: "🖨️ Download / Print Official PDF Lab Report"
   - Textarea field labels: "1. Experiment Objective:", "2. Scientific Analysis Discussion (AI Synthesized + Editable):", "3. Conclusion:"
   - Badge notification: "🎉 Idempotent Sync Successful (client_mutation_id Verified)", "Total XP: +{totalXp} XP"
7. Translate `apps/web/src/lib/ar-and-pdf-engine.ts`:
   - Offline fallback report text and printable PDF HTML section headers:
     - Header badges: "HIGHER EDUCATION / UNIVERSITY ACADEMIC LABORATORY REPORT", "SECONDARY SCHOOL ACADEMIC LABORATORY REPORT"
     - Metadata table labels: "Student Name", "Institution / School", "Class / Student ID", "Advisor / Instructor"
     - Section headings: "1. Objective", "2. Theoretical Background, Formulas & Variables", "3. Apparatus, Materials & Functional Substitutes", "4. Work Procedure Verified by AI Vision", "5. Observation Data Table & Analytical Graph", "6. Scientific Analysis Discussion", "7. Conclusion"
     - Footer note: "Printed via RekaSains AI-Native STEM Lab on ..."

revision:
During Gate 3 self-correction and test audit:
- Check 1: In `apps/web/tests/web-engine.test.mjs`, tests assert that:
  - `buildAcademicLabReportPrintableHTML` and `computeAnalyticalGraphSeries` exist in `ar-and-pdf-engine.ts`.
  - Specific tokens like `HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER`, `CRITICAL_CO_LOCATION_WARNING`, `pvc_pipe_half_inch`, `thick_plastic_straw`, and `AgeAdaptiveLevelEnum` strings exist in `api-client.ts`.
- Check 2: Keep localized item titles or descriptions from the API models intact (e.g. `card.title_local`, `item.name_local`) because they represent real items and curriculum modules in Indonesia and Malaysia, while making the wrapper UI labels, prompts, navigation, headers, and actions completely in English.
- Check 3: For dual-region support, when `region === 'MY'`, localized currency is `RM` and regional curriculum names (KSSR/KSSM) remain accurate, but UI labels stay in clear English.
- Check 4: Preserve all SVG markers and accessibility tags.

final_plan:
Execute the localized changes across the 7 files in `apps/web/src/`. Run `make test` to ensure 100% pass rate. Build audit results in `.Artifacts/2026-10-17/12-33/result.md`. Sync docs and AGENTS.md, then commit and push to `origin/main`.
