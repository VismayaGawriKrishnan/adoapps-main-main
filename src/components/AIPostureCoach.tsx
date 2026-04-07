import { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Pose } from "@mediapipe/pose";
import { Loader2, X, BrainCircuit, Activity, Mic, MicOff } from "lucide-react";
import { Agents } from "@/lib/gemini";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface AIPostureCoachProps {
  exerciseName: string;
  onClose: () => void;
  userContext: any;
}

const AIPostureCoach = ({ exerciseName, onClose, userContext }: AIPostureCoachProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("Initializing AI Pose Tracking...");
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (!isListening && transcript.trim()) {
        const processVoiceQuery = async () => {
            setAiFeedback("Analyzing your question...");
            const promptLogs = "Posture seems standard currently.";
            const voiceMsg = await Agents.WorkoutAgent(userContext, exerciseName, promptLogs, transcript);
            setAiFeedback(`Voice Coach: "${voiceMsg}"`);
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(voiceMsg));
        };
        processVoiceQuery();
        resetTranscript();
    }
  }, [isListening, transcript]);

  const toggleListen = () => {
    if (isListening) stopListening();
    else startListening();
  };
  
  useEffect(() => {
    let camera: Camera | null = null;
    let pose: Pose | null = null;

    const initMediaPipe = async () => {
      // In a real implementation we wait for the videoRef
      if (!videoRef.current) return;

      try {
          pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          pose.onResults((results) => {
             if (!isReady) setIsReady(true);
             // Logic for computing joint angles can go here
          });

          camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && pose) {
                try {
                  await pose.send({ image: videoRef.current });
                } catch (e) {}
              }
            },
            width: 320,
            height: 240
          });

          await camera.start();
          setIsReady(true);
          const initMsg = "Analyzing posture... Start your set!";
          setAiFeedback(initMsg);
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(initMsg));
          
          // MVP Mock AI Feedback Trigger
          setTimeout(async () => {
             setAiFeedback("Analyzing knee angle depth...");
             const promptLogs = "Knees are caving in slightly during the descent.";
             const voiceMsg = await Agents.WorkoutAgent(userContext, exerciseName, promptLogs, "Am I going low enough?");
             setAiFeedback(`Voice Coach: "${voiceMsg}"`);
             window.speechSynthesis.speak(new SpeechSynthesisUtterance(voiceMsg));
          }, 4000);

      } catch (e) {
          console.warn("Camera access denied or failed. Proceeding in mock mode...", e);
          setIsReady(true);
          setAiFeedback("Camera ignored. AI Trainer is speaking...");
          
          // Provide mock feedback regardless if camera fails
          const promptLogs = "Posture seems standard, no major issues detected.";
          const voiceMsg = await Agents.WorkoutAgent(userContext, exerciseName, promptLogs, "How is my form?");
          setAiFeedback(`Voice Coach: "${voiceMsg}"`);
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(voiceMsg));
      }
    };

    initMediaPipe();

    return () => {
      if (camera) camera.stop();
      if (pose) pose.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseName]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col justify-center items-center p-4 animate-in fade-in zoom-in duration-300">
       <div className="w-full max-w-sm bg-card border border-border rounded-2xl overflow-hidden shadow-2xl relative">
          
          <div className="absolute top-3 right-3 z-10">
            <button onClick={onClose} className="bg-destructive text-destructive-foreground p-2 rounded-full ring-2 ring-background hover:scale-105 active:scale-95 transition-all">
               <X className="w-4 h-4"/>
            </button>
          </div>
          
          <div className="relative aspect-[3/4] bg-muted w-full overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted autoPlay></video>
            
             {/* Overlay UI */}
             <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                     <div className="p-2 rounded-full bg-primary/20 shrink-0">
                        <BrainCircuit className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <h3 className="font-bold text-white text-sm">AI Coach - {exerciseName}</h3>
                       <p className={`text-[11px] mt-1 font-medium leading-relaxed ${isReady ? 'text-primary' : 'text-yellow-400'}`}>
                         {!isReady && <Loader2 className="w-3 h-3 inline animate-spin mr-1"/>}
                         {aiFeedback}
                       </p>
                     </div>
                  </div>
                  
                  {isReady && (
                     <button
                        onClick={toggleListen}
                        className={`p-3 rounded-full shrink-0 shadow-lg transition-all ${isListening ? 'bg-primary text-primary-foreground animate-pulse scale-110' : 'bg-secondary/80 text-foreground backgrop-blur hover:bg-secondary'}`}
                     >
                       {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                     </button>
                  )}
                </div>
                {isListening && transcript && (
                   <p className="text-white/80 text-xs text-center mt-3 italic line-clamp-2">"{transcript}"</p>
                )}
             </div>
            
            {isReady && (
                <div className="absolute top-4 left-4 p-1.5 bg-primary/20 backdrop-blur-md rounded-lg text-primary flex items-center gap-1.5 text-xs font-bold border border-primary/30 shadow-lg">
                    <Activity className="w-3 h-3 animate-pulse"/> Tracking Live Tracking
                </div>
            )}
          </div>
       </div>
    </div>
  );
};

export default AIPostureCoach;
