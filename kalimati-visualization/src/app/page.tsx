"use client";

import LineGraph from "@/components/HomeLineGraph";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center w-full h-screen border-2 border-red-500">
      <div className="flex flex-row justiy-center items-center w-full h-5/6 border-2 border-pink-500">
        <div className="border-2 border-blue-500 w-3/5 h-full">
          <div className="border-2 border-cyan-500 w-full h-1/2 flex justify-center items-center">
            Yesterday's arrival piechart goes here
          </div>
          <div className="border-2 border-yellow-500 w-full h-1/2 flex flex-col justify-center items-center">
            <LineGraph />
          </div>
        </div>
        <div className="border-2 border-green-500 w-2/5 h-full flex justify-center items-center">
          Seasonal common items and evergreen list go here
        </div>
      </div>
      <div className="flex justify-center items-center w-full h-1/6 border-2 border-white">
        Explore more button here
      </div>
    </div>
  );
}
