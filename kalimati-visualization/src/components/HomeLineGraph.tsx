"use client";

import { useEffect, useState, useRef } from "react";
import { lastSevenAverages, calculateAverages } from "@/app/actions";
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

  const [selected, setSelected] = useState("7D");
  const buttons = ["7D", "1M", "1Y"];

  const fetchNewData = async (selectionStr: String) => {
    let selection: "7D" | "1M" | "1Y";
    switch (selectionStr) {
      case "7D":
        selection = "7D";
        break;
      case "1M":
        selection = "1M";
        break;
      case "1Y":
        selection = "1Y";
        break;
      default:
        selection = "7D";
        break;
    }
    try {
      const avgs = await calculateAverages(selection);
      setChartData({
        labels: Array.from(avgs.keys()),
        values: Array.from(avgs.values()),
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
            pointRadius: selected === "1Y" ? 1 : 5,
            pointHoverRadius: selected === "1Y" ? 3 : 7,
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
            text: "Average commodity prices for the last 7 days",
            font: {
              size: 16,
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
            key={btn}
            onClick={async () => {
              setSelected(btn);
              await fetchNewData(btn);
            }}
            className={`w-10 rounded-lg transition ${
              selected === btn
                ? "bg-stone-200 text-black"
                : "bg-transparent text-gray-500 hover:bg-gray-100"
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} />
    </>
  );
}
