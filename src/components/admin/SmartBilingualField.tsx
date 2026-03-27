"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";

interface SmartBilingualFieldProps {
  label: string;
  valueFr: string;
  valueEn: string;
  onChangeFr: (v: string) => void;
  onChangeEn: (v: string) => void;
  multiline?: boolean;
  context?: Record<string, string>;
}

type TranslateStatus = "idle" | "translating" | "done";

export default function SmartBilingualField({
  label,
  valueFr,
  valueEn,
  onChangeFr,
  onChangeEn,
  multiline = false,
  context,
}: SmartBilingualFieldProps) {
  const [translateStatusEn, setTranslateStatusEn] = useState<TranslateStatus>("idle");
  const [translateStatusFr, setTranslateStatusFr] = useState<TranslateStatus>("idle");
  const [manualEditEn, setManualEditEn] = useState(false);
  const [manualEditFr, setManualEditFr] = useState(false);
  const [showSuggestionsFr, setShowSuggestionsFr] = useState(false);
  const [showSuggestionsEn, setShowSuggestionsEn] = useState(false);
  const [suggestionsFr, setSuggestionsFr] = useState<string[]>([]);
  const [suggestionsEn, setSuggestionsEn] = useState<string[]>([]);
  const [loadingSugFr, setLoadingSugFr] = useState(false);
  const [loadingSugEn, setLoadingSugEn] = useState(false);

  const timerFr = useRef<NodeJS.Timeout | null>(null);
  const timerEn = useRef<NodeJS.Timeout | null>(null);
  const lastTranslatedFr = useRef("");
  const lastTranslatedEn = useRef("");

  const translate = useCallback(async (text: string, from: string, to: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from, to }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.translation || null;
    } catch {
      return null;
    }
  }, []);

  // FR → EN auto-translate
  const handleFrChange = (v: string) => {
    onChangeFr(v);
    setManualEditFr(false);
    setManualEditEn(false);

    if (timerFr.current) clearTimeout(timerFr.current);
    if (!v.trim()) return;

    timerFr.current = setTimeout(async () => {
      if (manualEditEn || v === lastTranslatedFr.current) return;
      setTranslateStatusEn("translating");
      const result = await translate(v, "fr", "en");
      if (result) {
        lastTranslatedFr.current = v;
        lastTranslatedEn.current = result;
        onChangeEn(result);
        setTranslateStatusEn("done");
        setTimeout(() => setTranslateStatusEn("idle"), 2000);
      } else {
        setTranslateStatusEn("idle");
      }
    }, 1500);
  };

  // EN → FR auto-translate
  const handleEnChange = (v: string) => {
    onChangeEn(v);
    setManualEditEn(true);

    if (timerEn.current) clearTimeout(timerEn.current);
    if (!v.trim()) return;

    timerEn.current = setTimeout(async () => {
      if (manualEditFr || v === lastTranslatedEn.current) return;
      setTranslateStatusFr("translating");
      const result = await translate(v, "en", "fr");
      if (result) {
        lastTranslatedEn.current = v;
        lastTranslatedFr.current = result;
        onChangeFr(result);
        setTranslateStatusFr("done");
        setTimeout(() => setTranslateStatusFr("idle"), 2000);
      } else {
        setTranslateStatusFr("idle");
      }
    }, 1500);
  };

  const fetchSuggestions = async (lang: "fr" | "en") => {
    const setter = lang === "fr" ? setSuggestionsFr : setSuggestionsEn;
    const setLoading = lang === "fr" ? setLoadingSugFr : setLoadingSugEn;
    const setShow = lang === "fr" ? setShowSuggestionsFr : setShowSuggestionsEn;

    setLoading(true);
    setShow(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: label, context, lang }),
      });
      const data = await res.json();
      setter(data.suggestions || []);
    } catch {
      setter([]);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (text: string, lang: "fr" | "en") => {
    if (lang === "fr") {
      onChangeFr(text);
      setShowSuggestionsFr(false);
      // Trigger translation to EN
      handleFrChange(text);
    } else {
      onChangeEn(text);
      setShowSuggestionsEn(false);
      handleEnChange(text);
    }
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerFr.current) clearTimeout(timerFr.current);
      if (timerEn.current) clearTimeout(timerEn.current);
    };
  }, []);

  const inputClass =
    "w-full bg-cream-100 border border-blush-200 rounded-xl px-4 py-3 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors";

  return (
    <div>
      <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-2">
        {label}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* FR */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="font-sans text-xs text-brown-400">Français</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={translateStatusFr} />
              <button
                type="button"
                onClick={() => fetchSuggestions("fr")}
                className="flex items-center gap-1 text-[10px] font-sans text-terracotta-400 hover:text-terracotta-600 transition-colors"
              >
                <Sparkles size={10} /> Suggestions
              </button>
            </div>
          </div>
          {multiline ? (
            <textarea value={valueFr} onChange={(e) => handleFrChange(e.target.value)} rows={4} className={`${inputClass} resize-none`} />
          ) : (
            <input type="text" value={valueFr} onChange={(e) => handleFrChange(e.target.value)} className={inputClass} />
          )}
          {showSuggestionsFr && (
            <SuggestionDropdown
              suggestions={suggestionsFr}
              loading={loadingSugFr}
              onSelect={(s) => selectSuggestion(s, "fr")}
              onClose={() => setShowSuggestionsFr(false)}
            />
          )}
        </div>

        {/* EN */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="font-sans text-xs text-brown-400">English</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={translateStatusEn} />
              <button
                type="button"
                onClick={() => fetchSuggestions("en")}
                className="flex items-center gap-1 text-[10px] font-sans text-terracotta-400 hover:text-terracotta-600 transition-colors"
              >
                <Sparkles size={10} /> Suggestions
              </button>
            </div>
          </div>
          {multiline ? (
            <textarea value={valueEn} onChange={(e) => handleEnChange(e.target.value)} rows={4} className={`${inputClass} resize-none`} />
          ) : (
            <input type="text" value={valueEn} onChange={(e) => handleEnChange(e.target.value)} className={inputClass} />
          )}
          {showSuggestionsEn && (
            <SuggestionDropdown
              suggestions={suggestionsEn}
              loading={loadingSugEn}
              onSelect={(s) => selectSuggestion(s, "en")}
              onClose={() => setShowSuggestionsEn(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TranslateStatus }) {
  if (status === "idle") return null;
  return (
    <span className={`font-sans text-[10px] ${status === "translating" ? "text-brown-400" : "text-green-500"}`}>
      {status === "translating" ? "Traduction..." : "Traduit"}
    </span>
  );
}

function SuggestionDropdown({
  suggestions,
  loading,
  onSelect,
  onClose,
}: {
  suggestions: string[];
  loading: boolean;
  onSelect: (s: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl border border-blush-200 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-blush-100">
        <span className="font-sans text-[10px] text-brown-400 uppercase tracking-wide">Suggestions IA</span>
        <button type="button" onClick={onClose} className="font-sans text-[10px] text-brown-300 hover:text-brown-500">
          Fermer
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-terracotta-200 border-t-terracotta-500 rounded-full animate-spin" />
        </div>
      ) : suggestions.length === 0 ? (
        <p className="px-3 py-3 font-sans text-xs text-brown-300">Aucune suggestion</p>
      ) : (
        suggestions.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(s)}
            className="w-full text-left px-3 py-2.5 font-sans text-sm text-brown-700 hover:bg-blush-100 transition-colors border-b border-blush-50 last:border-0"
          >
            {s}
          </button>
        ))
      )}
    </div>
  );
}
