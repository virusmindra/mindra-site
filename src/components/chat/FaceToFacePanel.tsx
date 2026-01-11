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

function pickMimeCandidates() {
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4", // Safari иногда
  ];
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

  const streamRef = useRef<MediaStream | null>(null); // preview audio+video
  const audioOnlyRef = useRef<MediaStream | null>(null); // recorder only audio

  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const stopGuardTimerRef = useRef<number | null>(null);

  const [camReady, setCamReady] = useState(false);
  const [recState, setRecState] = useState<"idle" | "recording" | "sending">("idle");

  const [lastTranscript, setLastTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  const [autoTalk, setAutoTalk] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadRafRef = useRef<number | null>(null);

  const speechOnAtRef = useRef<number | null>(null);
  const silenceOnAtRef = useRef<number | null>(null);

  const localeText = useMemo(() => {
    const isEs = lang === "es";
    return {
      title: "Call",
      subtitle: isEs ? "Toca para hablar con Mindra" : "Tap to talk with Mindra",
      tap: isEs ? "Tocar para hablar" : "Tap to talk",
      stop: isEs ? "Detener" : "Stop",
      sending: isEs ? "Enviando…" : "Sending…",
      loading: isEs ? "Cargando cámara…" : "Loading camera…",
      noMic: isEs ? "Acceso al micrófono denegado" : "Microphone access denied",
      noCam: isEs ? "Acceso a la cámara denegado" : "Camera access denied",
      recNoSupport: isEs ? "Grabación no soportada" : "Recording is not supported",
      youSaid: isEs ? "Tú dijiste:" : "You said:",
      mindra: isEs ? "Mindra:" : "Mindra:",
      signIn: isEs ? "Inicia sesión para usar voz premium." : "Please sign in to use premium voice.",
      unavailable: isEs ? "La voz premium no está disponible ahora." : "Premium voice is not available right now.",
      recError: isEs ? "No pude iniciar la grabación 🙈" : "Could not start recording 🙈",
      stopError: isEs ? "No pude detener la grabación 🙈" : "Could not stop recording 🙈",
      empty: isEs ? "No capté audio 🙈" : "No audio captured 🙈",
    };
  }, [lang]);

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
      audioOnlyRef.current = new MediaStream(stream.getAudioTracks());

      // ✅ стартуем VAD сразу после получения аудио
      startVAD(audioOnlyRef.current);

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

    // ✅ остановить VAD
    stopVAD();

    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {}
    recorderRef.current = null;

    if (stopGuardTimerRef.current) {
      window.clearTimeout(stopGuardTimerRef.current);
      stopGuardTimerRef.current = null;
    }

    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}

    streamRef.current = null;
    audioOnlyRef.current = null;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const createRecorder = (stream: MediaStream) => {
    if (typeof MediaRecorder === "undefined") return null;

    // кандидаты
    for (const mt of pickMimeCandidates()) {
      try {
        if (MediaRecorder.isTypeSupported(mt)) {
          return new MediaRecorder(stream, { mimeType: mt });
        }
      } catch {}
    }

    // fallback без mimeType
    try {
      return new MediaRecorder(stream);
    } catch {
      return null;
    }
  };

  const stopTts = () => {
  const a = ttsAudioRef.current;
  if (!a) return;

  try {
    a.pause();
    a.currentTime = 0;
  } catch {}

  ttsAudioRef.current = null;
};


  const stopVAD = () => {
    if (vadRafRef.current) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;

    try {
      audioCtxRef.current?.close();
    } catch {}
    audioCtxRef.current = null;

    speechOnAtRef.current = null;
    silenceOnAtRef.current = null;
  };

  const startVAD = (stream: MediaStream) => {
    // iOS/Safari: AudioContext часто требует user gesture.
    // Мы запустим, но если будет suspended — просто попробуем resume при клике (ниже добавим).
    stopVAD();

    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx: AudioContext = new AudioCtx();
      audioCtxRef.current = ctx;

      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      src.connect(analyser);

      const buf = new Uint8Array(analyser.fftSize);

      // --- тюнинг порогов ---
      const START_THRESHOLD = 0.018; // чувствительность старта (rms)
      const STOP_THRESHOLD  = 0.012; // порог тишины (rms)
      const START_HOLD_MS   = 120;   // сколько держать "громко" чтобы начать запись
      const SILENCE_MS      = 700;   // сколько тишины чтобы остановить запись

      const loop = () => {
        vadRafRef.current = requestAnimationFrame(loop);

        if (!autoTalk) return;
        if (!analyserRef.current) return;

        // когда отправляем — не трогаем запись
        if (recState === "sending") return;

        // берём сигнал
        analyserRef.current.getByteTimeDomainData(buf);

        // RMS
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();

        const isRecording = recorderRef.current?.state === "recording";

        // --- START logic ---
        if (!isRecording) {
          if (rms >= START_THRESHOLD) {
            if (speechOnAtRef.current == null) speechOnAtRef.current = now;
            const held = now - speechOnAtRef.current;

            if (held >= START_HOLD_MS) {
              // начинаем запись
              silenceOnAtRef.current = null;
              speechOnAtRef.current = null;
              startRecording();
            }
          } else {
            speechOnAtRef.current = null;
          }
          return;
        }

        // --- STOP logic (когда пишем) ---
        if (rms <= STOP_THRESHOLD) {
          if (silenceOnAtRef.current == null) silenceOnAtRef.current = now;
          const silentFor = now - silenceOnAtRef.current;

          if (silentFor >= SILENCE_MS) {
            silenceOnAtRef.current = null;
            stopRecording();
          }
        } else {
          silenceOnAtRef.current = null;
        }
      };

      loop();
    } catch (e) {
      console.log("[CALL] VAD start error:", e);
      stopVAD();
    }
  };


  const startRecording = async () => {
    try {
      stopTts();
      setLocalNotice(null);
      onVoiceNotice?.(null);

      if (recState === "sending") return;
      if (!audioOnlyRef.current) {
        setLocalNotice(localeText.noMic);
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        setLocalNotice(localeText.recNoSupport);
        return;
      }
      if (recorderRef.current && recorderRef.current.state === "recording") return;

      chunksRef.current = [];

      const mr = createRecorder(audioOnlyRef.current);
      if (!mr) {
        setLocalNotice(localeText.recNoSupport);
        return;
      }

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        // ✅ ВАЖНО: именно здесь начинается "sending"
        setRecState("sending");

        // стоп-таймер больше не нужен
        if (stopGuardTimerRef.current) {
          window.clearTimeout(stopGuardTimerRef.current);
          stopGuardTimerRef.current = null;
        }

        try {
          const usedMime = mr.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: usedMime });
          chunksRef.current = [];

          if (!blob || blob.size < 2000) {
            setLocalNotice(localeText.empty);
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

      // ✅ timeslice помогает, чтобы dataavailable точно прилетал
      mr.start(250);
    } catch (e) {
      console.log("[CALL] recorder start error:", e);
      setLocalNotice(localeText.recError);
      setRecState("idle");
    }
  };

  const stopRecording = () => {
    try {
      const r = recorderRef.current;

      // ✅ если реально не пишем — не зависаем
      if (!r || r.state !== "recording") {
        setRecState("idle");
        return;
      }

      // ✅ страховка: если onstop не придёт за 2.5 сек — возвращаем UI
      if (stopGuardTimerRef.current) window.clearTimeout(stopGuardTimerRef.current);
      stopGuardTimerRef.current = window.setTimeout(() => {
        console.log("[CALL] stop guard fired (onstop not received)");
        setLocalNotice(localeText.stopError);
        setRecState("idle");
        try {
          if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
          }
        } catch {}
      }, 2500);

      r.stop();
      // ❗ НЕ ставим sending здесь
    } catch (e) {
      console.log("[CALL] stopRecording error:", e);
      setLocalNotice(localeText.stopError);
      setRecState("idle");
    }
  };

  const toggleRecording = () => {
    if (recState === "recording") stopRecording();
    else startRecording();
  };

  const sendTurn = async (audioBlob: Blob, mime: string) => {
    const uid = userId || "web";
    const want = wantVoice ? "1" : "0";

    try {
      const fd = new FormData();

      const ext = extFromMime(mime || audioBlob.type || "audio/webm");
      const fileName = `turn.${ext}`;
      const file = new File([audioBlob], fileName, { type: audioBlob.type || mime || "audio/webm" });

      fd.append("audio", file);
      fd.append("user_id", uid);
      fd.append("sessionId", "call");
      fd.append("feature", "call");
      fd.append("lang", lang);
      fd.append("wantVoice", want);

      // ✅ Вот тут ДОЛЖЕН появиться /api/call/turn в Network
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
if (ttsUrl) {
  try {
    stopTts(); // на всякий случай

    const a = new Audio(ttsUrl);
    a.preload = "auto";
    a.volume = 1.0;

    a.onended = () => {
      if (ttsAudioRef.current === a) ttsAudioRef.current = null;
    };

    ttsAudioRef.current = a;
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
    <div
    className="flex-1 overflow-y-auto"
    onPointerDown={() => {
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    }}
  >
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
                onClick={toggleRecording}
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
                  ? `● ${localeText.stop}`
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
