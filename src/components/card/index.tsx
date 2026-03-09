import Image from "next/image";

interface CardProps {
  rank: number | string;
  power: number | string;
  cardImage: string;
  tag: string;
  tagColor?: string;
  subtitle: string;
  description: string;
  packName: string;
  title: string;
  ctaLabel: string;
  onCtaClick?: () => void;
  className?: string;
}

export default function Card({
  rank,
  power,
  cardImage,
  tag,
  tagColor = "#DFB400",
  subtitle,
  description,
  packName,
  title,
  ctaLabel,
  onCtaClick,
  className = "",
}: CardProps) {
  return (
    <div className={`relative w-[368px] h-[515px] ${className}`}>
      {/* Card image (behind the SVG, sized to inner card area) */}
      <Image
        src={cardImage}
        alt={title}
        width={340}
        height={493}
        className="absolute top-[9px] left-[14px] object-cover pointer-events-none"
        draggable={false}
      />
      {/* Card SVG (on top) */}
      <Image
        src="/assets/card.svg"
        alt="Card"
        width={368}
        height={515}
        className="relative inset-0 pointer-events-none"
        draggable={false}
      />
    </div>
  );
}