"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AvatarState = "idle" | "listening" | "speaking";

type CallStyle = "winter" | "carnaval";

type Props = {
  userId: string;
  lang: "en" | "es";
  wantVoice: boolean;
  onClose: () => void;
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
    "audio/mp4",
  ];
}

function slowText(t: string) {
  return t
    .replace(/,\s+/g, "… ")
    .replace(/\.\s+/g, "… ")
    .replace(/\?\s+/g, "?… ")
    .replace(/!\s+/g, "!… ");
}


function extFromMime(mime: string) {
  const m = (mime || "").toLowerCase();
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4")) return "mp4";
  return "webm";
}

export default function CallOverlay({ userId, lang, wantVoice, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null); // preview audio+video
  const audioOnlyRef = useRef<MediaStream | null>(null); // recorder only audio

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopGuardTimerRef = useRef<number | null>(null);

  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const CALL_STYLE_KEY = "mindra_call_style";

  const [camReady, setCamReady] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const [avatarState, setAvatarState] = useState<AvatarState>("idle");

  const [recState, setRecState] = useState<"idle" | "recording" | "sending">("idle");

  const [lastTranscript, setLastTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");

  const [notice, setNotice] = useState<string | null>(null);

  // ✅ авто режим (VAD)
  const [autoTalk, setAutoTalk] = useState(true);

  // --- VAD refs ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const speechOnAtRef = useRef<number | null>(null);
  const silenceOnAtRef = useRef<number | null>(null);

  const text = useMemo(() => {
    const isEs = lang === "es";
    return {
      loading: isEs ? "Cargando cámara…" : "Loading camera…",
      noMic: isEs ? "Acceso al micrófono denegado" : "Microphone access denied",
      noCam: isEs ? "Acceso a la cámara denegado" : "Camera access denied",
      recNoSupport: isEs ? "Grabación no soportada" : "Recording is not supported",
      empty: isEs ? "No capté audio 🙈" : "No audio captured 🙈",
      stopError: isEs ? "No pude detener la grabación 🙈" : "Could not stop recording 🙈",
      tap: isEs ? "Tocar para hablar" : "Tap to talk",
      sending: isEs ? "Enviando…" : "Sending…",
      stop: isEs ? "Detener" : "Stop",
      listening: isEs ? "Escuchando…" : "Listening…",
    };
  }, [lang]);

  // -------------------- helpers --------------------

  const stopTts = () => {
    const a = ttsAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
    ttsAudioRef.current = null;
  };

  const createRecorder = (stream: MediaStream) => {
    if (typeof MediaRecorder === "undefined") return null;

    for (const mt of pickMimeCandidates()) {
      try {
        if (MediaRecorder.isTypeSupported(mt)) {
          return new MediaRecorder(stream, { mimeType: mt });
        }
      } catch {}
    }

    try {
      return new MediaRecorder(stream);
    } catch {
      return null;
    }
  };

  // ✅ VAD stop
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

  // ✅ VAD start
  const startVAD = (stream: MediaStream) => {
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

      // --- тюнинг ---
      const START_THRESHOLD = 0.018;
      const STOP_THRESHOLD = 0.010;
      const START_HOLD_MS = 120;
      const SILENCE_MS = 2000;

      const loop = () => {
        vadRafRef.current = requestAnimationFrame(loop);

        if (!autoTalk) return;
        if (!micOn) return;
        if (!analyserRef.current) return;

        // когда отправляем — не трогаем
        if (recState === "sending") return;

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

        // START
        if (!isRecording) {
          if (rms >= START_THRESHOLD) {
            if (speechOnAtRef.current == null) speechOnAtRef.current = now;
            const held = now - speechOnAtRef.current;
            if (held >= START_HOLD_MS) {
              silenceOnAtRef.current = null;
              speechOnAtRef.current = null;
              startRecording();
            }
          } else {
            speechOnAtRef.current = null;
          }
          return;
        }

        // STOP
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

const sendTurn = async (audioBlob: Blob, mime: string) => {
  try {
    const fd = new FormData();
    const ext = extFromMime(mime || audioBlob.type || "audio/webm");
    const fileName = `turn.${ext}`;
    const file = new File([audioBlob], fileName, {
      type: audioBlob.type || mime || "audio/webm",
    });

    fd.append("audio", file);
    fd.append("user_id", userId || "web");
    fd.append("sessionId", "call");
    fd.append("feature", "call");
    fd.append("lang", lang);
    fd.append("wantVoice", wantVoice ? "1" : "0");

    const res = await fetch("/api/call/turn", { method: "POST", body: fd });
    const data: TurnResponse = await res.json().catch(() => ({}));

    if (!data || data.ok === false) {
      setNotice(data?.error || "Server error 😕");
      setRecState("idle");
      setAvatarState("idle");
      return;
    }

    setLastTranscript(data.transcript || "");
    setLastReply(data.reply || "");

    const ttsUrl = data?.tts?.audioUrl;

    if (ttsUrl) {
      try {
        stopTts();

        const a = new Audio(ttsUrl);
        a.preload = "auto";
        a.volume = 1.0;
        a.playbackRate = 0.9;

        setAvatarState("speaking");

        a.onended = () => {
          if (ttsAudioRef.current === a) ttsAudioRef.current = null;
          setAvatarState("idle");
        };

        ttsAudioRef.current = a;
        a.play().catch(() => {});
      } catch {
        setAvatarState("idle");
      }
    } else {
      setAvatarState("idle");
    }

    setRecState("idle");
  } catch (e) {
    console.log("[CALL] sendTurn error:", e);
    setNotice("Server error 😕");
    setRecState("idle");
    setAvatarState("idle");
  }
};

const [callStyle, setCallStyle] = useState<"carnaval" | "winter">("carnaval");

useEffect(() => {
  if (typeof window === "undefined") return;
  const v = localStorage.getItem("mindra_call_style");
  setCallStyle(v === "winter" ? "winter" : "carnaval");
}, []);

const avatarSrc = useMemo(() => {
  const base = callStyle === "carnaval" ? "carnaval" : "winter";
  return {
    idle: `/video/${base}_idle.mp4`,
    talk: `/video/${base}_talk.mp4`,
  };
}, [callStyle]);


  const startRecording = async () => {
    try {
      stopTts();
      setNotice(null);

      if (recState === "sending") return;
      if (!micOn) return;

      if (!audioOnlyRef.current) {
        setNotice(text.noMic);
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        setNotice(text.recNoSupport);
        return;
      }
      if (recorderRef.current && recorderRef.current.state === "recording") return;

      chunksRef.current = [];

      const mr = createRecorder(audioOnlyRef.current);
      if (!mr) {
        setNotice(text.recNoSupport);
        return;
      }

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        setRecState("sending");

        if (stopGuardTimerRef.current) {
          window.clearTimeout(stopGuardTimerRef.current);
          stopGuardTimerRef.current = null;
        }

        try {
          const usedMime = mr.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: usedMime });
          chunksRef.current = [];

          if (!blob || blob.size < 2000) {
            setNotice(text.empty);
            setRecState("idle");
            return;
          }

          await sendTurn(blob, usedMime);
        } catch (e) {
          console.log("[CALL] onstop error:", e);
          setNotice("Server error 😕");
          setRecState("idle");
        }
      };

      recorderRef.current = mr;
      setRecState("recording");
      setAvatarState("listening");
      mr.start(250);
    } catch (e) {
      console.log("[CALL] recorder start error:", e);
      setNotice("Could not start recording 🙈");
      setRecState("idle");
    }
  };

  const stopRecording = () => {
    try {
      const r = recorderRef.current;

      if (!r || r.state !== "recording") {
        setRecState("idle");
        return;
      }

      if (stopGuardTimerRef.current) window.clearTimeout(stopGuardTimerRef.current);
      stopGuardTimerRef.current = window.setTimeout(() => {
        console.log("[CALL] stop guard fired (onstop not received)");
        setNotice(text.stopError);
        setRecState("idle");
        try {
          if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
          }
        } catch {}
      }, 2500);

      r.stop();
      setAvatarState("idle");
    } catch (e) {
      console.log("[CALL] stopRecording error:", e);
      setNotice(text.stopError);
      setRecState("idle");
    }
  };

  const toggleTalk = () => {
    if (recState === "recording") stopRecording();
    else startRecording();
  };

  // -------------------- media init --------------------

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        setNotice(null);

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

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setCamReady(true);

        // ✅ стартуем VAD сразу (если micOn)
        if (audioOnlyRef.current && micOn) startVAD(audioOnlyRef.current);
      } catch (e) {
        console.log("[CALL] getUserMedia error:", e);
        setCamReady(false);
        setNotice(text.noCam);
      }
    };

    start();

    return () => {
      mounted = false;

      // ✅ СЮДА — stopVAD()
      stopVAD();

      // stop recorder
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

      // stop tts
      stopTts();

      // stop tracks
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
      audioOnlyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ если micOn меняется — включаем/выключаем VAD правильно
  useEffect(() => {
    if (!camReady) return;
    if (!audioOnlyRef.current) return;

    if (!micOn) {
      stopRecording();
      stopVAD();
      return;
    }

    // включили мик обратно
    startVAD(audioOnlyRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn, camReady]);

  const toggleMic = () => {
    const s = streamRef.current;
    if (!s) return;
    const t = s.getAudioTracks()[0];
    if (!t) return;
    const next = !micOn;
    t.enabled = next;
    setMicOn(next);
  };

  const toggleCam = () => {
    const s = streamRef.current;
    if (!s) return;
    const t = s.getVideoTracks()[0];
    if (!t) return;
    const next = !camOn;
    t.enabled = next;
    setCamOn(next);
  };

  const endCall = () => {
    // ✅ СЮДА — stopVAD() тоже
    stopVAD();
    stopTts();
    try {
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }
    } catch {}

    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
    audioOnlyRef.current = null;

    onClose();
  };

  // iOS/Safari: поднимаем AudioContext по жесту
  const ensureAudioRunning = () => {
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };

return (
  <div className="fixed inset-0 z-[9999] bg-black" onPointerDown={ensureAudioRunning}>
    {/* ✅ BACKGROUND: Mindra avatar full-screen (crossfade idle/talk) */}
    <div className="h-full w-full object-contain bg-black">
      {/* idle layer */}
      <video
        src={avatarSrc.idle}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
          avatarState === "speaking" ? "opacity-0" : "opacity-100",
        ].join(" ")}
      />

      {/* talk layer */}
      <video
        src={avatarSrc.talk}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
          avatarState === "speaking" ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* лёгкая затемнялка для читаемости UI */}
      <div className="absolute inset-0 bg-black/25" />
    </div>

    {/* ✅ USER CAMERA: small PiP bottom-right */}
    <div className="absolute right-4 bottom-[150px] z-30 w-[120px] h-[170px] rounded-2xl overflow-hidden border border-white/15 bg-black shadow-lg">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      {!camOn && <div className="absolute inset-0 bg-black" />}
    </div>

    {/* subtitles/last turn */}
    {(lastTranscript || lastReply) && (
      <div className="absolute left-0 right-0 bottom-[120px] z-20 px-4">
        <div className="mx-auto max-w-2xl space-y-2">
          {lastTranscript && (
            <div className="rounded-xl bg-black/35 border border-white/10 px-4 py-2 text-white/90 text-sm">
              <span className="text-white/60 mr-2">You:</span>
              {lastTranscript}
            </div>
          )}
          {lastReply && (
            <div className="rounded-xl bg-black/35 border border-white/10 px-4 py-2 text-white/90 text-sm">
              <span className="text-white/60 mr-2">Mindra:</span>
              {lastReply}
            </div>
          )}
        </div>
      </div>
    )}

    {/* bottom controls */}
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-[max(24px,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md flex items-center justify-center gap-6">
        <button
          onClick={toggleCam}
          className="w-12 h-12 rounded-full bg-white/10 border border-white/15 text-white"
          title="Camera"
        >
          {camOn ? "📷" : "🚫"}
        </button>

        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-600 text-white text-xl"
          title="End"
        >
          ✕
        </button>

        <button
          onClick={toggleMic}
          className="w-12 h-12 rounded-full bg-white/10 border border-white/15 text-white"
          title="Mic"
        >
          {micOn ? "🎤" : "🔇"}
        </button>
      </div>

      {/* status */}
      <div className="mt-4 text-center text-white/70 text-sm">
        {!camReady ? (notice || text.loading) : null}
        {camReady && notice ? notice : null}
        {camReady && !notice ? (recState === "recording" ? "● Recording…" : text.listening) : null}
      </div>

      {/* ✅ push-to-talk только если autoTalk OFF */}
      {!autoTalk && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={toggleTalk}
            className={[
              "rounded-full px-6 py-2 text-sm font-medium",
              "border border-white/15",
              "bg-white/10 hover:bg-white/15 text-white",
              recState === "recording" ? "scale-[1.03]" : "",
            ].join(" ")}
          >
            {recState === "sending"
              ? text.sending
              : recState === "recording"
              ? `● ${text.stop}`
              : text.tap}
          </button>
        </div>
      )}

      {/* авто-переключатель (можно потом спрятать) */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={() => {
            const next = !autoTalk;
            setAutoTalk(next);
            if (!next) {
              stopVAD();
            } else if (audioOnlyRef.current && micOn) {
              startVAD(audioOnlyRef.current);
            }
          }}
          className="text-white/60 text-xs underline underline-offset-4"
        >
          {autoTalk ? "Auto: ON" : "Auto: OFF"}
        </button>
      </div>
    </div>
  </div>
);
}