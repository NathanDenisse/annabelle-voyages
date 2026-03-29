"use client";

import { useRef, useEffect, useCallback } from "react";

interface SmartBilingualFieldProps {
  label: string;
  valueFr: string;
  valueEn: string;
  onChangeFr: (v: string) => void;
  onChangeEn: (v: string) => void;
  multiline?: boolean;
}

export default function SmartBilingualField({
  label,
  valueFr,
  valueEn,
  onChangeFr,
  onChangeEn,
  multiline = false,
}: SmartBilingualFieldProps) {
  const inputClass =
    "w-full bg-cream-100 border border-blush-200 rounded-xl px-4 py-3 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors";

  const frRef = useRef<HTMLTextAreaElement>(null);
  const enRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
  }, []);

  useEffect(() => {
    if (multiline) {
      autoResize(frRef.current);
      autoResize(enRef.current);
    }
  }, [valueFr, valueEn, multiline, autoResize]);

  return (
    <div>
      <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-2">
        {label}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* FR */}
        <div>
          <p className="font-sans text-xs text-brown-400 mb-1">Français</p>
          {multiline ? (
            <textarea
              ref={frRef}
              value={valueFr}
              onChange={(e) => onChangeFr(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none overflow-hidden`}
            />
          ) : (
            <input type="text" value={valueFr} onChange={(e) => onChangeFr(e.target.value)} className={inputClass} />
          )}
        </div>

        {/* EN */}
        <div>
          <p className="font-sans text-xs text-brown-400 mb-1">English</p>
          {multiline ? (
            <textarea
              ref={enRef}
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none overflow-hidden`}
            />
          ) : (
            <input type="text" value={valueEn} onChange={(e) => onChangeEn(e.target.value)} className={inputClass} />
          )}
        </div>
      </div>
    </div>
  );
}
