"use client";

import { useEffect, useState, useRef, Key } from "react";
import { getFamilyList, priceVsArrival } from "@/app/actions";
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
  ScatterController,
} from "chart.js";
import { Autocomplete, AutocompleteItem, Switch } from "@nextui-org/react";
import ChartTrendline from "chartjs-plugin-trendline";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  ScatterController,
  ChartTrendline
);

const trendlineColor = "rgba(0, 0, 0, 0.6)";
const trendlineConfig = {
  colorMin: trendlineColor,
  colorMax: trendlineColor,
  width: 4,
  lineStyle: "solid",
  projection: false,
  yAxisKey: "y",
  xAxisKey: "x",
};

export default function PriceArrivalScatter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const initializing = useRef<boolean>(false);
  const [families, setFamilies] = useState<{ label: string; key: string }[]>(
    []
  );
  const [lineEnabled, setLineEnabled] = useState<boolean>(true);

  async function onSelect(id: Key | null) {
    if (!id) return;
    if (!chartRef.current) return;
    const res = await priceVsArrival(id.toString());
    console.log(res);
    chartRef.current.data.datasets[0].data = res;
    chartRef.current.update();
  }

  function onLineToggle(enabled: boolean) {
    setLineEnabled(enabled);

    if (!chartRef.current) return;
    // @ts-ignore
    chartRef.current.data.datasets[0].trendlineLinear = enabled
      ? trendlineConfig
      : undefined;
    chartRef.current.update();
  }

  useEffect(() => {
    const fetchDataAndRenderChart = async () => {
      if (initializing.current) return;
      initializing.current = true;

      if (!canvasRef.current) return;

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      try {
        setFamilies(await getFamilyList());

        const config: ChartConfiguration = {
          type: "scatter",
          data: {
            datasets: [
              {
                label: "Price vs Arrival",
                data: [],
                // borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.5)",
                // @ts-ignore
                trendlineLinear: trendlineConfig,
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
                text: "Scatter Plot - Price vs Arrival",
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Arrival (kg)",
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Price (Rs)",
                },
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
      initializing.current = false;
    };

    fetchDataAndRenderChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
        initializing.current = false;
      }
    };
  }, []);

  return (
    <div className="flex flex-col p-4 justify-center items-center w-full h-screen">
      <div className="pb-20 flex gap-10 flex-row">
        <Autocomplete
          className="max-w-xs"
          defaultItems={families}
          label="Commodity"
          placeholder="Select a commodity"
          onSelectionChange={onSelect}
        >
          {(f) => <AutocompleteItem>{f.label}</AutocompleteItem>}
        </Autocomplete>
        <Switch isSelected={lineEnabled} onValueChange={onLineToggle}>
          Trendline
        </Switch>
      </div>
      <div className="w-full max-w-6xl">
        <canvas className="w-full h-full" ref={canvasRef} />
      </div>
    </div>
  );
}
