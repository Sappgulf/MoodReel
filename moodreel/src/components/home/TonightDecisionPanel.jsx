import React from 'react';
import { Link } from 'react-router-dom';
import MediaImage from '../MediaImage';
import EmptyState from '../EmptyState';
import { getDisplayOverview, getDisplayTitle, getReleaseYear } from '../../utils/mediaUtils';
import { getRecommendationKey } from '../../utils/recommendationScoring';

function GhostPick({ slot, slotLabel, locked }) {
  return (
    <article className={`pick-between-card pick-between-card-ghost ${locked ? 'locked' : ''}`}>
      <div className="pick-between-art pick-between-art-ghost" aria-hidden="true">
        <span className="ghost-eyebrow">{slotLabel}</span>
      </div>
      <div className="pick-between-card-head">
        <span className="pick-between-rank">Awaiting</span>
        <span className="pick-between-confidence">—% match</span>
      </div>
      <div className="ghost-title" aria-hidden="true" />
      <div className="ghost-line" aria-hidden="true" />
      <div className="ghost-line ghost-line-short" aria-hidden="true" />
      <div className="pick-between-meta">
        <span>{slot === 'safe' && 'High confidence pick'}</span>
        <span>{slot === 'best' && 'Strongest match'}</span>
        <span>{slot === 'wild' && 'Bold left turn'}</span>
      </div>
    </article>
  );
}

function ActivePick({
  pick,
  decisionFeedback,
  decisionFeedbackOptions,
  lockedPickId,
  onPick,
  onPass,
  onFeedback,
}) {
  const item = pick.item;
  const key = getRecommendationKey(item, item.media_type || 'movie');
  const isLocked = lockedPickId === key;
  const title = getDisplayTitle(item);
  const year = getReleaseYear(item);
  const overview = getDisplayOverview(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const reason = pick.explanation;
  const feedbackId = decisionFeedback[key];

  return (
    <article key={key} className={`pick-between-card ${isLocked ? 'locked' : ''}`}>
      <Link
        to={`/${item.media_type || 'movie'}/${item.id}`}
        state={{ item }}
        className="pick-between-art"
        aria-label={`Open ${title} details`}
      >
        <MediaImage
          path={item.backdrop_path || item.poster_path}
          type={item.backdrop_path ? 'backdrop' : 'poster'}
          size={item.backdrop_path ? 'w780' : 'w342'}
          alt=""
          loading={pick.slot === 'safe' ? 'eager' : 'lazy'}
        />
      </Link>
      <div className="pick-between-card-head">
        <span className="pick-between-rank">{pick.slotLabel}</span>
        <span className="pick-between-confidence">
          {pick.confidence || 0}% {pick.confidenceLabel || 'match'}
        </span>
      </div>
      <h3>
        <Link to={`/${item.media_type || 'movie'}/${item.id}`} state={{ item }}>
          {title}
        </Link>
      </h3>
      <p>{reason || overview}</p>
      {pick.debateLine && <p className="pick-debate-line">{pick.debateLine}</p>}
      {pick.tags?.length > 0 && (
        <div className="pick-tag-row">
          {pick.tags.map(tag => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
      <div className="pick-between-meta">
        {year && <span>{year}</span>}
        {rating && <span>{rating} TMDB</span>}
        <span>{item.media_type === 'tv' ? 'Series' : 'Film'}</span>
      </div>
      <div className="not-tonight-row" role="group" aria-label={`Why not ${title}?`}>
        {decisionFeedbackOptions.map(option => (
          <button
            key={option.id}
            type="button"
            className={`not-tonight-chip ${feedbackId === option.id ? 'active' : ''}`}
            onClick={() => onFeedback?.(item, option)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="pick-between-actions">
        <button
          type="button"
          className="primary-button pick-between-pick"
          onClick={() => onPick?.(item)}
        >
          {isLocked ? 'Picked' : 'Pick this'}
        </button>
        <button
          type="button"
          className="btn-secondary pick-between-pass"
          onClick={() => onPass?.(item)}
        >
          Swap out
        </button>
      </div>
    </article>
  );
}

export default function TonightDecisionPanel({
  activeTonightMode,
  tonightPicks = [],
  isReady = false,
  isLoading = false,
  decisionFeedback = {},
  decisionFeedbackOptions = [],
  rerollOptions = [],
  lockedPickId,
  activeConstraintLabels = [],
  decisionStats = {},
  myServicesCount = 0,
  onPickCandidate,
  onPassCandidate,
  onFeedbackCandidate,
  onRerollCandidate,
  onShareTonight,
  onRunPicks,
}) {
  const ghostSlots = [
    { slot: 'safe', slotLabel: 'Safe Bet' },
    { slot: 'best', slotLabel: 'Best Match' },
    { slot: 'wild', slotLabel: 'Wild Card' },
  ];

  const showGhosts = tonightPicks.length === 0;
  const showHeader = isReady || tonightPicks.length > 0;

  return (
    <section className="tonight-decision-panel" aria-labelledby="tonight-decision-heading">
      <div className="tonight-decision-intro">
        <span className="section-kicker">Tonight’s three</span>
        <h2 id="tonight-decision-heading">
          {isReady
            ? `Shortlist for ${activeTonightMode.label.toLowerCase()}`
            : 'Three picks, no doomscroll.'}
        </h2>
        <p>
          {isReady
            ? activeTonightMode.decisionCopy
            : 'Lock in a vibe, pick a constraint or two, and MoodReel will collapse the catalog into a Safe Bet, a Best Match, and a Wild Card.'}
        </p>

        <div className="decision-scoreboard" aria-label="Tonight decision summary">
          <span>{tonightPicks[0]?.confidence || decisionStats.topConfidence || 0}% top match</span>
          <span>{myServicesCount} services</span>
          <span>{decisionStats.passedCount || 0} swapped</span>
        </div>

        {activeConstraintLabels.length > 0 && (
          <div className="pick-constraint-row">
            {activeConstraintLabels.slice(0, 6).map(label => (
              <span key={label}>{label}</span>
            ))}
          </div>
        )}

        {showHeader && (
          <>
            <div className="decision-reroll-row" role="group" aria-label="Re-roll with intent">
              {rerollOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className="decision-reroll-chip"
                  onClick={() => onRerollCandidate?.(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary share-tonight-btn"
              onClick={onShareTonight}
              aria-label="Copy tonight card to share"
            >
              <span aria-hidden="true">🔗</span> Share card
            </button>
          </>
        )}
      </div>

      <div className="pick-between-grid">
        {isLoading ? (
          ghostSlots.map(s => <GhostPick key={s.slot} slot={s.slot} slotLabel={s.slotLabel} />)
        ) : showGhosts ? (
          <>
            {ghostSlots.map(s => (
              <GhostPick key={s.slot} slot={s.slot} slotLabel={s.slotLabel} />
            ))}
            <div className="pick-between-cta">
              <EmptyState
                icon="🎬"
                title="Ready when the couch is."
                description="MoodReel needs a vibe and at least one filter to surface three defensible picks."
                onActionClick={() => onRunPicks?.()}
                actionText="Run Tonight Mode"
              />
            </div>
          </>
        ) : (
          tonightPicks.map(pick => (
            <ActivePick
              key={getRecommendationKey(pick.item, pick.item.media_type || 'movie')}
              pick={pick}
              decisionFeedback={decisionFeedback}
              decisionFeedbackOptions={decisionFeedbackOptions}
              lockedPickId={lockedPickId}
              onPick={onPickCandidate}
              onPass={onPassCandidate}
              onFeedback={onFeedbackCandidate}
            />
          ))
        )}
      </div>
    </section>
  );
}
