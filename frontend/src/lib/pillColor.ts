export function pillColor(crashPoint: number) {
  if (crashPoint < 2) {
    return { text: "#FF4D6A", bg: "rgba(255,59,92,0.12)", border: "rgba(255,59,92,0.3)" };
  }
  if (crashPoint < 5) {
    return { text: "#FFB340", bg: "rgba(255,180,64,0.12)", border: "rgba(255,180,64,0.3)" };
  }
  if (crashPoint < 10) {
    return { text: "#6DC532", bg: "rgba(109,197,50,0.10)", border: "rgba(109,197,50,0.3)" };
  }
  return { text: "#00E5FF", bg: "rgba(0,229,255,0.12)", border: "rgba(0,229,255,0.35)" };
}
