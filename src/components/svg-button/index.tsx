
export default function SvgButton({ children, onClick, className = "", ...props }) {
    return (
        <button
            onClick={onClick}

            className={`relative flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none ${className}`}
            {...props}
        >
            <svg
                className="absolute inset-0 w-full h-full cursor-pointer"
                viewBox="0 0 1059 74"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="btnFill" x1="529" y1="7" x2="529" y2="56" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0144BD" />
                        <stop offset="1" stopColor="#192871" />
                    </linearGradient>
                    <linearGradient id="btnStroke" x1="1046" y1="31" x2="13" y2="31" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#020C7B" />
                        <stop offset="0.5" stopColor="#040825" />
                        <stop offset="1" stopColor="#000D61" />
                    </linearGradient>
                </defs>
                <path
                    d="M1028.26 7.77734C1033.5 7.77735 1038.3 11.095 1040.72 16.3848L1044.37 24.3633C1046.49 28.996 1046.49 34.5157 1044.37 39.1484L1040.72 47.127C1038.3 52.4165 1033.5 55.7344 1028.26 55.7344H32.9607C27.0422 55.7344 21.6141 52.4155 18.8801 47.125L14.7572 39.1465C12.3635 34.5144 12.3634 28.9963 14.7572 24.3643L18.8801 16.3857C21.6141 11.0953 27.0422 7.77734 32.9607 7.77734L1028.26 7.77734Z"
                    fill="url(#btnFill)"
                />
                <path
                    d="M32.9609 8.77734H1028.26C1033.06 8.77735 1037.53 11.817 1039.81 16.8008L1043.46 24.7793C1045.46 29.1479 1045.46 34.3639 1043.46 38.7324L1039.81 46.7109C1037.53 51.6946 1033.06 54.7344 1028.26 54.7344H32.9609C27.4193 54.7344 22.3323 51.6268 19.7686 46.666L15.6455 38.6875C13.4006 34.3434 13.4005 29.1673 15.6455 24.8232L19.7686 16.8447C22.3323 11.884 27.4192 8.77734 32.9609 8.77734Z"
                    stroke="url(#btnStroke)"
                    strokeWidth="2"
                />
            </svg>

            <span className="relative z-10 text-white font-bold text-sm tracking-wide pb-3 cursor-pointer">
                {children}
            </span>
        </button>
    );
}