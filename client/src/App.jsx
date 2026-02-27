import { useEffect, useState } from 'react';
import { Search, Loader2, BookOpen, AlertCircle, Volume2, Volume1, Square } from 'lucide-react';

const API = '/api';

export default function App() {
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [speakingKey, setSpeakingKey] = useState(null);

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const stopSpeech = () => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    setSpeakingKey(null);
  };

  const buildSpeechText = (entry) => {
    const parts = [];
    if (entry?.word) parts.push(`${entry.word}.`);
    const meanings = Array.isArray(entry?.meanings) ? entry.meanings : [];
    for (const meaning of meanings) {
      if (meaning?.partOfSpeech) parts.push(`${meaning.partOfSpeech}.`);
      const defs = Array.isArray(meaning?.definitions) ? meaning.definitions.slice(0, 3) : [];
      defs.forEach((d, i) => {
        if (d?.definition) parts.push(`Definition ${i + 1}. ${d.definition}.`);
      });
    }
    return parts.join(' ');
  };

  const speakEntry = (entry, key) => {
    if (!canSpeak) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }
    setError(null);
    stopSpeech();
    const text = buildSpeechText(entry);
    if (!text.trim()) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setSpeakingKey(null);
    utter.onerror = () => setSpeakingKey(null);
    setSpeakingKey(key);
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    return () => {
      if (canSpeak) window.speechSynthesis.cancel();
    };
  }, [canSpeak]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!word.trim()) return;
    stopSpeech();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/word/${encodeURIComponent(word.trim().toLowerCase())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch definition');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-4 min-h-[calc(100vh-3rem)]">
        <header className="text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-2">
            WordWave
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Look up meanings, pronunciation, synonyms, and antonyms
          </p>
        </header>

        <form onSubmit={handleSearch} className="card rounded-2xl p-4 sm:p-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Enter a word..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-600 bg-slate-800/80 text-white placeholder:text-slate-500 input-focus text-lg"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !word.trim()}
              className="px-5 py-3 rounded-xl btn-search text-white font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Search size={20} />
              )}
              Search
            </button>
          </div>
        </form>

        {error && (
          <div className="card rounded-xl p-3 sm:p-4 flex items-center gap-3 text-amber-200 border-amber-500/30">
            <AlertCircle size={22} className="shrink-0" />
            <p className="text-sm sm:text-base">{error}</p>
          </div>
        )}

        <div className="flex-1 flex">
          {result && result.length > 0 && (
            <div className="card rounded-2xl p-4 sm:p-5 w-full overflow-y-auto space-y-5">
              {result.map((entry, idx) => {
              const phonetics = Array.isArray(entry?.phonetics) ? entry.phonetics : [];
              const audioUrl = phonetics.find((p) => p?.audio)?.audio;

              return (
                <article key={idx} className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white capitalize">
                        {entry.word}
                      </h2>
                      {entry.phonetic && (
                        <span className="text-slate-400 text-lg">{entry.phonetic}</span>
                      )}
                      {audioUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const audio = new Audio(audioUrl);
                              audio.play().catch(() => {});
                            } catch {
                              // ignore
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/70 border border-slate-600 text-slate-200 text-xs hover:bg-slate-700 transition-colors"
                          title="Play pronunciation audio"
                        >
                          <Volume1 size={14} />
                          Pronounce
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakEntry(entry, idx)}
                        disabled={!canSpeak || speakingKey === idx}
                        className="px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        title={canSpeak ? 'Read meanings aloud' : 'Text-to-speech not supported'}
                      >
                        <Volume2 size={18} />
                        Read
                      </button>
                      <button
                        type="button"
                        onClick={stopSpeech}
                        disabled={!canSpeak || speakingKey === null}
                        className="px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        title="Stop reading"
                      >
                        <Square size={18} />
                        Stop
                      </button>
                    </div>
                  </div>

                  {entry.meanings?.map((meaning, midx) => {
                    const defs = Array.isArray(meaning?.definitions) ? meaning.definitions : [];
                    const baseSynonyms = Array.isArray(meaning?.synonyms) ? meaning.synonyms : [];
                    const baseAntonyms = Array.isArray(meaning?.antonyms) ? meaning.antonyms : [];
                    const collectedSyns = defs.flatMap((d) => (Array.isArray(d?.synonyms) ? d.synonyms : []));
                    const collectedAnts = defs.flatMap((d) => (Array.isArray(d?.antonyms) ? d.antonyms : []));
                    const synonyms = Array.from(new Set([...baseSynonyms, ...collectedSyns])).slice(0, 8);
                    const antonyms = Array.from(new Set([...baseAntonyms, ...collectedAnts])).slice(0, 8);

                    return (
                      <section key={midx} className="mb-6 last:mb-0">
                        <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wide mb-3">
                          {meaning.partOfSpeech}
                        </p>
                        <ul className="space-y-3">
                          {defs.slice(0, 5).map((def, didx) => (
                            <li key={didx} className="flex gap-3">
                              <span className="text-slate-500 mt-1.5">•</span>
                              <div>
                                <p className="text-slate-200 leading-relaxed">
                                  {def.definition}
                                </p>
                                {def.example && (
                                  <p className="text-slate-500 italic text-sm mt-1.5 pl-0">
                                    &ldquo;{def.example}&rdquo;
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>

                        {synonyms.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                              Synonyms
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {synonyms.map((s) => (
                                <span
                                  key={s}
                                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-400/90 to-teal-300/90 border border-teal-200/80 text-xs sm:text-sm text-emerald-950 font-semibold shadow-sm cursor-default"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {antonyms.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                              Antonyms
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {antonyms.map((a) => (
                                <span
                                  key={a}
                                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400/90 to-orange-400/90 border border-amber-200/80 text-xs sm:text-sm text-amber-950 font-semibold shadow-sm cursor-default"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </article>
              );
            })}
          </div>
          )}

          {!result && !loading && !error && (
            <div className="card rounded-2xl p-8 sm:p-10 text-center text-slate-500 flex-1 flex flex-col items-center justify-center">
              <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
              <p className="max-w-sm">
                Enter a word above to see its definition, pronunciation, synonyms and antonyms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
