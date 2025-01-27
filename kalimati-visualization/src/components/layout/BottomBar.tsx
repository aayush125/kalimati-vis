"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-black p-4 flex flex-row justify-center items-center gap-4">
      <Link
        href="/"
        className={`${
          pathname === "/" ? "text-blue-500" : "text-white"
        } hover:text-blue-700`}
      >
        Home
      </Link>
      <Link
        href="/distribution-price"
        className={`${
          pathname === "/distribution-price" ? "text-blue-500" : "text-white"
        } hover:text-blue-700`}
      >
        Price Distribution
      </Link>
      <Link
        href="/seasonal-box"
        className={`${
          pathname === "/seasonal-box" ? "text-blue-500" : "text-white"
        } hover:text-blue-700`}
      >
        Seasonal Box plot
      </Link>
      <Link
        href="/price-vs-arrival"
        className={`${
          pathname === "/price-vs-arrival" ? "text-blue-500" : "text-white"
        } hover:text-blue-700`}
      >
        Price vs Arrival
      </Link>
      <Link
        href="/arrival-trends"
        className={`${
          pathname === "/arrival-trends" ? "text-blue-500" : "text-white"
        } hover:text-blue-700`}
      >
        Arrival Trends
      </Link>
    </div>
  );
}
