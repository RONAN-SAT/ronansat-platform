"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ExternalLink, LockKeyhole, X } from "lucide-react";

type TestTokenDialogProps = {
  open: boolean;
  testTitle: string;
  isSubmitting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (token: string) => Promise<boolean>;
};

export function TestTokenDialog({
  open,
  testTitle,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: TestTokenDialogProps) {
  const [token, setToken] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const unlocked = await onSubmit(token);

    if (unlocked) {
      setToken("");
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setToken("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink-fg/20 px-4 py-6" role="presentation">
      <div className="absolute inset-0" onClick={handleClose} />
      <section
        aria-labelledby="test-token-title"
        aria-modal="true"
        className="relative w-full max-w-xl rounded-[2.5rem] border-4 border-ink-fg bg-surface-white p-6 brutal-shadow-lg sm:p-8"
        role="dialog"
      >
        <button
          aria-label="Close token dialog"
          className="absolute right-5 top-5 rounded-full border-2 border-ink-fg bg-paper-bg p-2 brutal-shadow-sm transition-all hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          disabled={isSubmitting}
          onClick={handleClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="workbook-sticker w-fit bg-accent-2 text-white">
          <LockKeyhole className="h-4 w-4" />
          Locked Test
        </div>
        <h2 id="test-token-title" className="mt-5 max-w-[16ch] font-display text-4xl font-black uppercase leading-none tracking-tight text-ink-fg sm:text-5xl">
          Enter token
        </h2>
        <p className="mt-4 text-sm font-bold leading-6 text-ink-fg sm:text-base">
          {testTitle}
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-fg/75">
          Hoàn thành các mục trong bài Giveaway để nhận token{" "}
          <a
            className="inline-flex items-center gap-1 font-bold underline decoration-2 underline-offset-4"
            href="https://web.facebook.com/ronansat"
            rel="noreferrer"
            target="_blank"
          >
            Ronan SAT
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-ink-fg" htmlFor="test-access-token">
            Token
          </label>
          <input
            ref={inputRef}
            autoComplete="off"
            className="w-full rounded-xl border-2 border-ink-fg bg-white px-4 py-3 text-base font-bold text-ink-fg outline-none transition-all placeholder:text-ink-fg/40 focus:ring-0 focus:brutal-shadow-sm"
            disabled={isSubmitting}
            id="test-access-token"
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste your token"
            type="text"
            value={token}
          />

          {error ? (
            <div className="rounded-2xl border-2 border-ink-fg bg-accent-3 px-4 py-3 text-sm font-bold leading-6 text-white">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <button className="workbook-button w-full justify-center" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Checking..." : "Unlock Test"}
            </button>
            <button
              className="workbook-button workbook-button-secondary w-full justify-center sm:w-auto"
              disabled={isSubmitting}
              onClick={handleClose}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
