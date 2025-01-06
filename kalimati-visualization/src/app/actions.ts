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

// export async function calculateSeasonalMetrics(): Promise<Map<string, any>> {
//   // Read the CSV file
//   const df = pl.readCSV("data/arrival.csv", {
//     dtypes: {
//       Date: pl.Datetime(),
//       Family: pl.Utf8,
//       Season: pl.Utf8,
//       "Average - Mean": pl.Float64,
//       "Group - Mode": pl.Utf8,
//       "Category - Mode": pl.Utf8,
//       Arrival: pl.Float64,
//     },
//   });

// Function to calculate box plot metrics for a given dataframe
//   function calculateBoxPlotMetrics(group: pl.DataFrame): any {
//     const metrics = {
//       min: group
//         .select(pl.col("Average - Mean").min())
//         .getColumn("Average - Mean")[0],
//       q1: group
//         .select(pl.col("Average - Mean").quantile(0.25))
//         .getColumn("Average - Mean")[0],
//       median: group
//         .select(pl.col("Average - Mean").median())
//         .getColumn("Average - Mean")[0],
//       q3: group
//         .select(pl.col("Average - Mean").quantile(0.75))
//         .getColumn("Average - Mean")[0],
//       max: group
//         .select(pl.col("Average - Mean").max())
//         .getColumn("Average - Mean")[0],
//       mean: group
//         .select(pl.col("Average - Mean").mean())
//         .getColumn("Average - Mean")[0],
//       std: group
//         .select(pl.col("Average - Mean").std())
//         .getColumn("Average - Mean")[0],
//     };

//     return metrics;
//   }

//   try {
//     // Get unique families
//     const familyDf = df.select("Family").unique();
//     const families = familyDf.getColumn("Family").toArray();

//     const resultMap = new Map<string, any>();

//     // Calculate metrics for each family and season
//     for (const family of families) {
//       // Filter for current family using string literal
//       const familyData = df.filter(pl.col("Family").eq(pl.lit(family)));

//       // Get unique seasons for this family
//       const seasonDf = familyData.select("Season").unique();
//       const seasons = seasonDf.getColumn("Season").toArray();

//       const seasonMetrics: { [key: string]: any } = {};

//       for (const season of seasons) {
//         // Filter for current season using string literal
//         const seasonData = familyData.filter(
//           pl.col("Season").eq(pl.lit(season))
//         );
//         const metrics = calculateBoxPlotMetrics(seasonData);
//         seasonMetrics[season.toLowerCase()] = metrics;
//       }

//       resultMap.set(family, seasonMetrics);
//     }

//     return resultMap;
//   } catch (error) {
//     console.error("Error in calculateSeasonalMetrics:", error);
//     throw error;
//   }
// }

export async function calculateSeasonalMetrics(): Promise<Map<string, any>> {
  // Read the CSV file
  const df = pl.readCSV("data/kalimati_final_season.csv", {
    dtypes: {
      Date: pl.Datetime(),
      Commodity: pl.Utf8,
      Unit: pl.Utf8,
      Minimum: pl.Float64,
      Maximum: pl.Float64,
      Average: pl.Float64,
      Family: pl.Utf8,
      Group: pl.Utf8,
      Category: pl.Utf8,
      Season: pl.Utf8,
    },
  });

  // Function to calculate box plot metrics for a given dataframe
  function calculateBoxPlotMetrics(group: pl.DataFrame): any {
    const metrics = {
      min: group.select(pl.col("Average").min()).getColumn("Average")[0],
      q1: group
        .select(pl.col("Average").quantile(0.25))
        .getColumn("Average")[0],
      median: group.select(pl.col("Average").median()).getColumn("Average")[0],
      q3: group
        .select(pl.col("Average").quantile(0.75))
        .getColumn("Average")[0],
      max: group.select(pl.col("Average").max()).getColumn("Average")[0],
      mean: group.select(pl.col("Average").mean()).getColumn("Average")[0],
      std: group.select(pl.col("Average").std()).getColumn("Average")[0],
    };

    return metrics;
  }

  try {
    // Get unique commodities
    const commodityDf = df.select("Commodity").unique();
    const commodities = commodityDf.getColumn("Commodity").toArray();

    const resultMap = new Map<string, any>();

    // Calculate metrics for each commodity and season
    for (const commodity of commodities) {
      // Filter for current commodity using string literal
      const commodityData = df.filter(
        pl.col("Commodity").eq(pl.lit(commodity))
      );

      // Get unique seasons for this commodity
      const seasonDf = commodityData.select("Season").unique();
      const seasons = seasonDf.getColumn("Season").toArray();

      const seasonMetrics: { [key: string]: any } = {};

      for (const season of seasons) {
        // Filter for current season using string literal
        const seasonData = commodityData.filter(
          pl.col("Season").eq(pl.lit(season))
        );
        const metrics = calculateBoxPlotMetrics(seasonData);
        seasonMetrics[season.toLowerCase()] = metrics;
      }

      resultMap.set(commodity, seasonMetrics);
    }

    return resultMap;
  } catch (error) {
    console.error("Error in calculateSeasonalMetrics:", error);
    throw error;
  }
}
