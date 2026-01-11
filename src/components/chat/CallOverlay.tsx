"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  userId: string;
  lang: "en" | "es";
  wantVoice: boolean;
  onClose: () => void;
};

export default function CallOverlay({ userId, lang, wantVoice, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camReady, setCamReady] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        setNotice(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
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
        setNotice("Camera/Mic access denied");
        setCamReady(false);
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
  }, []);

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
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover opacity-60"
        />
        {!camOn && <div className="absolute inset-0 bg-black" />}
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* center Mindra face (пока заглушка) */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="w-[280px] h-[280px] rounded-full bg-white/10 border border-white/15 backdrop-blur grid place-items-center">
          <div className="text-white/80 text-sm">Mindra</div>
        </div>
      </div>

      {/* bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-10">
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

        {!camReady && (
          <div className="mt-4 text-center text-white/70 text-sm">
            {notice || "Loading camera…"}
          </div>
        )}
      </div>
    </div>
  );
}
