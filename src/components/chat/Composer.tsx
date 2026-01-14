'use client';

import { useRef, useState } from "react";

export default function Composer({
  onSend,
  disabled,
  onVoice,
}: {
  onSend: (t: string) => void;
  disabled?: boolean;
  onVoice?: (file: File) => void;
}) {
  const [text, setText] = useState('');

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

const toggleRecord = async () => {
  if (disabled) return;

  // stop -> отправляем
  if (recording) {
    try {
      mediaRef.current?.stop();
    } catch {}
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

    rec.onstop = () => {
      setRecording(false);

      // stop tracks
      try { stream.getTracks().forEach((t) => t.stop()); } catch {}

      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
      const ext = (rec.mimeType || "").includes("ogg") ? "ogg" : (rec.mimeType || "").includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `voice.${ext}`, { type: blob.type });

      chunksRef.current = [];
      mediaRef.current = null;

      onVoice?.(file);
    };

    rec.start();
    setRecording(true);
  } catch (e) {
    console.log("mic error", e);
    // можешь тут показать маленький alert/текст
  }
};

  return (
    <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--bg)]">
      <div className="mx-auto max-w-3xl flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) {
                onSend(text.trim());
                setText('');
              }
            }
          }}
          placeholder="Type a message…"
          className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)]
                     px-4 py-3 text-sm outline-none focus:border-[var(--accent-2)]"
          disabled={disabled}
        />
<button
  type="button"
  onClick={toggleRecord}
  disabled={disabled}
  className="shrink-0 px-3 py-2 rounded-lg border border-[var(--border)]"
  title={recording ? "Stop" : "Record"}
>
  {recording ? "⏹️" : "🎙️"}
</button>

        <button
          onClick={() => {
            if (text.trim()) {
              onSend(text.trim());
              setText('');
            }
          }}
          className="rounded-xl px-4 py-3 text-sm font-medium text-white
                     bg-[var(--accent)] hover:brightness-95
                     focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/40
                     disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={disabled || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
