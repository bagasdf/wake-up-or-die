import { getTranslations } from "next-intl/server";
import Dither from "@/components/shaders/dither-background";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export const instant = false;

export default async function Page() {
  const t = await getTranslations("hero");

  return (
    <main className="flex flex-col min-h-screen">
      <section className="mx-3 md:m-12 mt-18 px-8 mb-6 rounded-[2rem] border h-[calc(100vh-6rem)] max-w-screen relative overflow-hidden z-[-10]">
        <div className="absolute inset-0 bg-red-700/40">
          <Dither
            waveColor="#bcbcbc"
            backgroundColor="#00000000"
            ditherMode="noise"
            colorNum={4}
            pixelSize={3}
            waveSpeed={0.01}
            waveFrequency={5.1}
            waveAmplitude={0.3}
            mouseEffect="erase"
            mouseRadius={0.3}
            palette={["#ff0000", "#ff0000", "#ff000000", "#ff0000cc"]}
            scale={1.8}
            contrast={1}
            brightness={0.06}
            mouseStrength={0.3}
            trail={0.5}
            enableMouseInteraction
            clickRipple={false}
            intro
            disableAnimation={false}
            className="opacity-80 dark:opacity-100 rounded-[2rem]"
          />
          <ProgressiveBlur
            height="80%"
            position="bottom"
            className="rounded-[2rem] overflow-hidden"
          />
        </div>
        <div className="flex flex-col items-center justify-center h-full font-serif tracking-tight text-white">
          <h2 className="text-5xl blur-[2px] font-semibold [image-rendering:pixelated] tracking-tighter mix-blend-exclusion">
            {t("title")}
          </h2>
          <p className="font-semibold text-lg md:text-2xl z-10 text-center">
            {t("subtitle")}
          </p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
        </div>
      </section>
    </main>
  );
}
