"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  userId?: string; // залогиненный id, иначе "web"
  lang?: "en" | "es";
  wantVoice?: boolean; // premiumVoiceEnabled
  onVoiceNotice?: (msg: string | null) => void;
};

type TurnResponse = {
  ok?: boolean;
  transcript?: string;
  reply?: string;
  tts?: { audioUrl?: string; provider?: string; seconds?: number } | null;
  voiceBlocked?: boolean;
  voiceReason?: "login_required" | "temporarily_unavailable" | string | null;
  error?: string;
};

function pickMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4", // иногда Safari
  ];

  for (const t of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    } catch {}
  }
  return ""; // пусть браузер сам выберет
}

function extFromMime(mime: string) {
  const m = (mime || "").toLowerCase();
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4")) return "mp4";
  return "webm";
}

export default function FaceToFacePanel({
  userId,
  lang = "en",
  wantVoice = true,
  onVoiceNotice,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [camReady, setCamReady] = useState(false);
  const [recState, setRecState] = useState<"idle" | "recording" | "sending">("idle");

  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastReply, setLastReply] = useState<string>("");
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  const localeText = useMemo(() => {
    const isEs = lang === "es";
    return {
      title: "Call",
      subtitle: isEs ? "Mantén presionado para hablar con Mindra" : "Hold to talk with Mindra",
      hold: isEs ? "Mantén para hablar" : "Hold to talk",
      sending: isEs ? "Enviando…" : "Sending…",
      loadingCam: isEs ? "Cargando cámara…" : "Loading camera…",
      noMic: isEs ? "Acceso al micrófono denegado" : "Microphone access denied",
      noCam: isEs ? "Acceso a la cámara denegado" : "Camera access denied",
      youSaid: isEs ? "Tú dijiste:" : "You said:",
      mindra: isEs ? "Mindra:" : "Mindra:",
      signIn: isEs ? "Inicia sesión para usar voz premium." : "Please sign in to use premium voice.",
      unavailable: isEs
        ? "La voz premium no está disponible ahora."
        : "Premium voice is not available right now.",
      recorderNotSupported: isEs ? "Grabación no soportada en este navegador" : "Recording is not supported in this browser",
    };
  }, [lang]);

  // --- init camera + mic once ---
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        setLocalNotice(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!mounted) return;

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setCamReady(true);
      } catch (e) {
        console.log("[CALL] getUserMedia error:", e);
        setCamReady(false);
        setLocalNotice(localeText.noCam);
      }
    };

    start();

    return () => {
      mounted = false;
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;

      try {
        recorderRef.current?.stop();
      } catch {}
      recorderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // важно: не зависим от lang, иначе дергаешь разрешения снова

  const stopRecorderSafe = () => {
    try {
      const r = recorderRef.current;
      if (r && r.state !== "inactive") r.stop();
    } catch {}
  };

  const startRecording = async () => {
    try {
      setLocalNotice(null);
      onVoiceNotice?.(null);

      if (recState === "sending") return;
      if (!streamRef.current) {
        setLocalNotice(localeText.noMic);
        return;
      }

      if (typeof MediaRecorder === "undefined") {
        setLocalNotice(localeText.recorderNotSupported);
        return;
      }

      // если уже пишем — выходим
      if (recorderRef.current && recorderRef.current.state === "recording") return;

      chunksRef.current = [];

      const mimeType = pickMimeType();
      const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onerror = (ev) => {
        console.log("[CALL] recorder error", ev);
      };

      mr.onstop = async () => {
        try {
          const usedMime = mr.mimeType || mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: usedMime });
          chunksRef.current = [];

          // если вдруг пусто — просто вернёмся в idle
          if (!blob || blob.size < 10) {
            setRecState("idle");
            return;
          }

          await sendTurn(blob, usedMime);
        } catch (e) {
          console.log("[CALL] onstop error:", e);
          setLocalNotice("Server error 😕");
          setRecState("idle");
        }
      };

      recorderRef.current = mr;
      setRecState("recording");
      mr.start();
      // console.log("[CALL] recorder started", mr.mimeType);
    } catch (e) {
      console.log("[CALL] recorder start error:", e);
      setLocalNotice(localeText.noMic);
      setRecState("idle");
    }
  };

  const stopRecording = () => {
    if (recState !== "recording") return;
    setRecState("sending");
    stopRecorderSafe();
  };

  const sendTurn = async (audioBlob: Blob, mime: string) => {
    const uid = userId || "web";
    const want = wantVoice ? "1" : "0";

    try {
      const fd = new FormData();

      const ext = extFromMime(mime || audioBlob.type || "audio/webm");
      const fileName = `turn.${ext}`;

      // важно: отправляем как File с типом
      const file = new File([audioBlob], fileName, { type: audioBlob.type || mime || "audio/webm" });

      fd.append("audio", file);
      fd.append("user_id", uid);
      fd.append("sessionId", "call");
      fd.append("feature", "call");
      fd.append("lang", lang);
      fd.append("wantVoice", want);

      const res = await fetch("/api/call/turn", { method: "POST", body: fd });
      const data: TurnResponse = await res.json().catch(() => ({}));

      if (!data || data.ok === false) {
        setLocalNotice(data?.error || "Server error 😕");
        setRecState("idle");
        return;
      }

      setLastTranscript(data.transcript || "");
      setLastReply(data.reply || "");

      if (data.voiceBlocked) {
        if (data.voiceReason === "login_required") {
          setLocalNotice(localeText.signIn);
          onVoiceNotice?.(localeText.signIn);
        } else {
          setLocalNotice(localeText.unavailable);
          onVoiceNotice?.(localeText.unavailable);
        }
      } else {
        setLocalNotice(null);
        onVoiceNotice?.(null);
      }

      const ttsUrl = data?.tts?.audioUrl;
      if (ttsUrl && typeof ttsUrl === "string") {
        try {
          const a = new Audio(ttsUrl);
          a.play().catch(() => {});
        } catch {}
      }

      setRecState("idle");
    } catch (e) {
      console.log("[CALL] sendTurn error:", e);
      setLocalNotice("Server error 😕");
      setRecState("idle");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-6">
        <div className="mb-4">
          <div className="text-2xl font-semibold">{localeText.title}</div>
          <div className="text-sm text-[var(--muted)]">{localeText.subtitle}</div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="relative overflow-hidden rounded-2xl bg-black/30">
            <video ref={videoRef} playsInline muted className="h-[340px] w-full object-cover" />

            {!camReady ? (
              <div className="absolute inset-0 grid place-items-center text-sm text-[var(--muted)]">
                {localNotice || localeText.loadingCam}
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startRecording();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopRecording();
                }}
                className={[
                  "rounded-full px-5 py-2 text-sm font-medium",
                  "border border-[var(--border)]",
                  "bg-[var(--btn)] hover:bg-[var(--btnHover)]",
                  "text-white shadow",
                  recState === "recording" ? "scale-[1.03]" : "",
                ].join(" ")}
              >
                {recState === "sending"
                  ? localeText.sending
                  : recState === "recording"
                  ? "● Recording…"
                  : localeText.hold}
              </button>
            </div>
          </div>

          {(lastTranscript || lastReply) && (
            <div className="mt-4 space-y-3">
              {lastTranscript ? (
                <div className="rounded-xl border border-[var(--border)] bg-black/20 p-3">
                  <div className="text-xs text-[var(--muted)] mb-1">{localeText.youSaid}</div>
                  <div className="text-sm">{lastTranscript}</div>
                </div>
              ) : null}

              {lastReply ? (
                <div className="rounded-xl border border-[var(--border)] bg-black/20 p-3">
                  <div className="text-xs text-[var(--muted)] mb-1">{localeText.mindra}</div>
                  <div className="text-sm whitespace-pre-wrap">{lastReply}</div>
                </div>
              ) : null}

              {localNotice ? (
                <div className="text-xs text-[var(--muted)] text-right">{localNotice}</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
