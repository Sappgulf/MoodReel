import { POST_WATCH_REACTIONS } from '../../constants/movieDetails';

export default function MovieDetailsInsights({
  tonightVerdict,
  whyYouMightLikeIt,
  tasteIntel,
  onPostWatchReaction,
}) {
  return (
    <>
      {tonightVerdict && (
        <section
          className="tonight-verdict-section details-section"
          aria-labelledby="tonight-verdict-heading"
        >
          <header className="details-section-head">
            <p className="details-kicker">Tonight Verdict</p>
            <h3 id="tonight-verdict-heading">Should I watch this tonight?</h3>
          </header>
          <div className="tonight-verdict-card">
            <div className="verdict-meter" aria-label={`${tonightVerdict.score}% match`}>
              <strong>{tonightVerdict.score}%</strong>
              <span>{tonightVerdict.label}</span>
            </div>
            <ul>
              {tonightVerdict.reasons.map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div className="post-watch-loop">
              <span>After watching, teach MoodReel:</span>
              <div className="post-watch-actions" role="group" aria-label="Post-watch rating">
                {POST_WATCH_REACTIONS.map(reaction => (
                  <button
                    key={reaction.id}
                    type="button"
                    className="post-watch-chip"
                    onClick={() => onPostWatchReaction(reaction)}
                  >
                    {reaction.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="why-like-section details-section" aria-labelledby="why-like-heading">
        <header className="details-section-head">
          <p className="details-kicker">Taste Signal</p>
          <h3 id="why-like-heading">Why you might like it</h3>
        </header>
        <ul className="why-like-list">
          {whyYouMightLikeIt.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section
        className="taste-intel-section details-section"
        aria-labelledby="taste-intel-heading"
      >
        <header className="details-section-head">
          <p className="details-kicker">Taste Intelligence</p>
          <h3 id="taste-intel-heading">Your signal on this title</h3>
        </header>
        <div className="taste-intel-grid">
          <div className="taste-intel-card">
            <span>Cast affinity</span>
            <strong>
              {tasteIntel.castMatches.length > 0
                ? tasteIntel.castMatches.map(person => person.name).join(', ')
                : 'No repeated cast yet'}
            </strong>
          </div>
          <div className="taste-intel-card">
            <span>Director affinity</span>
            <strong>{tasteIntel.directorMatch || 'No director repeat yet'}</strong>
          </div>
          <div className="taste-intel-card">
            <span>Review sentiment</span>
            <strong>{tasteIntel.reviewSentiment}</strong>
          </div>
        </div>
        {!tasteIntel.hasSignals && (
          <p className="taste-intel-empty">
            Open more details pages or write a review to make this section more personal.
          </p>
        )}
      </section>
    </>
  );
}
