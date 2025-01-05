"use server";

import { BubbleDataPoint } from "chart.js";
import pl from "nodejs-polars";

enum DataFile {
  PriceData = "data/kalimati_final.csv",
  Combined = "data/arrival.csv"
};

export async function getAllUniqueCommodities(): Promise<string[]> {
  const df = pl.readCSV("data/kalimati_final.csv");

  const uniqueItems = df.select("Commodity").unique();
  return uniqueItems.getColumn("Commodity").toArray();
}

export async function getAllUniqueFamilies(): Promise<string[]> {
  const df = pl.readCSV(DataFile.Combined);

  const uniqueItems = df.groupBy("Family").agg(pl.col("Arrival").sum()).sort(pl.col("Arrival"), true);
  return uniqueItems.getColumn("Family").toArray();
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

const commonItems = ["Potato Red", "Onion Dry", "Tomato Small", "Cauli Local", "Cucumber", "Tomato Big", "Cabbage", "Carrot", "Raddish White", "Okara", "French Bean", "Chilli Green", "Bitter Gourd", "Fish Fresh", "Cow pea", "Brinjal Long", "Squash", "Capsicum", "Lime", "Bottle Gourd", "Pointed Gourd", "Brd Leaf Mustard", "Pumpkin", "Ginger", "Coriander Green", "Christophine", "Mushroom"];

export async function seasonMostCommon() {
  const df = pl.readCSV(DataFile.Combined, {
    dtypes: {
      Date: pl.Datetime(),
      Arrival: pl.Float64,
      Commodity: pl.Utf8,
    },
  });

  // Summer - 5 (June)
  // Autumn - 8 (September)
  // Winter - 11 (December)
  // Spring - 2 (March)

  // let start = 5;

  let data = [];
  // for (let seasonStart = 5; seasonStart < 12; seasonStart += 6) {
  let seasonStart = 11; {
    let expr = pl.lit(false);
    
    for (let i = 2021; i <= 2024; i++) {
      const start = new Date(i, seasonStart, 1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 3);
      
      expr = expr
        .or(pl.col("Date").gtEq(start).and(pl.col("Date").lt(end))
        .and(pl.col("Family").isIn(commonItems).not()));
    }
    
    const mostCommon = df
    .filter(expr)
    .groupBy("Family")
    .agg(pl.col("Arrival").sum().alias("TotalArrival"))
    .sort(pl.col("TotalArrival"), true);

    // data.push(mostCommon.toObject()["Commodity"]);
    return mostCommon.toObject();
  }
}

export async function priceVsArrival(familyName: string): Promise<BubbleDataPoint[]> {
  const df = pl.readCSV("data/arrival.csv", {
    dtypes: {
      Arrival: pl.Float64,
      "Average - Mean": pl.Float64,
      Family: pl.Utf8,
    },
  });

  const res = df.filter(pl.col("Family").eq(pl.lit(familyName))).sort(pl.col("Arrival")).toObject();

  const len = res["Arrival"].length;

  const ret = [];
  for (let i = 0; i < len; i++) {
    const point: BubbleDataPoint = {
      x: Number(res["Arrival"][i]),
      y: Number(res["Average - Mean"][i]),
    };
    ret.push(point);
  }

  return ret;
}

export async function getFamilyList(): Promise<{label: string, key: string}[]> {
  const list = await getAllUniqueFamilies();
  const ret: {label: string, key: string}[] = [];

  list.forEach((e: string) => {
    ret.push({
      label: e,
      key: e,
    });
  });
  
  return ret;
}
