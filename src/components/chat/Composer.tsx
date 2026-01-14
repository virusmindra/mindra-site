'use client';

import { useRef, useState } from "react";

type Props = {
  onSend: (t: string) => void;
  onSendImage?: (t: string, file: File) => void;
  onVoiceToText?: (blob: Blob) => Promise<string>; // вернет transcript
  disabled?: boolean;
};

export default function Composer({ onSend, onSendImage, onVoiceToText, disabled }: Props) {

  const [text, setText] = useState('');

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);

  // voice
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

const pickMime = () => {
  const cands = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  for (const m of cands) {
    // @ts-ignore
    if (window.MediaRecorder && MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return "";
};

  const doSend = () => {
  const t = text.trim();

  // 1) если есть pendingImage — отправляем через onSendImage
  if (pendingImage && onSendImage) {
    onSendImage(t, pendingImage.file);
    URL.revokeObjectURL(pendingImage.url);
    setPendingImage(null);
    setText("");
    return;
  }

  // 2) иначе обычный текст
  if (t) {
    onSend(t);
    setText("");
  }
};

const toggleRecord = async () => {
  if (disabled) return;

  // stop recording
  if (recording) {
    try { mediaRef.current?.stop(); } catch {}
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunksRef.current = [];

    const mimeType = pickMime();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRef.current = rec;

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    rec.onstop = async () => {
      setRecording(false);

      try { stream.getTracks().forEach((t) => t.stop()); } catch {}

      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });

      chunksRef.current = [];
      mediaRef.current = null;

      // ✅ 1) в текст
      if (onVoiceToText) {
        const transcript = await onVoiceToText(blob).catch(() => "");
        if (transcript) {
          setText((prev) => (prev ? prev + "\n" + transcript : transcript));
        }
      }
    };

    rec.start();
    setRecording(true);
  } catch (e) {
    console.log("mic error", e);
  }
};


return (
  <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--bg)]">
    <div className="mx-auto max-w-3xl">

      {/* ✅ Pending photo preview (ABOVE input row) */}
      {pendingImage ? (
        <div className="pb-2">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-2">
            <img
              src={pendingImage.url}
              alt="preview"
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div className="flex-1 text-xs text-[var(--muted)]">
              Photo attached
            </div>
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(pendingImage.url);
                setPendingImage(null);
              }}
              className="text-xs px-3 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--card)]"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}

      {/* ✅ Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = URL.createObjectURL(f);
          setPendingImage({ file: f, url });
          e.currentTarget.value = "";
        }}
      />

      {/* Input row */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              // ✅ отправка ТОЛЬКО по Enter, и учитывает pendingImage
              doSend();
            }
          }}
          placeholder="Type a message…"
          className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)]
                     px-4 py-3 text-sm outline-none focus:border-[var(--accent-2)]"
          disabled={disabled}
        />

        {/* ✅ Voice button: record -> transcribe -> put text into input (no auto send) */}
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
          className="shrink-0 px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--card)]"
          title={recording ? "Stop recording" : "Record voice"}
        >
          {recording ? "⏹️" : "🎤"}
        </button>

        {/* ✅ Attach photo (no auto send) */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
          className="shrink-0 px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--card)]"
          title="Attach photo"
        >
          📷
        </button>

        {/* ✅ Send button: sends text OR (text+image) */}
        <button
          type="button"
          onClick={doSend}
          className="rounded-xl px-4 py-3 text-sm font-medium text-white
                     bg-[var(--accent)] hover:brightness-95
                     focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/40
                     disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={disabled || (!text.trim() && !pendingImage)}
        >
          Send
        </button>
      </div>
    </div>
  </div>
);
}