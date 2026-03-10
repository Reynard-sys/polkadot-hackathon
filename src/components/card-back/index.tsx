import Image from "next/image";

interface CardBackProps {
    width?: number;
    height?: number;
    className?: string;
}

export default function CardBack({
    width = 369,
    height = 515,
    className = "",
}: CardBackProps) {
    return (
        <Image
            src="/assets/card-back.svg"
            alt="Card Back"
            width={width}
            height={height}
            className={className}
        />
    );
}
