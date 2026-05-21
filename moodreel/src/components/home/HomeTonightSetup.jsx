import React from 'react';

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
  return (
    <>
      <div className="tonight-mode-rail" aria-label="Tonight Mode">
        <div className="tonight-mode-copy">
          <span>What kind of night is it?</span>
          <strong>{activeTonightMode.label}</strong>
          <p>{activeTonightMode.description}</p>
        </div>
        <div className="tonight-flow-controls">
          <div className="tonight-mode-options" role="group" aria-label="Choose tonight mood">
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
      </div>

      <div className="tonight-intelligence-grid" aria-label="Tonight setup">
        <section className="tonight-intel-card no-doomscroll-card">
          <span>No Doomscroll</span>
          <strong>Three defensible picks, then feedback.</strong>
          <p>
            {decisionStats.pickCount > 0
              ? `${decisionStats.pickCount} picks ready from ${decisionStats.candidateCount} ranked candidates.`
              : 'Search a mood and MoodReel will collapse the catalog into a short list.'}
          </p>
          {activeConstraintLabels.length > 0 && (
            <div className="intel-chip-row">
              {activeConstraintLabels.slice(0, 5).map(label => (
                <span key={label}>{label}</span>
              ))}
            </div>
          )}
        </section>

        <section className="tonight-intel-card service-setup-card">
          <span>Streaming setup</span>
          <strong>
            {myServices.length > 0
              ? `${myServices.length} service${myServices.length > 1 ? 's' : ''} active`
              : 'Tell MoodReel what you can watch.'}
          </strong>
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
        </section>

        <section className="tonight-intel-card mood-preset-card">
          <span>Human presets</span>
          <strong>Start with the real problem.</strong>
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
        </section>

        <section className="tonight-intel-card taste-recap-card">
          <span>Taste recap</span>
          <strong>Better future picks</strong>
          <p>{tasteRecap}</p>
        </section>
      </div>
    </>
  );
}

export default HomeTonightSetup;
