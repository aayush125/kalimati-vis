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
  const buttons = [
    {
      label: "7D",
      days: 7,
    },
    {
      label: "1M",
      days: 30,
    },
    {
      label: "1Y",
      days: 365,
    },
    {
      label: "5Y",
      days: 1825,
    },
    {
      label: "10Y",
      days: 3650,
    },
  ];
  const [selected, setSelected] = useState(7);

  async function fetchData() {
    if (!chartRef.current) return;

    chartRef.current.data = await getFamilyPriceHistory(family, selected);
    chartRef.current.data.datasets.forEach((e) => {
      // @ts-ignore
      e.pointRadius = selected > 100 ? 1 : 5;
    });
    // @ts-ignore
    chartRef.current.options.scales.x.ticks.font.size = selected > 365 ? 16 : 20;
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
            ticks: {
              font: {
                size: 14,
              }
            }
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

  useEffect(() => {
    fetchData();
  }, [selected]);

  return (
      <div className="w-full max-w-4xl rounded-lg p-4">
        <div className="flex pb-4 flex-row gap-2">
          {buttons.map((btn) => (
            <button
              key={btn.label}
              onClick={async () => {
                setSelected(btn.days);
              }}
              className={`w-10 rounded-lg transition ${
                selected === btn.days
                  ? "bg-stone-200 text-black"
                  : "bg-transparent text-gray-500 hover:bg-gray-100"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <canvas ref={canvasRef} />
      </div>
  );
}
