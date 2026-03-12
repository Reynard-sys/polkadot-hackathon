import Image from "next/image";

interface PackProps {
  imageSrc: string;
  imageAlt?: string;
  packName: string;
  packInfo: string;
}

export default function Pack({
  imageSrc,
  imageAlt = "Pack",
  packName,
  packInfo,
}: PackProps) {
  return (
    <div
      className="flex gap-5.25 px-4 py-6.25 rounded-xl"
      style={{
        background: "linear-gradient(to bottom, #2d3548, #030a30)",
      }}
    >
      {/* Left column — pack image with NEW badge */}
      <div className="relative shrink-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={140}
          height={200}
          className="object-contain"
        />
        <span className="uppercase absolute top-[-2] right-[-2] text-white text-sm leading-5 bg-[#8855FF] font-bold px-1.5 py-0.5 rounded-full">
          NEW
        </span>
      </div>

      {/* Right column — pack details */}
      <div className="flex flex-col flex-1">
        <h2 className="text-white font-bold text-lg leading-tight">
          {packName}
        </h2>

        <p className="text-white/60 text-sm mt-1">{packInfo}</p>

        <p className="text-white/50 text-sm mt-3 leading-relaxed">
          Lorem ipsum dolor sit amet consectetur. Lorem ipsum dolor sit amet
          consectetur consectetur.
        </p>

        {/* Open Pack button pinned to bottom */}
        <button className="flex justify-center items-center pt-4">
          <Image
            src="/assets/open-pack-btn.svg"
            alt="Open Pack"
            width={160}
            height={47}
            className="w-full h-auto"
          />
        </button>
      </div>
    </div>
  );
}
