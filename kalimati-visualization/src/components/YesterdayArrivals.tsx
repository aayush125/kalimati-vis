"use client";

import { Chart, ChartConfiguration, ChartData } from "chart.js/auto";
import { useEffect, useRef } from "react";
import { uniqueArrivalsYesterday } from "@/app/actions";

export default function ArrivalPieChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!chartRef.current) return;

      const colors: string[] = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
      ];

      try {
        const arrivalData = await uniqueArrivalsYesterday();

        console.log(arrivalData);

        const labels = Array.from(arrivalData.keys());
        const values = Array.from(arrivalData.values());

        console.log("labels: ", labels);
        console.log("values: ", values);

        const chartData: ChartData = {
          labels: labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors.slice(0, labels.length),
              borderColor: "white",
              borderWidth: 1,
            },
          ],
        };

        const config: ChartConfiguration = {
          type: "pie",
          data: chartData,
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: true,
                text: "Yesterday's Arrivals",
                font: {
                  size: 16,
                },
              },
            },
          },
        };

        const ctx = chartRef.current?.getContext("2d");
        if (!ctx) return;

        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, config);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return <canvas ref={chartRef} />;
}
