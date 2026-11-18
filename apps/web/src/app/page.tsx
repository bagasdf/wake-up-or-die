import Dither from "@/components/shaders/dither-background";

export const instant = false;

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen">
      <section className="m-12 rounded-[2rem] border h-[calc(100vh-6rem)] max-w-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-amber-400/40">
          <Dither
            waveColor="#bcbcbc"
            backgroundColor="#00000000"
            ditherMode="noise"
            colorNum={4}
            pixelSize={2}
            waveSpeed={0.01}
            waveFrequency={5.1}
            waveAmplitude={0.3}
            mouseEffect="erase"
            mouseRadius={0.3}
            palette={["#0b0603", "#5c2e05", "#d97706", "#ffd08a"]}
            scale={1.8}
            contrast={1}
            brightness={0.06}
            mouseStrength={1}
            trail={0.5}
            enableMouseInteraction
            clickRipple={false}
            intro
            disableAnimation={false}
          />
        </div>
        <div className="flex flex-col items-center justify-center h-full z-20">
          <h2 className="text-4xl">lockinme</h2>
        </div>
      </section>
    </main>
  );
}
