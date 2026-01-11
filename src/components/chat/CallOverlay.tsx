"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function extFromMime(mime: string) {
  const m = (mime || "").toLowerCase();
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4")) return "mp4";
  return "webm";
}

export default function CallOverlay({ userId, lang, wantVoice, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);      // preview audio+video
  const audioOnlyRef = useRef<MediaStream | null>(null);   // recorder only audio

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopGuardTimerRef = useRef<number | null>(null);

  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const [camReady, setCamReady] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const [recState, setRecState] = useState<"idle" | "recording" | "sending">("idle");

  const [lastTranscript, setLastTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");

  const [notice, setNotice] = useState<string | null>(null);

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
    };
  }, [lang]);

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
      } catch (e) {
        console.log("[CALL] getUserMedia error:", e);
        setCamReady(false);
        setNotice(text.noCam);
      }
    };

    start();

    return () => {
      mounted = false;

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
      try {
        if (ttsAudioRef.current) {
          ttsAudioRef.current.pause();
          ttsAudioRef.current.currentTime = 0;
        }
      } catch {}
      ttsAudioRef.current = null;

      // stop tracks
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

  const stopTts = () => {
    const a = ttsAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
    ttsAudioRef.current = null;
  };

  const sendTurn = async (audioBlob: Blob, mime: string) => {
    try {
      const fd = new FormData();
      const ext = extFromMime(mime || audioBlob.type || "audio/webm");
      const fileName = `turn.${ext}`;
      const file = new File([audioBlob], fileName, { type: audioBlob.type || mime || "audio/webm" });

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
        return;
      }

      setLastTranscript(data.transcript || "");
      setLastReply(data.reply || "");

      // play tts if exists
      const ttsUrl = data?.tts?.audioUrl;
      if (ttsUrl) {
        try {
          stopTts();
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
      setNotice("Server error 😕");
      setRecState("idle");
    }
  };

  const startRecording = async () => {
    try {
      stopTts();
      setNotice(null);

      if (recState === "sending") return;
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
    stopTts();
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* background user cam */}
      <div className="absolute inset-0">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover opacity-60" />
        {!camOn && <div className="absolute inset-0 bg-black" />}
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* center Mindra face placeholder */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="w-[280px] h-[280px] rounded-full bg-white/10 border border-white/15 backdrop-blur grid place-items-center">
          <div className="text-white/80 text-sm">Mindra</div>
        </div>
      </div>

      {/* subtitles/last turn (минимально, можно убрать позже) */}
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

        {/* talk button */}
        <div className="mt-5 flex justify-center">
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

        {!camReady && (
          <div className="mt-4 text-center text-white/70 text-sm">
            {notice || text.loading}
          </div>
        )}

        {camReady && notice ? (
          <div className="mt-3 text-center text-white/70 text-sm">{notice}</div>
        ) : null}
      </div>
    </div>
  );
}
