import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { HUMAN_MOOD_PRESETS } from '../../constants/homeDiscovery';
import { TOP_STREAMING_SERVICES } from '../../constants/streamingServices';
import { NIGHT_CONSTRAINTS, TONIGHT_MODES } from '../../utils/recommendationScoring';

function HomeTonightSetup({
  activeTonightMode,
  tonightMode,
  activeConstraintIds,
  activeConstraintLabels,
  decisionStats,
  myServices,
  tasteRecap,
  onTonightModeSelect,
  onConstraintToggle,
  onMoodPreset,
  onToggleService,
}) {
  const activeServiceCount = myServices.length;
  const readyPickCount = decisionStats.pickCount || 0;
  const candidateCount = decisionStats.candidateCount || 0;

  // Picking a night is the one choice that matters up front; constraints,
  // quick moods, and services are refinements. They start collapsed so the
  // landing page leads with picks rather than a wall of controls. Choosing a
  // night mode already applies sensible default constraints, so the toggle
  // always states what is currently active rather than hiding it.
  const [refinementsOpen, setRefinementsOpen] = useState(false);
  const refinementSummary = [
    activeConstraintIds.length > 0 ? `${activeConstraintIds.length} filters` : null,
    activeServiceCount > 0 ? `${activeServiceCount} services` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="tonight-cockpit" aria-label="Tonight Mode setup">
      <div className="tonight-cockpit-head">
        <div className="tonight-cockpit-intro">
          <span className="section-kicker">What kind of night is it?</span>
          <h2 className="tonight-cockpit-title">{activeTonightMode.label}</h2>
          <p className="tonight-cockpit-description">{activeTonightMode.description}</p>
        </div>
        <ul className="tonight-cockpit-stats" aria-label="Tonight setup summary">
          <li>
            <span className="stat-value">{activeConstraintIds.length}</span>
            <span className="stat-label">filters</span>
          </li>
          <li>
            <span className="stat-value">{activeServiceCount}</span>
            <span className="stat-label">services</span>
          </li>
          <li>
            <span className="stat-value">{readyPickCount || '—'}</span>
            <span className="stat-label">picks ready</span>
          </li>
        </ul>
      </div>

      <div
        className="tonight-cockpit-row tonight-cockpit-modes"
        role="group"
        aria-label="Choose tonight mood"
      >
        {TONIGHT_MODES.map(mode => (
          <button
            key={mode.id}
            type="button"
            className={`tonight-mode-chip ${tonightMode === mode.id ? 'active' : ''}`}
            aria-pressed={tonightMode === mode.id}
            onClick={() => onTonightModeSelect(mode)}
          >
            <span>{mode.eyebrow}</span>
            {mode.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="tonight-cockpit-refine-toggle"
        aria-expanded={refinementsOpen}
        aria-controls="tonight-cockpit-refinements"
        onClick={() => setRefinementsOpen(open => !open)}
      >
        {refinementsOpen ? (
          <ChevronUp size={14} aria-hidden="true" />
        ) : (
          <ChevronDown size={14} aria-hidden="true" />
        )}
        {refinementsOpen ? 'Hide refinements' : 'Refine picks'}
        {!refinementsOpen && refinementSummary && (
          <span className="tonight-cockpit-refine-summary">{refinementSummary}</span>
        )}
      </button>

      <div
        id="tonight-cockpit-refinements"
        className="tonight-cockpit-refinements"
        hidden={!refinementsOpen}
      >
        <div className="tonight-cockpit-row tonight-cockpit-constraints">
          <div className="tonight-cockpit-row-label">
            <span className="section-kicker">Constraints</span>
            {activeConstraintLabels.length > 0 && (
              <span className="tonight-cockpit-active-summary">
                {activeConstraintLabels.length} active
              </span>
            )}
          </div>
          <div className="constraint-chip-row" role="group" aria-label="Tonight constraints">
            {NIGHT_CONSTRAINTS.map(constraint => {
              const isActive = activeConstraintIds.includes(constraint.id);
              return (
                <button
                  key={constraint.id}
                  type="button"
                  className={`constraint-chip ${isActive ? 'active' : ''}`}
                  aria-pressed={isActive}
                  title={constraint.description}
                  onClick={() => onConstraintToggle(constraint)}
                >
                  {constraint.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="tonight-cockpit-row tonight-cockpit-presets">
          <div className="tonight-cockpit-row-label">
            <span className="section-kicker">Quick moods</span>
            <span className="tonight-cockpit-active-summary">Skip the form</span>
          </div>
          <div className="human-mood-grid" role="group" aria-label="Human mood presets">
            {HUMAN_MOOD_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                className="human-mood-chip"
                onClick={() => onMoodPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tonight-cockpit-row tonight-cockpit-services">
          <div className="tonight-cockpit-row-label">
            <span className="section-kicker">Streaming</span>
            <span className="tonight-cockpit-active-summary">
              {activeServiceCount > 0
                ? `${activeServiceCount} active`
                : 'Pick what you already pay for'}
            </span>
          </div>
          <div className="service-quick-grid" role="group" aria-label="Streaming services">
            {TOP_STREAMING_SERVICES.map(service => (
              <button
                key={service.id}
                type="button"
                className={`service-quick-chip ${myServices.includes(service.id) ? 'active' : ''}`}
                aria-pressed={myServices.includes(service.id)}
                onClick={() => onToggleService(service.id)}
              >
                {service.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tonight-cockpit-foot" aria-live="polite">
        <p className="tonight-cockpit-recap">{tasteRecap}</p>
        {candidateCount > 0 && readyPickCount === 0 && (
          <p className="tonight-cockpit-hint">
            {candidateCount} candidates ranked. Hit <em>Find Tonight’s Picks</em> to lock three.
          </p>
        )}
      </div>
    </section>
  );
}

export default HomeTonightSetup;
