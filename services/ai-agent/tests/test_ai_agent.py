"""
Comprehensive Unit & Integration Test Suite for RekaSains Google ADK AI-Agent Service.
Tests all 6 Google ADK Sub-Agents, OpenAPI v1.1.0 endpoints (`/inventory/scan`,
`/recommendations/match`, `/experiments/{slug}/scaffold`,
`/experiments/{slug}/steps/{step_number}/verify-vision`, `/experiments/{slug}/lab-report/generate`),
and Core-API Gateway Compatibility endpoints (`/vision/scan`, `/curriculum/scaffold/{slug}`,
`/vision/verify-step`, `/lab-report/synthesize`).
"""

from __future__ import annotations

import base64
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from app.domain.models import validate_normalized_coordinate
from app.main import app

client = TestClient(app)


def test_health_check() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "rekasains-ai-agent"


def test_vision_scan_workspace() -> None:
    payload = {
        "image_base64": "sample_workspace_image_base64_data",
        "mime_type": "image/jpeg",
        "region": "ID",
    }
    resp = client.post("/ai/v1/vision/scan", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "scan_id" in data
    assert "detected_items" in data
    assert len(data["detected_items"]) > 0
    assert "active_workspace_hazards" in data


def test_recommendation_matcher_and_substitutes() -> None:
    payload = {
        "region": "ID",
        "curriculum_code": "ID_KURIKULUM_MERDEKA",
        "age_adaptive_level": "SMA_UPPER_SEC",
        "grade_level": "SMA_FASE_E",
        "user_role": "STUDENT",
        "inventory_items": [
            {"material_slug": "plastic_bottle_pet_600ml", "quantity": 1, "unit": "pcs"},
            {"material_slug": "thick_plastic_straw", "quantity": 2, "unit": "pcs"},
        ],
    }
    resp = client.post("/ai/v1/recommendations/match", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "diy_substitute_matches" in data
    assert "local_micro_shop_matches" in data


def test_curriculum_scaffold() -> None:
    payload = {
        "region": "ID",
        "curriculum_code": "ID_KURIKULUM_MERDEKA",
        "age_adaptive_level": "SMA_UPPER_SEC",
        "grade_level": "SMA_FASE_E",
        "user_role": "STUDENT",
    }
    resp = client.post("/ai/v1/curriculum/scaffold/rangkaian-listrik-baterai-kaleng-ar", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["experiment_slug"] == "rangkaian-listrik-baterai-kaleng-ar"
    assert "scientific_variables_and_graph" in data
    assert len(data["steps"]) > 0


def test_step_vision_verify() -> None:
    payload = {
        "experiment_slug": "rangkaian-listrik-baterai-kaleng-ar",
        "step_number": 1,
        "vision_verification_prompt": "Periksa sambungan kabel ke kutub positif baterai",
        "image_base64": "sample_step_photo",
        "mime_type": "image/jpeg",
        "region": "ID",
        "age_adaptive_level": "SMA_UPPER_SEC",
    }
    resp = client.post("/ai/v1/vision/verify-step", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["step_number"] == 1
    assert "is_verified_correct" in data
    assert "ar_overlay_simulation" in data


def test_lab_report_synthesis() -> None:
    payload = {
        "experiment_slug": "rangkaian-listrik-baterai-kaleng-ar",
        "region": "ID",
        "age_adaptive_level": "SMA_UPPER_SEC",
        "student_name": "Budi Santoso",
        "institution_name": "SMAN 1 Bandung",
        "class_or_nim": "XI MIPA 2",
        "result_photo_base64": "sample_result_photo",
        "observation_data_rows": [
            {"trial_number": 1, "x_value": 1.5, "y_value": 12.0, "notes": "Nyala redup"},
            {"trial_number": 2, "x_value": 3.0, "y_value": 24.0, "notes": "Nyala terang"},
        ],
        "reflection_answers": ["Kaleng minuman aluminium menghantarkan elektron."],
    }
    resp = client.post("/ai/v1/lab-report/synthesize", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "report_id" in data
    assert "title_local" in data
    assert "result_analysis_discussion" in data


class TestRekaSainsAIAgentService(unittest.TestCase):
    def test_01_health_and_6_agent_manifest(self) -> None:
        test_health_check()
        res_manifest = client.get("/ai/v1/agents/manifest")
        self.assertEqual(res_manifest.status_code, 200)
        manifest = res_manifest.json()
        self.assertEqual(manifest["framework"], "google-adk")
        self.assertEqual(manifest["broker_mode"], "ZERO_RABBITMQ_DIRECT_REST_AND_SSE")
        self.assertEqual(len(manifest["sub_agents"]), 6)

    def test_02_vision_scan_and_proactive_co_location_hazard_recall(self) -> None:
        test_vision_scan_workspace()
        hazard_b64 = base64.b64encode(
            b"workspace with sodium_hypochlorite pemutih and floor_cleaner_acidic pembersih lantai"
        ).decode()
        res_haz = client.post(
            "/ai/v1/inventory/scan",
            json={"image_base64": hazard_b64, "mime_type": "image/jpeg", "region": "ID"},
        )
        self.assertEqual(res_haz.status_code, 200)
        data_haz = res_haz.json()
        self.assertGreaterEqual(len(data_haz["active_workspace_hazards"]), 1)
        alert = data_haz["active_workspace_hazards"][0]
        self.assertEqual(alert["rule_code"], "HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER")
        self.assertEqual(alert["severity"], "CRITICAL_CO_LOCATION_WARNING")

    def test_03_three_tier_matcher_and_functional_substitute_recommender(self) -> None:
        test_recommendation_matcher_and_substitutes()
        payload = {
            "region": "ID",
            "curriculum_code": "ID_KURIKULUM_MERDEKA",
            "age_adaptive_level": "SMA_UPPER_SEC",
            "grade_level": "SMA_FASE_E",
            "user_role": "STUDENT",
            "inventory_items": [
                {"material_slug": "battery_aa_1_5v", "quantity": 2, "unit": "pcs"},
                {"material_slug": "copper_wire_jumper", "quantity": 2, "unit": "pcs"},
                {"material_slug": "aluminum_can_recycled", "quantity": 1, "unit": "pcs"},
                {"material_slug": "led_diode_5mm", "quantity": 1, "unit": "pcs"},
                {"material_slug": "plastic_bottle_pet_600ml", "quantity": 2, "unit": "pcs"},
                {"material_slug": "balloon_latex", "quantity": 1, "unit": "pcs"},
                {"material_slug": "thick_plastic_straw", "quantity": 2, "unit": "pcs"},
            ],
        }
        res = client.post("/ai/v1/recommendations/match", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        strict_slugs = [c["experiment_slug"] for c in body["strict_100_matches"]]
        self.assertIn("rangkaian-listrik-baterai-kaleng-ar", strict_slugs)
        diy_cards = {c["experiment_slug"]: c for c in body["diy_substitute_matches"]}
        self.assertIn("roket-pneumatik-bernoulli-pipa-botol", diy_cards)
        sub = diy_cards["roket-pneumatik-bernoulli-pipa-botol"]["functional_substitutes"][0]
        self.assertEqual(sub["missing_material_slug"], "pvc_pipe_half_inch")
        self.assertEqual(sub["substitute_material_slug"], "thick_plastic_straw")

    def test_04_four_level_age_adaptive_scaffolder_and_safety_422(self) -> None:
        test_curriculum_scaffold()
        res_uni = client.post(
            "/ai/v1/experiments/rangkaian-listrik-baterai-kaleng-ar/scaffold",
            json={
                "region": "ID",
                "curriculum_code": "ID_DIKTI_HIGHER_ED",
                "age_adaptive_level": "HIGHER_ED_UNI",
                "grade_level": "UNIVERSITAS_SEM_2",
                "user_role": "STUDENT",
            },
        )
        self.assertEqual(res_uni.status_code, 200)
        self.assertIsNotNone(res_uni.json()["scientific_variables_and_graph"])

        res_blocked = client.post(
            "/ai/v1/experiments/rangkaian-listrik-baterai-kaleng-ar/scaffold",
            json={
                "region": "ID",
                "curriculum_code": "ID_KURIKULUM_MERDEKA",
                "age_adaptive_level": "SMA_UPPER_SEC",
                "grade_level": "SMA_FASE_E",
                "user_role": "STUDENT",
                "inventory_items": [
                    {"material_slug": "sodium_hypochlorite", "quantity": 1, "unit": "bottle"},
                    {"material_slug": "vinegar_kitchen", "quantity": 1, "unit": "bottle"},
                ],
            },
        )
        self.assertEqual(res_blocked.status_code, 422)

    def test_05_step_vision_checker_and_normalized_ar_coordinates(self) -> None:
        test_step_vision_verify()
        ok_b64 = base64.b64encode(b"step 2 connected properly").decode()
        res_ok = client.post(
            "/ai/v1/experiments/rangkaian-listrik-baterai-kaleng-ar/steps/2/verify-vision",
            json={
                "image_base64": ok_b64,
                "mime_type": "image/jpeg",
                "region": "ID",
                "age_adaptive_level": "SMA_UPPER_SEC",
            },
        )
        self.assertEqual(res_ok.status_code, 200)
        self.assertTrue(res_ok.json()["is_verified_correct"])
        with self.assertRaises(ValueError):
            validate_normalized_coordinate(1.25)

    def test_06_academic_lab_report_synthesizer_and_sse_stream(self) -> None:
        test_lab_report_synthesis()
        res_rep = client.post(
            "/ai/v1/experiments/rangkaian-listrik-baterai-kaleng-ar/lab-report/generate",
            json={
                "region": "ID",
                "age_adaptive_level": "HIGHER_ED_UNI",
                "student_name": "Budi Santoso",
                "institution_name": "ITB",
                "class_or_nim": "10223001",
                "result_photo_base64": base64.b64encode(b"completed").decode(),
                "observation_data_rows": [
                    {"trial_number": 1, "x_value": 1.5, "y_value": 12.4, "notes": "1 Baterai AA"},
                ],
                "reflection_answers": ["Sesuai Hukum Ohm."],
            },
        )
        self.assertEqual(res_rep.status_code, 200)
        res_sse = client.get("/ai/v1/events/stream")
        self.assertEqual(res_sse.status_code, 200)
        self.assertTrue(res_sse.headers["content-type"].startswith("text/event-stream"))


if __name__ == "__main__":
    unittest.main()
