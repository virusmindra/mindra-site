"use client";

import { useRef, useState } from "react";

type Props = {
  onSend: (t: string) => void;
  onSendImages?: (caption: string, files: File[]) => Promise<void>;
  onVoiceToText?: (blob: Blob) => Promise<string>;
  disabled?: boolean;
};

export default function Composer({ onSend, onSendImages, onVoiceToText, disabled }: Props) {
  const [text, setText] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const MAX_PHOTOS = 5;

  const [pendingImages, setPendingImages] = useState<Array<{ file: File; url: string }>>([]);

  // voice
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const doSend = () => {
    const t = text.trim();

    // 1) если есть фотки — отправляем одним запросом
    if (pendingImages.length && onSendImages) {
      onSendImages(t, pendingImages.map((p) => p.file));

      pendingImages.forEach((p) => URL.revokeObjectURL(p.url));
      setPendingImages([]);
      setText("");
      return;
    }

    // 2) иначе обычный текст
    if (t) {
      onSend(t);
      setText("");
    }
  };

  return (
    <div
      className="border-t border-[var(--border)] bg-[var(--bg)] px-3 sm:px-6 py-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div className="mx-auto w-full max-w-3xl">
        {/* ✅ Pending photo preview (ABOVE input row) */}
        {pendingImages.length ? (
          <div className="pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-[var(--muted)]">
                {pendingImages.length} / {MAX_PHOTOS} photos attached
              </div>

              <button
                type="button"
                onClick={() => {
                  pendingImages.forEach((p) => URL.revokeObjectURL(p.url));
                  setPendingImages([]);
                }}
                className="text-xs px-3 py-1 rounded-lg border border-[var(--border)]"
              >
                Remove all
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {pendingImages.map((p, idx) => (
                <div key={p.url} className="relative">
                  <img
                    src={p.url}
                    alt="preview"
                    className="h-16 w-16 rounded-lg object-cover border border-[var(--border)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.url);
                      setPendingImages((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ✅ Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;

            setPendingImages((prev) => {
              const left = MAX_PHOTOS - prev.length;
              const picked = files.slice(0, left);

              const mapped = picked.map((f) => ({
                file: f,
                url: URL.createObjectURL(f),
              }));

              return [...prev, ...mapped];
            });

            e.currentTarget.value = "";
          }}
        />

        {/* Input row */}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend();
              }
            }}
            onFocus={() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  window.dispatchEvent(new Event("mindra:scroll-bottom"));
                  setTimeout(
                    () => window.dispatchEvent(new Event("mindra:scroll-bottom")),
                    120
                  );
                });
              });
            }}
            placeholder="Type a message…"
            className="flex-1 min-w-0 h-12 rounded-2xl bg-[var(--card)] border border-[var(--border)]
                       px-4 text-base outline-none focus:border-[var(--accent-2)]"
            disabled={disabled}
          />

          {/* ✅ Voice button */}
          <button
            type="button"
            disabled={disabled || !onVoiceToText}
            onClick={async () => {
              if (!onVoiceToText) return;

              if (!recording) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mr = new MediaRecorder(stream);
                chunksRef.current = [];

                mr.ondataavailable = (ev) => {
                  if (ev.data.size > 0) chunksRef.current.push(ev.data);
                };

                mr.onstop = async () => {
                  stream.getTracks().forEach((t) => t.stop());
                  const blob = new Blob(chunksRef.current, {
                    type: mr.mimeType || "audio/webm",
                  });

                  const transcript = await onVoiceToText(blob).catch(() => "");
                  if (transcript) {
                    setText((prev) => (prev ? prev + "\n" + transcript : transcript));
                  }
                };

                mediaRef.current = mr;
                mr.start();
                setRecording(true);
                return;
              }

              mediaRef.current?.stop();
              setRecording(false);
            }}
            className="shrink-0 h-12 w-12 rounded-2xl border border-[var(--border)] hover:bg-[var(--card)] active:scale-[0.98]"
            title={recording ? "Stop recording" : "Record voice"}
          >
            {recording ? "⏹️" : "🎤"}
          </button>

          {/* ✅ Attach photo */}
          <button
            type="button"
            disabled={disabled || pendingImages.length >= MAX_PHOTOS}
            onClick={() => fileRef.current?.click()}
            className="shrink-0 h-12 w-12 rounded-2xl border border-[var(--border)] disabled:opacity-40 active:scale-[0.98]"
            title={pendingImages.length >= MAX_PHOTOS ? "Max 5 photos" : "Attach photo"}
          >
            📷
          </button>

          {/* ✅ Send */}
          <button
            type="button"
            onClick={doSend}
            className="shrink-0 h-12 rounded-2xl px-4 text-base font-medium text-white
                       bg-[var(--accent)] hover:brightness-95
                       focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/40
                       disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={disabled || (!text.trim() && pendingImages.length === 0)}
          >
            <span className="sm:hidden">➤</span>
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
