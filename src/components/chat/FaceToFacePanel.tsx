"use client";

import { useEffect, useRef, useState } from "react";

export default function FaceToFacePanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<
    "idle" | "listening" | "thinking" | "speaking"
  >("idle");

  useEffect(() => {
    let stream: MediaStream;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error("Camera error", e);
      }
    };

    initCamera();

    return () => {
      stream?.getTracks()?.forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg)]">
      <div className="relative w-full max-w-3xl aspect-video rounded-3xl overflow-hidden border border-[var(--border)]">

        {/* User camera */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        {/* Mindra overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="h-20 w-20 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-[var(--accent)] animate-pulse" />
          </div>

          <div className="text-xs text-[var(--muted)]">
            {status === "idle" && "Ready"}
            {status === "listening" && "Listening…"}
            {status === "thinking" && "Thinking…"}
            {status === "speaking" && "Speaking…"}
          </div>

          <button
            onMouseDown={() => setStatus("listening")}
            onMouseUp={() => setStatus("thinking")}
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-white"
          >
            Hold to talk 🎙️
          </button>
        </div>
      </div>
    </div>
  );
}
