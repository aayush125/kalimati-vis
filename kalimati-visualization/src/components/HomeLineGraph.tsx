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

export default function LineGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchDataAndRenderChart = async () => {
      if (!canvasRef.current) return;

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      try {
        const avgs = await lastSevenAverages();
        const labels = Array.from(avgs.keys());
        const values = Array.from(avgs.values());

        const config: ChartConfiguration = {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Average Prices",
                data: values,
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
                position: "bottom",
              },
              title: {
                display: true,
                text: "Average commodity prices for the last 7 days",
              },
            },
          },
        };

        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          chartRef.current = new Chart(ctx, config);
        }
      } catch (error) {
        console.error("Error fetching data for the chart:", error);
      }
    };

    fetchDataAndRenderChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
