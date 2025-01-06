"use client";

import { useEffect, useState, useRef } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  ChartConfiguration,
  Colors
} from "chart.js";
import { getFamilyPriceHistory } from "@/app/actions";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  Colors
);

export default function PriceHistory({ family }: { family: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  async function fetchData() {
    if (!chartRef.current) return;

    chartRef.current.data = await getFamilyPriceHistory(family);
    chartRef.current.update();
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom" as const,
          },
        },
        scales: {
          y: {
            // beginAtZero: true,
            title: {
              display: true,
              text: "Price (Rs.)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Day",
            },
            // ticks: {
            //   maxRotation: 45,
            //   minRotation: 45,
            // },
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    fetchData();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
      <div className="w-full max-w-4xl rounded-lg p-4">
        <canvas ref={canvasRef} />
      </div>
  );
}
