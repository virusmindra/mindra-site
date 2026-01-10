"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  userId?: string;
  lang?: "en" | "es";
  wantVoice?: boolean;
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
    "audio/mp4", // Safari иногда
  ];
  for (const t of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    } catch {}
  }
  return "";
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
  const stoppingRef = useRef(false);

  const [camReady, setCamReady] = useState(false);
  const [recState, setRecState] = useState<"idle" | "recording" | "sending">("idle");
  const [tapModeRecording, setTapModeRecording] = useState(false);

  const [lastTranscript, setLastTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  const localeText = useMemo(() => {
    const isEs = lang === "es";
    return {
      title: "Call",
      subtitle: isEs ? "Toca para hablar con Mindra" : "Tap to talk with Mindra",
      tap: isEs ? "Toca para hablar" : "Tap to talk",
      recording: isEs ? "● Grabando…" : "● Recording…",
      sending: isEs ? "Enviando…" : "Sending…",
      noMic: isEs ? "Acceso al micrófono denegado" : "Microphone access denied",
      noCam: isEs ? "Acceso a la cámara denegado" : "Camera access denied",
      youSaid: isEs ? "Tú dijiste:" : "You said:",
      mindra: isEs ? "Mindra:" : "Mindra:",
      signIn: isEs ? "Inicia sesión para usar voz premium." : "Please sign in to use premium voice.",
      unavailable: isEs ? "Voz premium no disponible ahora." : "Premium voice is not available right now.",
      loading: isEs ? "Cargando cámara…" : "Loading camera…",
    };
  }, [lang]);

  // init cam + mic
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });

        if (!mounted) return;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setCamReady(true);
        setLocalNotice(null);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecorderSafe = () => {
  try {
    const r = recorderRef.current;
    if (r && r.state !== "inactive") {
      try { r.requestData(); } catch {}
      r.stop();
    }
  } catch {}
};


  const sendTurn = async (audioBlob: Blob) => {
    const uid = userId || "web";
    const want = wantVoice ? "1" : "0";

    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, "turn.webm");
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
        setTapModeRecording(false);
        return;
      }

      setLastTranscript(data.transcript || "");
      setLastReply(data.reply || "");

      if (data.voiceBlocked) {
        const msg = data.voiceReason === "login_required" ? localeText.signIn : localeText.unavailable;
        setLocalNotice(msg);
        onVoiceNotice?.(msg);
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
      setTapModeRecording(false);
    } catch (e) {
      console.log("[CALL] sendTurn error:", e);
      setLocalNotice("Server error 😕");
      setRecState("idle");
      setTapModeRecording(false);
    }
  };

  const startRecording = () => {
    if (recState === "sending") return;
    if (!streamRef.current) {
      setLocalNotice(localeText.noMic);
      return;
    }

    setLocalNotice(null);
    onVoiceNotice?.(null);

    try {
      chunksRef.current = [];
      stoppingRef.current = false;

      // ✅ записываем ТОЛЬКО аудио
      const audioOnly = new MediaStream(streamRef.current.getAudioTracks());

      const mimeType = pickMimeType();
      const mr = new MediaRecorder(audioOnly, mimeType ? { mimeType } : undefined);

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        // защита от двойного stop
        if (!stoppingRef.current) return;
        stoppingRef.current = false;

        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        chunksRef.current = [];

        await sendTurn(blob);
      };

      recorderRef.current = mr;
      setRecState("recording");
      setTapModeRecording(true);
      mr.start(250); // можно давать таймслайсы
    } catch (e) {
      console.log("[CALL] recorder start error:", e);
      setLocalNotice(localeText.noMic);
      setRecState("idle");
      setTapModeRecording(false);
    }
  };

  const stopRecording = () => {
    if (recState !== "recording") return;
    setRecState("sending");
    stopRecorderSafe();
  };

  const toggleTap = () => {
    if (tapModeRecording) stopRecording();
    else startRecording();
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
                {localNotice || localeText.loading}
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <button
                onClick={toggleTap}
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
                  ? localeText.recording
                  : localeText.tap}
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
