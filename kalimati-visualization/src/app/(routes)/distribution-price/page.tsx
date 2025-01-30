"use client";

import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import {
  getCommodityMonthlyDistribution,
  getAllUniqueCommodities,
} from "@/app/actions";
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

export default function PriceDistribution() {
  const [items, setItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] =
    useState<string>("Tomato Big(Nepali)");
  const [distribution, setDistribution] = useState<
    Map<
      string,
      Map<
        string,
        {
          min: number;
          max: number;
          avg: number;
          count: number;
        }
      >
    >
  >(new Map());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const getDist = async () => {
      const res = await getCommodityMonthlyDistribution();
      console.log(res.get("Tomato Big(Nepali)"));
      setDistribution(res);
    };

    const getUnique = async () => {
      const res = await getAllUniqueCommodities();
      setItems(res);
    };

    getUnique();
    getDist();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !distribution.size) return;

    const commodityData = distribution.get(selectedItem);
    if (!commodityData) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const periods = Array.from(commodityData.keys()).sort();
    const stats = periods.map((period) => commodityData.get(period)!);

    // Determine if we're using monthly or yearly data
    const isMonthly =
      typeof periods[0] === "string" && periods[0].includes("-");

    // Format labels for better display
    const labels = isMonthly
      ? periods.map((period) => {
          const [year, month] = period.split("-");
          return `${month}/${year.slice(2)}`;
        })
      : periods;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Average Price",
            data: stats.map((stat) => stat.avg),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            tension: 0.1,
          },
          {
            label: "Minimum Price",
            data: stats.map((stat) => stat.min),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            tension: 0.1,
          },
          {
            label: "Maximum Price",
            data: stats.map((stat) => stat.max),
            borderColor: "rgb(54, 162, 235)",
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom" as const,
          },
          title: {
            display: true,
            text: `${
              isMonthly ? "Monthly" : "Yearly"
            } Price Distribution for ${selectedItem}`,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Price",
            },
          },
          x: {
            title: {
              display: true,
              text: isMonthly ? "Month/Year" : "Year",
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
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
  }, [selectedItem, distribution]);

  return (
    <div className="flex flex-col items-center gap-4 mt-4 p-4">
      <Autocomplete
        className="max-w-xs"
        label="Select a commodity"
        defaultSelectedKey={selectedItem}
        onSelectionChange={(key) => {
          if (key) setSelectedItem(key.toString());
        }}
      >
        {items.map((item) => (
          <AutocompleteItem key={item}>{item}</AutocompleteItem>
        ))}
      </Autocomplete>
      <div className="w-full max-w-4xl rounded-lg p-4">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
