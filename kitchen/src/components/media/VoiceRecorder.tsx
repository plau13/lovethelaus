"use client";

import { useRef, useState } from "react";
import { uploadVoice } from "@/app/actions/media";

/** Preferred first; Safari only supports the mp4 container. */
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function extensionFor(mimeType: string): string {
  return mimeType.startsWith("audio/mp4") ? "m4a" : "webm";
}

export function VoiceRecorder({ recipeId }: { recipeId: string }) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    setError(null);
    const mimeType = pickMimeType();
    if (!mimeType || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot record audio. Choose a file instead.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked. Allow it in your browser, or choose a file instead.");
      return;
    }
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] });
      const file = new File([blob], `memo.${extensionFor(mimeType)}`, { type: blob.type });
      setClip({ file, url: URL.createObjectURL(blob) });
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    stopTimer();
    setRecording(false);
  }

  function reset() {
    stopRecording();
    if (clip) {
      URL.revokeObjectURL(clip.url);
    }
    setClip(null);
    setSeconds(0);
    setError(null);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn w-fit rounded-xl border border-line bg-white px-4 py-2 hover:bg-paper"
      >
        Add a voice memo
      </button>
    );
  }

  return (
    <form action={uploadVoice} className="grid gap-3 rounded-2xl border border-line bg-white p-4" encType="multipart/form-data">
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="durationSeconds" value={clip ? String(seconds) : ""} />
      <p className="text-sm text-muted">
        Record them telling it in their own words — the part that never makes it onto the card.
      </p>

      {error ? <p className="text-sm text-clay">{error}</p> : null}

      {clip ? (
        <div className="grid gap-2">
          <audio controls src={clip.url} className="w-full" />
          <button type="button" onClick={reset} className="w-fit text-sm text-clay">
            Record again
          </button>
          {/* The recorded blob rides along as the file input's value. */}
          <RecordedFileInput file={clip.file} />
        </div>
      ) : recording ? (
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="size-3 animate-pulse rounded-full bg-clay" />
          <span className="text-lg tabular-nums">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
          <button type="button" onClick={stopRecording} className="btn rounded-xl border border-line px-4 py-2">
            Stop
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <button type="button" onClick={startRecording} className="btn w-fit rounded-xl bg-clay px-4 py-2 text-white hover:bg-clay-dark">
            Start recording
          </button>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Or choose a recording</span>
            <input type="file" name="file" accept="audio/*" />
          </label>
        </div>
      )}

      <label className="grid gap-1">
        <span className="text-sm font-medium">Caption (optional)</span>
        <input name="caption" placeholder="Mom on why it has to rest" className="rounded-xl border border-line bg-white px-3 py-3" />
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn rounded-xl bg-clay px-4 py-2 text-white hover:bg-clay-dark">
          Save the memo
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-xl border border-line px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/** A DataTransfer lets us put the recorded Blob into a real file input so the form posts it. */
function RecordedFileInput({ file }: { file: File }) {
  return (
    <input
      type="file"
      name="file"
      className="hidden"
      ref={(node) => {
        if (!node) {
          return;
        }
        const transfer = new DataTransfer();
        transfer.items.add(file);
        node.files = transfer.files;
      }}
    />
  );
}
