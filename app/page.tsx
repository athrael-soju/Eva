'use client';

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TranscriptProvider } from "./contexts/TranscriptContext";
import { EventProvider } from "./contexts/EventContext";
import { useTranscript } from "./contexts/TranscriptContext";
import { useEvent } from "./contexts/EventContext";
import { useRealtimeSession } from "./hooks/useRealtimeSession";
import useAudioDownload from "./hooks/useAudioDownload";
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import BottomToolbar from "./components/BottomToolbar";
import LoadingAnimation from "./components/LoadingAnimation";
import { createChatAgent } from "./lib/agents/chat";
import { createRealtimeSessionToken } from "./lib/services/sessionService";
import { waitForAudioSilence, setupSpeechAnalysis } from "./lib/services/audioPlayback";
import { SessionStatus } from "./types";
import { GearIcon, Cross1Icon } from "@radix-ui/react-icons";

function AppContent() {
  const searchParams = useSearchParams()!;
  const urlCodec = searchParams.get("codec") || "opus";

  const { addTranscriptBreadcrumb } = useTranscript();
  const { logClientEvent } = useEvent();

  const [isEventsPaneExpanded, setIsEventsPaneExpanded] = useState<boolean>(true);
  const [userText, setUserText] = useState<string>("");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(true);
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shouldReset, setShouldReset] = useState(false);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioFrequencyDataRef = useRef<Uint8Array | null>(null);
  const analysisCleanupRef = useRef<(() => void) | null>(null);

  const {
    connect,
    disconnect,
    status,
    sendUserText,
    sendEvent,
    interrupt,
    mute,
    sessionRef,
  } = useRealtimeSession({
    onConnectionChange: (s) => {
      console.log("Connection status changed:", s);
      if (s === 'DISCONNECTED') {
        setIsSpeaking(false);
        setShouldReset(true);
        setTimeout(() => setShouldReset(false), 100);
        if (analysisCleanupRef.current) {
          analysisCleanupRef.current();
          analysisCleanupRef.current = null;
        }
      }
    },
  });

  const { startRecording, stopRecording, downloadRecording } = useAudioDownload();

  const getSession = useCallback(() => sessionRef.current, [sessionRef]);

  const waitForPlayback = useCallback(() => {
    if (audioElementRef.current) {
      return waitForAudioSilence(audioElementRef.current);
    }
    return Promise.resolve();
  }, []);

  const connectToRealtime = useCallback(async () => {
    if (status !== "DISCONNECTED") return;

    try {
      const audioElement = new Audio();
      audioElement.autoplay = true;
      audioElementRef.current = audioElement;

      const agent = createChatAgent(disconnect, getSession, waitForPlayback);

      await connect({
        getEphemeralKey: async () => {
          const token = await createRealtimeSessionToken();
          return token.client_secret.value;
        },
        initialAgents: [agent],
        audioElement,
        extraContext: {
          addTranscriptBreadcrumb,
        },
      });

      if (audioElement.srcObject) {
        const { cleanup } = setupSpeechAnalysis(
          audioElement.srcObject as MediaStream,
          audioFrequencyDataRef,
          {
            onSpeakingChange: setIsSpeaking,
          }
        );
        analysisCleanupRef.current = cleanup;
        startRecording(audioElement.srcObject as MediaStream);
      }

    } catch (err) {
      console.error("Failed to connect:", err);
    }
  }, [connect, disconnect, getSession, waitForPlayback, addTranscriptBreadcrumb, startRecording, status]);

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    interrupt();
    sendUserText(userText.trim());
    setUserText("");
  };

  const handleTalkButtonDown = () => {
    if (status !== 'CONNECTED') return;
    interrupt();
    setIsPTTUserSpeaking(true);
    sendEvent({ type: 'input_audio_buffer.clear' });
  };

  const handleTalkButtonUp = () => {
    if (status !== 'CONNECTED' || !isPTTUserSpeaking) return;
    setIsPTTUserSpeaking(false);
    sendEvent({ type: 'input_audio_buffer.commit' });
    sendEvent({ type: 'response.create' });
  };

  const onToggleConnection = () => {
    if (status === "CONNECTED" || status === "CONNECTING") {
      disconnect();
      stopRecording();
    } else {
      connectToRealtime();
    }
  };

  const handleCodecChange = (newCodec: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set("codec", newCodec);
    window.location.replace(url.toString());
  };

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.muted = false;
        audioElementRef.current.play().catch(console.warn);
      } else {
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
      mute(!isAudioPlaybackEnabled);
    }
  }, [isAudioPlaybackEnabled, mute]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800 relative font-sans">
      {/* Floating Debug Toggle */}
      <button
        onClick={() => setIsDebugMode(!isDebugMode)}
        className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
      >
        {isDebugMode ? <Cross1Icon /> : <GearIcon />}
      </button>

      <div className="flex flex-1 overflow-hidden relative">
        {isDebugMode ? (
          <div className="flex flex-1 gap-2 p-2 w-full">
            <Transcript
              userText={userText}
              setUserText={setUserText}
              onSendMessage={handleSendTextMessage}
              downloadRecording={downloadRecording}
              canSend={status === "CONNECTED"}
            />
            <Events isExpanded={isEventsPaneExpanded} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-[#d1684e] w-full">
            <LoadingAnimation
              onAnimationComplete={connectToRealtime}
              isAgentConnected={status === 'CONNECTED'}
              isAgentSpeaking={isSpeaking}
              audioFrequencyData={audioFrequencyDataRef.current}
              shouldReset={shouldReset}
            />
          </div>
        )}
      </div>

      {isDebugMode && (
        <BottomToolbar
          sessionStatus={status}
          onToggleConnection={onToggleConnection}
          isPTTActive={isPTTActive}
          setIsPTTActive={setIsPTTActive}
          isPTTUserSpeaking={isPTTUserSpeaking}
          handleTalkButtonDown={handleTalkButtonDown}
          handleTalkButtonUp={handleTalkButtonUp}
          isEventsPaneExpanded={isEventsPaneExpanded}
          setIsEventsPaneExpanded={setIsEventsPaneExpanded}
          isAudioPlaybackEnabled={isAudioPlaybackEnabled}
          setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
          codec={urlCodec}
          onCodecChange={handleCodecChange}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <AppContent />
        </Suspense>
      </EventProvider>
    </TranscriptProvider>
  );
}
