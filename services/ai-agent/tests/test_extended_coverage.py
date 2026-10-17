"""
Extended Edge Case, Multi-Region & All-USP Integration Test Suite for RekaSains Google ADK AI-Agent.
Tests:
- USP #1 & #7: Active Co-Location Hazards for ID & MY (Malay localization, critical alerts)
- USP #2, #3 & #4: 3-Tier Matcher, Functional Substitutes & Zero-Float Currency (IDR & MYR_SEN)
- USP #5 & #6: 4-Level Scaffolding (SD Elementary vs Higher Ed Uni) & Dual-Curriculum (Kurikulum Merdeka & KSSR/KSSM)
- USP #8 & #9: Step Vision Verification, Normalized Coordinates [0.0, 1.0] & AR Overlay Projections
- USP #10: Academic Lab Report Generation with Experimental Tables & Zero-RabbitMQ SSE Stream
"""

from __future__ import annotations

import base64
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestRekaSainsExtendedCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = client

    # 1. USP #1 & #7: Malaysian Region Co-Location Hazard Detection & Localized Warnings
    def test_malaysia_region_hazard_alert_localization(self) -> None:
        payload_b64 = base64.b64encode(
            b"bahan peluntur cecair sodium_hypochlorite dan pembersih lantai berasid floor_cleaner_acidic"
        ).decode()
        resp = self.client.post(
            "/ai/v1/inventory/scan",
            json={"image_base64": payload_b64, "mime_type": "image/jpeg", "region": "MY"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["region"], "MY")
        self.assertGreaterEqual(len(data["active_workspace_hazards"]), 1)
        hazard = data["active_workspace_hazards"][0]
        self.assertEqual(hazard["severity"], "CRITICAL_CO_LOCATION_WARNING")
        # Ensure warning is in Bahasa Melayu for Malaysia region
        self.assertIn("gas klorin", hazard["message_local"].lower())

    # 2. USP #2, #3 & #4: Malaysian Currency Formatting & Kedai Runcit Deep-Links
    def test_malaysia_three_tier_matcher_and_currency(self) -> None:
        payload = {
            "region": "MY",
            "curriculum_code": "MY_KSSM",
            "age_adaptive_level": "SMA_UPPER_SEC",
            "grade_level": "TINGKATAN_4",
            "user_role": "STUDENT",
            "inventory_items": [
                {"material_slug": "plastic_bottle_pet_600ml", "quantity": 1, "unit": "pcs"},
                {"material_slug": "thick_plastic_straw", "quantity": 2, "unit": "pcs"},
                {"material_slug": "balloon_latex", "quantity": 1, "unit": "pcs"},
                {"material_slug": "battery_aa_1_5v", "quantity": 2, "unit": "pcs"},
                {"material_slug": "aluminum_can_recycled", "quantity": 1, "unit": "pcs"},
            ],
        }
        resp = self.client.post("/ai/v1/recommendations/match", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["region"], "MY")
        
        # Check DIY substitute mapping (pvc_pipe_half_inch substituted by thick_plastic_straw)
        diy_matches = data["diy_substitute_matches"]
        self.assertGreaterEqual(len(diy_matches), 1)
        roket_cards = [c for c in diy_matches if c["experiment_slug"] == "roket-pneumatik-bernoulli-pipa-botol"]
        self.assertGreaterEqual(len(roket_cards), 1)
        diy_item = roket_cards[0]
        self.assertGreaterEqual(len(diy_item["functional_substitutes"]), 1)
        sub = diy_item["functional_substitutes"][0]
        self.assertEqual(sub["missing_material_slug"], "pvc_pipe_half_inch")
        self.assertEqual(sub["substitute_material_slug"], "thick_plastic_straw")
        self.assertIn("Bernoulli", sub["shared_scientific_principle"])

        # Check local shop recommendations have RM prices and Google Maps URLs
        shop_matches = data["local_micro_shop_matches"]
        self.assertGreaterEqual(len(shop_matches), 1)
        for match in shop_matches:
            for shop_item in match["missing_local_shop_items"]:
                self.assertEqual(shop_item["currency"], "MYR_SEN")
                self.assertIn("RM", shop_item["display_price"])
                self.assertIn("https://www.google.com/maps/search/?api=1", shop_item["maps_search_url"])

    # 3. USP #5: Age-Adaptive Scaffolding Contrast (SD Elementary vs Higher Ed Uni)
    def test_scaffolding_sd_elementary_vs_higher_ed(self) -> None:
        # Elementary level: must emphasize qualitative observations, not differential calculus
        resp_sd = self.client.post(
            "/ai/v1/experiments/rangkaian-listrik-baterai-kaleng-ar/scaffold",
            json={
                "region": "ID",
                "curriculum_code": "ID_KURIKULUM_MERDEKA",
                "age_adaptive_level": "SD_ELEMENTARY",
                "grade_level": "SD_FASE_C",
                "user_role": "STUDENT",
            },
        )
        self.assertEqual(resp_sd.status_code, 200)
        data_sd = resp_sd.json()
        self.assertEqual(data_sd["age_adaptive_level"], "SD_ELEMENTARY")
        # In elementary, variables and graph schemas are simplified
        vars_sd = data_sd.get("scientific_variables_and_graph")
        if vars_sd:
            formulas = " ".join(vars_sd.get("formulas_latex", []))
            self.assertNotIn("\\frac{d", formulas)

        # Higher Ed level: must contain rigorous scientific variables, LaTeX formula and analytical graph
        resp_uni = self.client.post(
            "/ai/v1/experiments/rangkaian-listrik-baterai-kaleng-ar/scaffold",
            json={
                "region": "ID",
                "curriculum_code": "ID_DIKTI_HIGHER_ED",
                "age_adaptive_level": "HIGHER_ED_UNI",
                "grade_level": "UNIVERSITAS_SEM_2",
                "user_role": "STUDENT",
            },
        )
        self.assertEqual(resp_uni.status_code, 200)
        data_uni = resp_uni.json()
        self.assertEqual(data_uni["age_adaptive_level"], "HIGHER_ED_UNI")
        vars_uni = data_uni["scientific_variables_and_graph"]
        self.assertIsNotNone(vars_uni)
        formulas_uni = " ".join(vars_uni["formulas_latex"])
        self.assertIn("V_{\\text{terminal}}", formulas_uni)
        self.assertEqual(vars_uni["expected_trend"], "LINEAR_PROPORTIONAL")

    # 4. USP #8 & #9: Step Vision Verification & Normalized AR Coordinates
    def test_step_vision_verification_and_ar_coordinates(self) -> None:
        resp = self.client.post(
            "/ai/v1/experiments/rangkaian-listrik-baterai-kaleng-ar/steps/1/verify-vision",
            json={
                "image_base64": base64.b64encode(b"step 1 photo").decode(),
                "mime_type": "image/jpeg",
                "region": "ID",
                "age_adaptive_level": "SMA_UPPER_SEC",
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("is_verified_correct", data)
        self.assertIn("ar_overlay_simulation", data)
        ar = data["ar_overlay_simulation"]
        
        # Verify all coordinates in vector paths are normalized in [0.0, 1.0]
        for path in ar["vector_paths"]:
            self.assertGreaterEqual(path["start_x_norm"], 0.0)
            self.assertLessEqual(path["start_x_norm"], 1.0)
            self.assertGreaterEqual(path["start_y_norm"], 0.0)
            self.assertLessEqual(path["start_y_norm"], 1.0)
            self.assertGreaterEqual(path["end_x_norm"], 0.0)
            self.assertLessEqual(path["end_x_norm"], 1.0)
            self.assertGreaterEqual(path["end_y_norm"], 0.0)
            self.assertLessEqual(path["end_y_norm"], 1.0)

    # 5. USP #10: Academic Lab Report PDF Synthesis with Analytical Data Rows
    def test_academic_lab_report_synthesis(self) -> None:
        payload = {
            "region": "MY",
            "age_adaptive_level": "SMA_UPPER_SEC",
            "student_name": "Siti Nurhaliza",
            "institution_name": "SMK Sultan Ismail Johor Bahru",
            "class_or_nim": "Tingkatan 5 Sains 1",
            "result_photo_base64": base64.b64encode(b"litar lengkap berfungsi").decode(),
            "observation_data_rows": [
                {"trial_number": 1, "x_value": 1.5, "y_value": 15.0, "notes": "1 Sel Kering"},
                {"trial_number": 2, "x_value": 3.0, "y_value": 30.0, "notes": "2 Sel Kering Bersiri"},
                {"trial_number": 3, "x_value": 4.5, "y_value": 45.0, "notes": "3 Sel Kering Bersiri"},
            ],
            "reflection_answers": ["Kecerahan mentol berkadar terus dengan beza keupayaan."],
        }
        resp = self.client.post(
            "/ai/v1/experiments/rangkaian-listrik-baterai-kaleng-ar/lab-report/generate",
            json=payload,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("report_id", data)
        self.assertIn("Laporan", data["title_local"])
        self.assertIn("siti nurhaliza", data["result_analysis_discussion"].lower())

    # 6. Zero-RabbitMQ Directive: Event Stream Endpoint Verification
    def test_zero_rabbitmq_event_stream_endpoint(self) -> None:
        resp = self.client.get("/ai/v1/events/stream")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("content-type"), "text/event-stream; charset=utf-8")


if __name__ == "__main__":
    unittest.main()
