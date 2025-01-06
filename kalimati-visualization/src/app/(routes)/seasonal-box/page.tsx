"use client";

import React, { useEffect, useRef, useState } from "react";
import Chart, {
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js/auto";
import "@sgratzl/chartjs-chart-boxplot";
import { Autocomplete, AutocompleteItem, Spinner } from "@nextui-org/react";
import { calculateSeasonalMetrics } from "@/app/actions";
import {
  BoxAndWiskers,
  BoxPlotController,
} from "@sgratzl/chartjs-chart-boxplot";

interface SeasonalStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  std: number | null;
}

interface ProductData {
  [season: string]: SeasonalStats;
}

interface BoxplotProps {
  initialData?: {
    [product: string]: ProductData;
  };
}

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BoxPlotController,
  BoxAndWiskers
);

const SeasonalBoxplot: React.FC<BoxplotProps> = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [data, setData] = useState<Map<string, ProductData> | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<string>("Tomato Big(Nepali)");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await calculateSeasonalMetrics();
        if (res) {
          // Convert the response to a Map if it isn't already
          const dataMap =
            res instanceof Map ? res : new Map(Object.entries(res));
          setData(dataMap);
          // Set initial selected product
          if (dataMap.size > 0 && !selectedProduct) {
            setSelectedProduct(Array.from(dataMap.keys())[0]);
          }
        } else {
          throw new Error("Failed to fetch data");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!chartRef.current || !data || !selectedProduct) return;

    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const allSeasons = ["Winter", "Spring", "Summer", "Autumn"];
    const productData = data.get(selectedProduct);

    if (!productData) return;

    // Transform data for Chart.js
    const dataset = {
      label: selectedProduct,
      backgroundColor: "rgba(54, 162, 235, 0.5)",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 1,
      outlierColor: "#999999",
      padding: 10,
      itemRadius: 0,
      data: allSeasons.map((season) => {
        const seasonData = productData[season.toLowerCase()];
        if (!seasonData) return null;

        return {
          min: seasonData.min,
          q1: seasonData.q1,
          median: seasonData.median,
          mean: seasonData.mean,
          q3: seasonData.q3,
          max: seasonData.max,
        };
      }),
    };

    // Create new chart
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: "boxplot" as any,
      data: {
        labels: allSeasons,
        datasets: [dataset],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: `${selectedProduct} Seasonal Distribution`,
            font: {
              size: 16,
              weight: "bold",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Value",
            },
          },
          x: {
            title: {
              display: true,
              text: "Season",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, selectedProduct]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-4 bg-black p-4">
      <Autocomplete
        className="max-w-xs"
        label="Select a commodity"
        defaultSelectedKey={selectedProduct}
        onSelectionChange={(key) => {
          if (key) setSelectedProduct(key.toString());
        }}
      >
        {Array.from(data.keys()).map((item) => (
          <AutocompleteItem key={item} value={item}>
            {item}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <div className="w-full max-w-4xl bg-black rounded-lg p-4">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default SeasonalBoxplot;
