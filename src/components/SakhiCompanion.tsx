import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

type SakhiAnimation = "idle" | "wave" | "bounce" | "sad" | "celebrate";

interface SakhiState {
  animation: SakhiAnimation;
  message: string;
  sparkles: boolean;
}

const IDLE_PHRASES = [
  "Every small step matters. 🌱",
  "You're growing every day. 🌟",
  "I believe in you. 💛",
  "You're doing amazing things. ✨",
  "Take a deep breath. You've got this. 🌸",
  "Progress, not perfection. 💪",
  "I'm here with you, always. 🤗",
];

function getSakhiState(
  streak: number,
  todayLogged: boolean,
  missedRecently: boolean,
  justOpened: boolean
): SakhiState {
  if (justOpened) {
    return { animation: "wave", message: "Hey, I'm glad you're here today! 👋", sparkles: true };
  }
  if (todayLogged && streak >= 7) {
    return { animation: "celebrate", message: `${streak}-day streak! You're absolutely incredible! 🎉`, sparkles: true };
  }
  if (todayLogged) {
    return { animation: "bounce", message: "I'm proud of you for showing up today! 🌟", sparkles: true };
  }
  if (missedRecently) {
    return { animation: "sad", message: "It's okay. Let's start again today. I'm right here with you. 💛", sparkles: false };
  }
  const idx = new Date().getDate() % IDLE_PHRASES.length;
  return { animation: "idle", message: IDLE_PHRASES[idx], sparkles: false };
}

interface SakhiCompanionProps {
  streak: number;
  todayLogged: boolean;
  missedRecently: boolean;
}

export const SakhiCompanion = ({ streak, todayLogged, missedRecently }: SakhiCompanionProps) => {
  const [justOpened, setJustOpened] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const state = getSakhiState(streak, todayLogged, missedRecently, justOpened);

  useEffect(() => {
    const timer = setTimeout(() => setJustOpened(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const clean = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "").trim();
    if (!clean) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.92;
    utterance.pitch = 1.15;
    utterance.volume = 0.7;

    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      "Google UK English Female", "Google US English Female", "Microsoft Jenny",
      "Microsoft Zira", "Samantha", "Karen", "Moira", "Tessa", "Fiona",
    ];
    let femaleVoice = voices.find((v) => preferred.some((p) => v.name.includes(p)));
    if (!femaleVoice) femaleVoice = voices.find((v) => v.name.toLowerCase().includes("female"));
    if (!femaleVoice) femaleVoice = voices.find((v) => /samantha|zira|jenny|karen|moira|tessa|fiona|alice|ellen|victoria/i.test(v.name));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (!hasSpoken && justOpened) {
      const timer = setTimeout(() => { speak(state.message); setHasSpoken(true); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [justOpened, hasSpoken, speak, state.message]);

  useEffect(() => {
    if (todayLogged && !justOpened) {
      speak("I'm proud of you for showing up today!");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayLogged]);

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/30 p-4 sm:p-6 overflow-hidden relative">
      {/* Soft glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="flex items-center gap-2 mb-3 relative z-10">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">Sakhi – Your Companion</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
        {/* Video Container */}
        <div className="w-full sm:w-96 h-64 sm:h-72 rounded-xl overflow-hidden relative bg-gradient-to-b from-primary/10 to-accent/5 flex items-center justify-center">
          <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover rounded-xl"
          >
            <source src="public\sakhi\Sakhi.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Speech bubble + text */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.message}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative"
            >
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-primary/20">
                <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                  {state.message}
                </p>
                {speaking && (
                  <motion.div className="flex gap-1 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
              <div className="absolute -left-1 bottom-2 w-3 h-3 bg-card/80 rotate-45 border-l border-b border-primary/20 hidden sm:block" />
            </motion.div>
          </AnimatePresence>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {state.animation === "wave" && "👋 Sakhi is greeting you"}
              {state.animation === "bounce" && "😄 Sakhi is happy for you"}
              {state.animation === "celebrate" && "🎉 Sakhi is celebrating"}
              {state.animation === "sad" && "🤗 Sakhi misses you"}
              {state.animation === "idle" && "✨ Sakhi is here with you"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
