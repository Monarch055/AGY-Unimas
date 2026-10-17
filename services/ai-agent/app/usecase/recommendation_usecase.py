"""
Layer 2 (Use Case): 3-Tier STEM Experiment Recommendation & Functional Material Substitutes (USP #2, #3, #4).
"""

from __future__ import annotations

from typing import Dict, List, Set, Tuple

from app.domain.catalog_knowledge import (
    CANONICAL_MATERIALS,
    EXPERIMENT_BLUEPRINTS,
    FUNCTIONAL_SUBSTITUTES,
    SAFETY_HAZARD_RULES,
    ExperimentBlueprintSpec,
)
from app.domain.models import (
    ExperimentRecommendationCardDTO,
    FunctionalMaterialSubstituteDTO,
    LocalSourcingItemDTO,
    MatchTierEnum,
    RecommendationMatchRequest,
    RecommendationMatchResponse,
    RegionCode,
    SafetyAlertDTO,
    SafetySeverityEnum,
)


class RecommendationMatcherUseCase:
    """Classifies experiments into Strict 100%, DIY/Functional Substitutes, and Local Micro-Shop."""

    def execute(self, req: RecommendationMatchRequest) -> RecommendationMatchResponse:
        # Build map of user inventory: slug -> quantity
        inv_map: Dict[str, float] = {}
        for it in req.inventory_items:
            inv_map[it.material_slug] = inv_map.get(it.material_slug, 0.0) + it.quantity

        strict_matches: List[ExperimentRecommendationCardDTO] = []
        diy_matches: List[ExperimentRecommendationCardDTO] = []
        shop_matches: List[ExperimentRecommendationCardDTO] = []
        blocked_alerts: List[SafetyAlertDTO] = []

        for slug, exp in EXPERIMENT_BLUEPRINTS.items():
            # Check safety hazards
            hazard = self._check_experiment_hazards(exp, inv_map, req.region)
            if hazard and hazard.severity == SafetySeverityEnum.CRITICAL_HAZARD_BLOCKED:
                blocked_alerts.append(hazard)
                continue

            card = self._evaluate_experiment(exp, inv_map, req)
            if card.match_tier == MatchTierEnum.STRICT_100:
                strict_matches.append(card)
            elif card.match_tier == MatchTierEnum.DIY_SUBSTITUTE:
                diy_matches.append(card)
            else:
                shop_matches.append(card)

        return RecommendationMatchResponse(
            region=req.region,
            strict_100_matches=strict_matches,
            diy_substitute_matches=diy_matches,
            local_micro_shop_matches=shop_matches,
            blocked_hazard_alerts=blocked_alerts,
        )

    def _evaluate_experiment(
        self,
        exp: ExperimentBlueprintSpec,
        inv_map: Dict[str, float],
        req: RecommendationMatchRequest,
    ) -> ExperimentRecommendationCardDTO:
        req_materials = exp.required_materials
        total_required = len(req_materials)
        satisfied_directly = 0

        functional_subs: List[FunctionalMaterialSubstituteDTO] = []
        missing_shop_items: List[LocalSourcingItemDTO] = []

        for rm in req_materials:
            current_qty = inv_map.get(rm.material_slug, 0.0)
            if current_qty >= rm.min_quantity:
                satisfied_directly += 1
                continue

            # Check if there is a functional substitute in the user's inventory
            sub_found = False
            for (miss_slug, sub_slug), sub_spec in FUNCTIONAL_SUBSTITUTES.items():
                if miss_slug == rm.material_slug and inv_map.get(sub_slug, 0.0) > 0:
                    sub_mat = CANONICAL_MATERIALS.get(sub_slug)
                    miss_mat = CANONICAL_MATERIALS.get(miss_slug)
                    sub_name = sub_mat.local_name(req.region) if sub_mat else sub_slug
                    miss_name = miss_mat.local_name(req.region) if miss_mat else miss_slug

                    principle = (
                        sub_spec.shared_principle_id
                        if req.region == RegionCode.ID
                        else sub_spec.shared_principle_my
                    )
                    steps = (
                        sub_spec.adaptation_steps_id
                        if req.region == RegionCode.ID
                        else sub_spec.adaptation_steps_my
                    )

                    functional_subs.append(
                        FunctionalMaterialSubstituteDTO(
                            missing_material_slug=miss_slug,
                            missing_name_local=miss_name,
                            substitute_material_slug=sub_slug,
                            substitute_name_local=sub_name,
                            shared_scientific_principle=principle,
                            adaptation_steps=steps,
                        )
                    )
                    sub_found = True
                    break

            if sub_found:
                continue

            # If no functional substitute found, list as local micro-shop item
            missing_qty = rm.min_quantity - current_qty
            mat_spec = CANONICAL_MATERIALS.get(rm.material_slug)
            if mat_spec:
                missing_shop_items.append(
                    LocalSourcingItemDTO(
                        material_slug=rm.material_slug,
                        name_local=mat_spec.local_name(req.region),
                        missing_quantity=missing_qty,
                        unit=rm.unit,
                        currency=mat_spec.currency(req.region),
                        est_price_int=mat_spec.price_int(req.region),
                        display_price=mat_spec.display_price(req.region, missing_qty),
                        recommended_stores=mat_spec.store_types(req.region),
                        maps_search_url=mat_spec.maps_url(req.region),
                        marketplace_search_url=mat_spec.marketplace_url(req.region),
                    )
                )

        # Determine Tier
        if satisfied_directly == total_required:
            tier = MatchTierEnum.STRICT_100
            pct = 100
        elif len(functional_subs) > 0 and len(missing_shop_items) == 0:
            tier = MatchTierEnum.DIY_SUBSTITUTE
            pct = int(round((satisfied_directly + len(functional_subs)) / total_required * 100))
        else:
            tier = MatchTierEnum.LOCAL_MICRO_SHOP
            pct = int(round(satisfied_directly / total_required * 100))

        title = exp.title_id if req.region == RegionCode.ID else exp.title_my
        badge = exp.curriculum_badge(req.age_adaptive_level, req.region)

        return ExperimentRecommendationCardDTO(
            experiment_slug=exp.slug,
            title_local=title,
            match_tier=tier,
            match_percentage=pct,
            age_adaptive_level=req.age_adaptive_level,
            curriculum_badge=badge,
            safety_severity="SAFE" if exp.safety_severity == "SAFE" else "ADULT_SUPERVISION",
            functional_substitutes=functional_subs,
            missing_local_shop_items=missing_shop_items,
        )

    def _check_experiment_hazards(
        self,
        exp: ExperimentBlueprintSpec,
        inv_map: Dict[str, float],
        region: RegionCode,
    ) -> SafetyAlertDTO | None:
        exp_materials = {rm.material_slug for rm in exp.required_materials}
        for rule in SAFETY_HAZARD_RULES:
            if rule.material_slug_a in exp_materials and rule.material_slug_b in exp_materials:
                msg = rule.warning_id if region == RegionCode.ID else rule.warning_my
                return SafetyAlertDTO(
                    rule_code=rule.rule_code,
                    severity=rule.severity,
                    involved_materials=[rule.material_slug_a, rule.material_slug_b],
                    message_local=f"PERINGATAN BAHAYA: {msg}",
                )
        return None
