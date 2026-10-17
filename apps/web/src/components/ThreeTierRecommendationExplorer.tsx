'use client';

import React, { useState } from 'react';
import type {
  ExperimentRecommendationCardDTO,
  MatchTierEnum,
  RecommendationMatchResponse,
  RegionCode,
} from '@rekasains/shared-types';

interface ThreeTierExplorerProps {
  region: RegionCode;
  matchData: RecommendationMatchResponse;
  selectedExperimentSlug: string;
  onSelectExperiment: (slug: string) => void;
}

export function ThreeTierRecommendationExplorer({
  region,
  matchData,
  selectedExperimentSlug,
  onSelectExperiment,
}: ThreeTierExplorerProps) {
  const [activeTier, setActiveTier] = useState<MatchTierEnum>('STRICT_100');
  const isMY = region === 'MY';

  const tierCards: Record<MatchTierEnum, ExperimentRecommendationCardDTO[]> = {
    STRICT_100: matchData.strict_100_matches,
    DIY_SUBSTITUTE: matchData.diy_substitute_matches,
    LOCAL_MICRO_SHOP: matchData.local_micro_shop_matches,
  };

  const currentList = tierCards[activeTier] || [];

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            USP #2, #3 &amp; #4 • ResourceMatcherAgent (3-Tier + Functional Substitutes)
          </span>
          <h2 className="mt-1 text-xl font-bold text-white">
            2. 3-Tier Experiment Recommendations, Functional Substitutes &amp; Local Stores ({isMY ? 'RM' : 'Rp'})
          </h2>
        </div>

        {/* 3-Tier Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTier('STRICT_100')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTier === 'STRICT_100'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🟢 Tier 1: 100% Ready ({matchData.strict_100_matches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTier('DIY_SUBSTITUTE')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTier === 'DIY_SUBSTITUTE'
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🛠️ Tier 2: Functional / DIY Substitutes ({matchData.diy_substitute_matches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTier('LOCAL_MICRO_SHOP')}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTier === 'LOCAL_MICRO_SHOP'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🛒 Tier 3: {isMY ? 'Retail / MR.DIY (RM)' : 'Local Stores / Minimarket (Rp)'} (
            {matchData.local_micro_shop_matches.length})
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="mt-4 grid gap-4 md:grid-cols-1">
        {currentList.map((card) => {
          const isSelected = card.experiment_slug === selectedExperimentSlug;
          return (
            <div
              key={card.experiment_slug}
              className={`rounded-xl border p-4 transition ${
                isSelected
                  ? 'border-cyan-400 bg-slate-800/90 ring-2 ring-cyan-400/40'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                      {card.match_tier} • {card.match_percentage}% Match
                    </span>
                    <span className="rounded bg-slate-700 px-2.5 py-0.5 text-xs text-slate-200">
                      {card.curriculum_badge}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-white">{card.title_local}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectExperiment(card.experiment_slug)}
                  className="shrink-0 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  {isSelected ? '✓ Active Module' : 'Open Module & AR Lab →'}
                </button>
              </div>

              {/* USP #3: Automatic Alternative Material Recommender (Functional Physics/Chemistry Substitute) */}
              {card.functional_substitutes.length > 0 && (
                <div className="mt-3 rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-cyan-300">
                    🔄 Alternative Material Recommendation — Equivalent Physics/Chemistry Function (USP #3)
                  </div>
                  {card.functional_substitutes.map((sub) => (
                    <div key={sub.missing_material_slug} className="mt-2 text-xs text-slate-200">
                      <p>
                        <strong>Missing Material:</strong>{' '}
                        <span className="line-through text-amber-300">{sub.missing_name_local}</span>{' '}
                        ➔ <strong>Substituted With:</strong>{' '}
                        <span className="font-bold text-emerald-300">{sub.substitute_name_local}</span>
                      </p>
                      <p className="mt-1 text-cyan-200">
                        <strong>Equivalent Scientific Principle:</strong> {sub.shared_scientific_principle}
                      </p>
                      <ul className="mt-1 list-disc pl-5 text-slate-300">
                        {sub.adaptation_steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* USP #4: Hyper-Localized Low-Cost Store & Smart Deep-Links (ID Rp / MY RM) */}
              {card.missing_local_shop_items.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/20 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-amber-300">
                    🛒 Local Low-Cost Store Purchasing Guide (USP #4)
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {card.missing_local_shop_items.map((shop) => (
                      <div
                        key={shop.material_slug}
                        className="rounded border border-slate-700 bg-slate-900/80 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-white">
                          <span>
                            {shop.name_local} ({shop.missing_quantity} {shop.unit})
                          </span>
                          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-amber-300">
                            {shop.display_price}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-300">
                          <strong>Recommended Stores:</strong>{' '}
                          {shop.recommended_stores.join(', ')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a
                            href={shop.maps_search_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-slate-700 px-2.5 py-1 font-semibold text-cyan-300 hover:bg-slate-600"
                          >
                            📍 Find on Google Maps
                          </a>
                          <a
                            href={shop.marketplace_search_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-slate-700 px-2.5 py-1 font-semibold text-emerald-300 hover:bg-slate-600"
                          >
                            🛍️ {isMY ? 'Buy on Shopee MY' : 'Buy on Tokopedia / Shopee'}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
