import Image from "next/image";

export default function HowToGetStarted() {
  return (
    <section className="w-full flex flex-col items-center w-full max-w-7xl lg:max-w-5xl xl:max-w-7xl mx-auto lg:px-10 xl:px-4 lg:py-10">
      {/* Mobile */}
      <Image
        src="/assets/mobile-how-to-get-started.svg"
        alt="How to get started"
        width={522}
        height={700}
        className="w-full h-auto pointer-events-none lg:hidden"
        draggable={false}
      />

      {/* Desktop */}
      <Image
        src="/assets/desktop-how-to-get-started.svg"
        alt="How to get started"
        width={1440}
        height={600}
        className="hidden lg:block w-full h-auto pointer-events-none"
        draggable={false}
      />
    </section>
  );
}
