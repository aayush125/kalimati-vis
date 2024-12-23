"use server";

import pl from "nodejs-polars";

export async function getGroups(groupBy: string) {
  const df = pl.readCSV("data/kalimati_final.csv");

  console.log(df.describe());

  const commodityCounts = df.groupBy(groupBy).len();

  const labels = commodityCounts.getColumn(groupBy).toArray();

  const values = commodityCounts.getColumn(groupBy + "_count").toArray();

  return { labels, values };
}

export async function lastSevenAverages(): Promise<Map<string, number>> {
  const df = pl.readCSV("data/kalimati_final.csv", {
    dtypes: {
      Date: pl.Datetime(),
      Average: pl.Float64,
      Commodity: pl.Utf8,
    },
  });

  const latest = df.select(pl.col("Date")).getColumn("Date").max();
  const today = new Date(latest);

  let averages: number[] = [];
  const day_averages = new Map<string, number>();

  for (let i = 0; i < 70; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const avgPrice = df
      .filter(pl.col("Date").eq(day))
      .select(pl.col("Average").mean());

    averages.push(avgPrice.getColumn("Average")[0]);
    day_averages.set(
      day.getDate().toString(),
      avgPrice.getColumn("Average")[0]
    );
  }

  return new Map([...day_averages].reverse());
}
