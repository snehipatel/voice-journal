import { type Stage, STAGE_VIDEOS, STAGE_EMOJI } from "./types";

interface TreeVideoProps {
  stage: Stage;
  missedRecently: boolean;
  stageIndex: number;
}

export function TreeVideo({ stage }: TreeVideoProps) {
  const src = STAGE_VIDEOS[stage];

  return (
    <video
      key={src}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      poster=""
      onError={(e) => {
        // Hide broken video, show nothing
        (e.target as HTMLVideoElement).style.display = "none";
        const fallback = (e.target as HTMLVideoElement).nextElementSibling;
        if (fallback) (fallback as HTMLElement).style.display = "flex";
      }}
    />
  );
}
