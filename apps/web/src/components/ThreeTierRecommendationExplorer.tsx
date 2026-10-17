'use client';

import React, { useState } from 'react';
import type {
  ExperimentRecommendationCardDTO,
  MatchTierEnum,
  RecommendationMatchResponse,
  RegionCode,
} from '@rekasains/shared-types';
import { severityLabel, tierLabel } from '../lib/labels';
import { Button, EmptyState, Panel, Pill } from './ui';

interface ThreeTierExplorerProps {
  region: RegionCode;
  matchData: RecommendationMatchResponse;
  selectedExperimentSlug: string | null;
  onSelectExperiment: (slug: string) => void;
}

const TIERS: MatchTierEnum[] = ['STRICT_100', 'DIY_SUBSTITUTE', 'LOCAL_MICRO_SHOP'];

const TIER_HINT: Record<MatchTierEnum, string> = {
  STRICT_100: 'Semua bahan sudah ada di inventaris.',
  DIY_SUBSTITUTE: 'Ada bahan yang kurang, tapi bisa diganti dengan bahan yang kamu punya.',
  LOCAL_MICRO_SHOP: 'Kurang 1–2 bahan murah yang bisa dibeli di toko terdekat.',
};

export function ThreeTierRecommendationExplorer({
  matchData,
  selectedExperimentSlug,
  onSelectExperiment,
}: ThreeTierExplorerProps) {
  const lists: Record<MatchTierEnum, ExperimentRecommendationCardDTO[]> = {
    STRICT_100: matchData.strict_100_matches,
    DIY_SUBSTITUTE: matchData.diy_substitute_matches,
    LOCAL_MICRO_SHOP: matchData.local_micro_shop_matches,
  };
  const [tier, setTier] = useState<MatchTierEnum>(
    TIERS.find((t) => lists[t].length > 0) ?? 'STRICT_100'
  );
  const cards = lists[tier] ?? [];

  return (
    <div className="space-y-4">
      {matchData.blocked_hazard_alerts.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold text-red-900">
            Ada bahan berbahaya di inventaris. Eksperimen yang memakainya tidak ditampilkan.
          </p>
          {matchData.blocked_hazard_alerts.map((a) => (
            <p key={a.rule_code} className="mt-1">
              {a.message_local}
            </p>
          ))}
        </div>
      )}

      <Panel title="Eksperimen yang bisa dibuat" description={TIER_HINT[tier]}>
        <div className="mb-4 flex flex-wrap gap-1 rounded-md bg-stone-100 p-1">
          {TIERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`flex-1 rounded px-3 py-1.5 text-sm transition-colors ${
                tier === t ? 'bg-white font-medium text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tierLabel(t)} <span className="tabular-nums text-stone-400">{lists[t].length}</span>
            </button>
          ))}
        </div>

        {cards.length === 0 ? (
          <EmptyState>Tidak ada eksperimen di kategori ini untuk inventaris saat ini.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => {
              const selected = card.experiment_slug === selectedExperimentSlug;
              return (
                <li
                  key={card.experiment_slug}
                  className={`rounded-md border p-4 ${
                    selected ? 'border-stone-900' : 'border-stone-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-stone-900">{card.title_local}</h3>
                      <p className="mt-0.5 text-sm text-stone-500">{card.curriculum_badge}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Pill>{card.match_percentage}% bahan cocok</Pill>
                        <Pill tone={card.safety_severity === 'SAFE' ? 'ok' : 'warn'}>
                          {severityLabel(card.safety_severity)}
                        </Pill>
                      </div>
                    </div>
                    <Button
                      variant={selected ? 'primary' : 'secondary'}
                      onClick={() => onSelectExperiment(card.experiment_slug)}
                    >
                      {selected ? 'Dipilih' : 'Pilih'}
                    </Button>
                  </div>

                  {card.functional_substitutes.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                      {card.functional_substitutes.map((s) => (
                        <div key={s.missing_material_slug} className="text-sm">
                          <p className="text-stone-800">
                            <span className="text-stone-500 line-through">{s.missing_name_local}</span>
                            {' → '}
                            {s.substitute_name_local}
                          </p>
                          <p className="text-stone-500">{s.shared_scientific_principle}</p>
                          {s.adaptation_steps.length > 0 && (
                            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-stone-600">
                              {s.adaptation_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {card.missing_local_shop_items.length > 0 && (
                    <table className="mt-3 w-full border-t border-stone-100 text-sm">
                      <tbody className="divide-y divide-stone-100">
                        {card.missing_local_shop_items.map((m) => (
                          <tr key={m.material_slug}>
                            <td className="py-2 pr-3 text-stone-800">
                              {m.missing_quantity} {m.unit} {m.name_local}
                              <div className="text-xs text-stone-500">{m.recommended_stores.join(' · ')}</div>
                            </td>
                            <td className="py-2 pr-3 tabular-nums text-stone-700">{m.display_price}</td>
                            <td className="whitespace-nowrap py-2 text-right">
                              <a
                                href={m.maps_search_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stone-600 underline-offset-2 hover:underline"
                              >
                                Peta
                              </a>
                              <span className="px-1.5 text-stone-300">·</span>
                              <a
                                href={m.marketplace_search_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stone-600 underline-offset-2 hover:underline"
                              >
                                Toko online
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
