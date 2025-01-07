"use client";

import { useEffect, useState, useRef } from "react";
import { lastSevenAverages } from "@/app/actions";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const avgs = await lastSevenAverages();
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
  }, [chartData]);

  return <canvas ref={canvasRef} />;
}
