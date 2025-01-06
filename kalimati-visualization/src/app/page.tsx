"use client";

import LineGraph from "@/components/HomeLineGraph";
import SeasonData from "@/components/SeasonalData";
import ArrivalPieChart from "@/components/YesterdayArrivals";
import { Divider } from "@nextui-org/react";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center w-full h-screen">
      <div className="flex flex-row justiy-center items-center w-full h-5/6">
        <div className="w-3/5 h-full">
          <div className="w-full h-1/2 flex justify-center items-center">
            <ArrivalPieChart />
          </div>
          <div className="w-full flex justify-center items-center my-5">
            <Divider className="w-1/2" />
          </div>
          <div className="w-full h-1/2 flex flex-col justify-center items-center">
            <LineGraph />
          </div>
        </div>
        <div className="w-2/5 h-full flex justify-center items-center">
          <SeasonData />
        </div>
      </div>
      <div className="flex justify-center items-center w-full h-1/6"></div>
    </div>
  );
}
