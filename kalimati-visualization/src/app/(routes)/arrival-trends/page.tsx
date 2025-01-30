"use client";

import { useEffect, useState, useRef, Key } from "react";
import { getFamilyList, getArrivalBarChartYearlyData } from "@/app/actions";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ChartConfiguration,
  BarController,
} from "chart.js";
import { Autocomplete, AutocompleteItem, Radio, RadioGroup, Switch } from "@nextui-org/react";

Chart.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  BarElement,
  BarController,
);
Chart.defaults.font.size = 20;

export default function ArrivalTrendsBar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const initializing = useRef<boolean>(false);
  const family = useRef<string>("")

  const [families, setFamilies] = useState<{ label: string; key: string }[]>(
    []
  );
  const [selected, setSelected] = useState<"year" | "season">("year");

  async function onSelect(id: Key | null) {
    if (!id) return;
    family.current = id.toString();
    await updateChart(selected);
  }

  async function updateChart(groupBy: "year" | "season") {
    if (!chartRef.current) return;
    
    const res = await getArrivalBarChartYearlyData(family.current, groupBy);
    console.log(res);
    // @ts-ignore
    chartRef.current.data.datasets[0].data = res.data;
    chartRef.current.data.labels = res.labels;
    // @ts-ignore
    chartRef.current.options.plugins.title.text = `Arrival Trends - ${family.current}`;
    chartRef.current.update();
  }

  function onGroupChange(value: string) {
    if (!chartRef.current) return;
    // @ts-ignore
    updateChart(value);
    // @ts-ignore
    setSelected(value);
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
          type: "bar",
          data: {
            datasets: [
              {
                label: "Arrival",
                data: [],
                // borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.9)",
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Arrival Trends",
              },
            },
            scales: {
              y: {
                title: {
                  display: true,
                  text: "Average Arrival (kg)",
                },
                beginAtZero: true,
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
      <div className="pb-20 flex gap-5 flex-col">
        <Autocomplete
          className="max-w-xs"
          defaultItems={families}
          label="Commodity"
          placeholder="Select a commodity"
          onSelectionChange={onSelect}
        >
          {(f) => <AutocompleteItem>{f.label}</AutocompleteItem>}
        </Autocomplete>
        <RadioGroup label="Group By" orientation="horizontal" value={selected} onValueChange={onGroupChange}>
          <Radio value="year">Year</Radio>
          <Radio value="season">Season</Radio>
        </RadioGroup>
      </div>
      <div className="w-full max-w-6xl">
        <canvas className="w-full h-full" ref={canvasRef} />
      </div>
    </div>
  );
}
