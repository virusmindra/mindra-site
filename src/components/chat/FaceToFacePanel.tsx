"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  userId?: string; // если хочешь пробросить залогиненного id (иначе "web")
  lang?: "en" | "es";
  wantVoice?: boolean; // твой premiumVoiceEnabled
  onVoiceNotice?: (msg: string | null) => void; // чтобы показать внизу как voiceNotice
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
  const isRecordingRef = useRef(false);

  const [camReady, setCamReady] = useState(false);
  const [recState, setRecState] = useState<"idle" | "recording" | "sending">("idle");

  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastReply, setLastReply] = useState<string>("");
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  const localeText = useMemo(() => {
    const isEs = lang === "es";
    return {
      title: isEs ? "Call" : "Call",
      subtitle: isEs ? "Hold to talk with Mindra" : "Hold to talk with Mindra",
      hold: isEs ? "Hold to talk" : "Hold to talk",
      sending: isEs ? "Sending…" : "Sending…",
      noMic: isEs ? "Microphone access denied" : "Microphone access denied",
      noCam: isEs ? "Camera access denied" : "Camera access denied",
      youSaid: isEs ? "You said:" : "You said:",
      mindra: isEs ? "Mindra:" : "Mindra:",
      tryAgain: isEs ? "Try again." : "Try again.",
      signIn: isEs ? "Please sign in to use premium voice." : "Please sign in to use premium voice.",
      unavailable: isEs ? "Premium voice is not available right now." : "Premium voice is not available right now.",
    };
  }, [lang]);

  // --- init camera + mic ---
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
      } catch (e) {
        console.log("[CALL] getUserMedia error:", e);
        setCamReady(false);
        setLocalNotice(localeText.noCam);
      }
    };

    start();

    return () => {
      mounted = false;
      // stop tracks
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const stopRecorderSafe = () => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {}
  };

  const startRecording = async () => {
    setLocalNotice(null);
    onVoiceNotice?.(null);

    if (recState === "sending") return;
    if (!streamRef.current) {
      setLocalNotice(localeText.noMic);
      return;
    }

    // choose best mime
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";

    try {
      chunksRef.current = [];
      const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        if (!isRecordingRef.current) return;
        isRecordingRef.current = false;

        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        chunksRef.current = [];

        await sendTurn(blob);
      };

      recorderRef.current = mr;
      isRecordingRef.current = true;
      setRecState("recording");
      mr.start();
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

  const sendTurn = async (audioBlob: Blob) => {
    const uid = userId || "web";
    const want = wantVoice ? "1" : "0";

    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, "turn.webm");
      fd.append("user_id", uid);
      fd.append("sessionId", "call"); // можно потом сделать реальную сессию
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

      // handle voice blocked notice
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

      // autoplay tts
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
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-[340px] w-full object-cover"
            />

            {!camReady ? (
              <div className="absolute inset-0 grid place-items-center text-sm text-[var(--muted)]">
                {localNotice || "Loading camera…"}
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
