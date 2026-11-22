import { useEffect, useRef, useState } from 'react';
import { flagSrc } from '../lib/api';

const MAX_RETRIES = 4;

function FlagInner({ id, alt, className, imgClassName }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  // Already in the browser cache? onLoad may have fired before React attached it.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [attempt]);

  const onError = () => {
    if (attempt < MAX_RETRIES) setTimeout(() => setAttempt((a) => a + 1), 500 * (attempt + 1));
    else setFailed(true);
  };

  const retry = () => {
    setFailed(false);
    setLoaded(false);
    setAttempt((a) => a + 1);
  };

  return (
    <span className={`relative flex items-center justify-center ${className}`}>
      {!loaded && !failed && (
        <span className="absolute h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-sun" role="status" aria-label="Loading flag" />
      )}
      {failed ? (
        <button type="button" onClick={retry} className="px-2 text-center text-xs text-mist underline-offset-2 hover:text-sand hover:underline">
          Flag didn&apos;t load · tap to retry
        </button>
      ) : (
        <img
          ref={imgRef}
          // new URL on each retry so the browser doesn't reuse the failed response
          src={`${flagSrc(id)}${attempt ? `?r=${attempt}` : ''}`}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={onError}
          className={`${imgClassName} transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  );
}

/**
 * Flag image with a loading spinner and automatic retries.
 * Keyed by id so a new country always starts fresh instead of keeping the previous flag on screen.
 */
export default function Flag({ id, alt = '', className = 'h-full w-full', imgClassName = 'max-h-full max-w-full object-contain' }) {
  return <FlagInner key={id} id={id} alt={alt} className={className} imgClassName={imgClassName} />;
}
