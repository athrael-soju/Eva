'use client';

import { useLoadingAnimation } from '../hooks/useLoadingAnimation';

interface LoadingAnimationProps {
  onAnimationComplete?: () => void;
  isAgentConnected?: boolean;
  isAgentSpeaking?: boolean;
  audioFrequencyData?: Uint8Array | null;
  shouldReset?: boolean;
}

export default function LoadingAnimation({
  onAnimationComplete,
  isAgentConnected,
  isAgentSpeaking,
  audioFrequencyData,
  shouldReset,
}: LoadingAnimationProps) {
  const containerRef = useLoadingAnimation({
    onAnimationComplete,
    isAgentConnected,
    isAgentSpeaking,
    audioFrequencyData,
    shouldReset,
  });

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <div
        ref={containerRef}
        className="absolute left-0 right-0 top-0 bottom-0 overflow-hidden"
      />
    </div>
  );
}
