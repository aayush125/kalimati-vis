"use client";

import { useEffect, useState } from "react";
import { lastSevenAverages } from "@/app/actions";

export default function LineGraph() {
  const [last7Avg, setLast7Avg] = useState<number[]>([]);

  useEffect(() => {
    const avg = async () => {
      setLast7Avg(await lastSevenAverages());
    };

    avg();
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center">
      {" "}
      <div className="flex flex-col justify-center items-center">
        {!last7Avg
          ? "Loading data"
          : last7Avg.map((avg) => <div key={avg}>{avg}</div>)}
      </div>
    </div>
  );
}
