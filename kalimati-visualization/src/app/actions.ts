"use server";

import pl from "nodejs-polars";

export async function getAllUniqueCommodities(): Promise<string[]> {
  const df = pl.readCSV("data/kalimati_final.csv");

  const uniqueItems = df.select("Commodity").unique();
  return uniqueItems.getColumn("Commodity").toArray();
}

export async function getGroups(groupBy: string) {
  const df = pl.readCSV("data/kalimati_final.csv");

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

  for (let i = 0; i < 7; i++) {
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

export async function getCommodityMonthlyDistribution(): Promise<
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
> {
  const df = pl.readCSV("data/kalimati_final.csv", {
    dtypes: {
      Date: pl.Datetime(),
      Commodity: pl.Utf8,
      Minimum: pl.Float64,
      Maximum: pl.Float64,
      Average: pl.Float64,
    },
  });

  // Add year and month columns
  const withYearMonth = df.withColumns(
    pl.col("Date").date.year().alias("Year"),
    pl.col("Date").date.strftime("%Y-%m").alias("YearMonth")
  );

  // Calculate duration for each commodity
  const commodityDurations = withYearMonth
    .groupBy("Commodity")
    .agg(pl.col("Year").nUnique().alias("years_count"));

  // Separate commodities by duration
  const monthlyCommodities = commodityDurations
    .filter(pl.col("years_count").lt(2))
    .select("Commodity");
  const yearlyCommodities = commodityDurations
    .filter(pl.col("years_count").greaterThanEquals(2))
    .select("Commodity");

  // Calculate monthly statistics for commodities with less than 2 years of history
  const monthlyStats = withYearMonth
    .join(monthlyCommodities, { on: "Commodity" })
    .groupBy(["Commodity", "YearMonth"])
    .agg(
      pl.col("Minimum").mean().alias("min"),
      pl.col("Maximum").mean().alias("max"),
      pl.col("Average").mean().alias("avg"),
      pl.col("Average").count().alias("count")
    );

  // Calculate yearly statistics for commodities with 2 or more years of history
  const yearlyStats = withYearMonth
    .join(yearlyCommodities, { on: "Commodity" })
    .groupBy(["Commodity", "Year"])
    .agg(
      pl.col("Minimum").mean().alias("min"),
      pl.col("Maximum").mean().alias("max"),
      pl.col("Average").mean().alias("avg"),
      pl.col("Average").count().alias("count")
    );

  // Convert to a nested Map structure
  const distribution = new Map<
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
  >();

  // Process monthly statistics
  monthlyStats.rows().forEach((row) => {
    const commodity = row[0] as string;
    const yearMonth = row[1] as string;
    const stats = {
      min: row[2] as number,
      max: row[3] as number,
      avg: row[4] as number,
      count: row[5] as number,
    };

    if (!distribution.has(commodity)) {
      distribution.set(commodity, new Map());
    }
    distribution.get(commodity)!.set(yearMonth, stats);
  });

  // Process yearly statistics
  yearlyStats.rows().forEach((row) => {
    const commodity = row[0] as string;
    const year = row[1].toString(); // Ensure it's a string
    const stats = {
      min: row[2] as number,
      max: row[3] as number,
      avg: row[4] as number,
      count: row[5] as number,
    };

    if (!distribution.has(commodity)) {
      distribution.set(commodity, new Map());
    }
    distribution.get(commodity)!.set(year, stats);
  });

  return distribution;
}
