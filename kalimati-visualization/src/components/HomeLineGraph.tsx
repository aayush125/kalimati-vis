"use client";

import { useEffect, useState, useRef } from "react";
import { lastSevenAverages, calculateAverages, calculateAveragesFast } from "@/app/actions";
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
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController
);

Chart.defaults.font.size = 20;

export default function LineGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [chartData, setChartData] = useState<{
    labels: string[];
    values: number[];
  } | null>(null);

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
  const [selected, setSelected] = useState(buttons[0]);

  const fetchNewData = async (numDays: number) => {
    try {
      const avgs = await calculateAveragesFast(numDays);
      setChartData({
        labels: avgs.labels,
        values: avgs.data,
      });
    } catch (error) {
      console.error("Error fetching data for the chart:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const avgs = await calculateAverages("7D");
        setChartData({
          labels: Array.from(avgs.keys()),
          values: Array.from(avgs.values()),
        });
      } catch (error) {
        console.error("Error fetching data for the chart:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !chartData) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "Average Prices",
            data: chartData.values,
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            tension: 0.1,
            pointRadius: selected.days > 100 ? 1 : 5,
            pointHoverRadius: selected.days > 100 ? 3 : 7,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Average commodity prices for the last " + selected.label,
            font: {
              size: 16,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: selected.days > 365 ? 16 : 20,
              },
            },
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData, selected]);

  return (
    <>
      <div className="flex flex-row gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={async () => {
              setSelected(btn);
              await fetchNewData(btn.days);
            }}
            className={`w-10 rounded-lg transition ${
              selected.days === btn.days
                ? "bg-stone-200 text-black"
                : "bg-transparent text-gray-500 hover:bg-gray-100"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} />
    </>
  );
}
