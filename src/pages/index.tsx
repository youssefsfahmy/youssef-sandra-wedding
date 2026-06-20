import Image from "next/image";
import Head from "@/components/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const handleRSVPClick = () => {
    const { partyId } = router.query;
    if (partyId && typeof partyId === "string") {
      router.push(`/form?partyId=${partyId}`);
    } else {
      router.push("/form");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full bg-[#636d557d]">
      <Head />

      <div className="w-full bg-[#f6efe4] flex items-center justify-center snap-start relative max-w-screen-sm">
        <Image
          src="/image.png"
          alt="Youssef & Sandra Wedding"
          layout="responsive"
          width={3000}
          height={11491}
          priority
        />
        <Link
          href="https://maps.app.goo.gl/d2sknEVTQ11hD3SQ7"
          target="_blank"
          className="font-[emoji] font-semibold text-[#f4eee2] px-6 py-[0.25rem] rounded-full bg-[#c76945] hover:bg-[#de9376]
          text-[0.65rem] md:text-lg transition-all duration-300 ease-in-out text-center"
          style={{
            position: "absolute",
            bottom: "31.35%",
            left: "50%",
            width: "45%",
            transform: "translateX(-50%)",
          }}
        >
          CLICK FOR LOCATION
        </Link>
        <button
          onClick={handleRSVPClick}
          className="font-[emoji] font-semibold text-[#f4eee2] px-6 py-[0.25rem] rounded-full bg-[#c76945] hover:bg-[#de9376]
           text-[0.65rem] md:text-lg transition-all duration-300 ease-in-out text-center"
          style={{
            position: "absolute",
            bottom: "25.6%",
            left: "50%",
            width: "45%",
            transform: "translateX(-50%)",
          }}
        >
          CLICK TO RSVP
        </button>
      </div>
    </div>
  );
}
