"use server";

import { BubbleDataPoint } from "chart.js";
import { time } from "console";
import pl from "nodejs-polars";

enum DataFile {
  PriceData = "data/kalimati_final.csv",
  Combined = "data/arrival.csv",
}

export async function getAllUniqueCommodities(): Promise<string[]> {
  const df = pl.readCSV("data/kalimati_final.csv");

  const uniqueItems = df.select("Commodity").unique();
  return uniqueItems.getColumn("Commodity").toArray();
}

export async function getAllUniqueFamilies(): Promise<string[]> {
  const df = pl.readCSV(DataFile.Combined);

  const uniqueItems = df
    .groupBy("Family")
    .agg(pl.col("Arrival").sum())
    .sort(pl.col("Arrival"), true);
  return uniqueItems.getColumn("Family").toArray();
}

export async function getGroups(groupBy: string) {
  const df = pl.readCSV("data/kalimati_final.csv");

  const commodityCounts = df.groupBy(groupBy).len();

  const labels = commodityCounts.getColumn(groupBy).toArray();

  const values = commodityCounts.getColumn(groupBy + "_count").toArray();

  return { labels, values };
}

export async function uniqueArrivalsYesterday() {
  // Load the dataset
  const df = pl.readCSV("data/arrival.csv", {
    dtypes: {
      Date: pl.Datetime(),
      Arrival: pl.Int64,
      Family: pl.Utf8,
    },
  });

  // Get yesterday's date in the format matching the dataset
  const latest = df.select(pl.col("Date")).getColumn("Date").max();
  const today = new Date(latest);
  today.setDate(today.getDate() - 1);
  const yesterday = new Date(today);

  // Filter for arrivals on yesterday
  const yesterdayArrivals = df
    .filter(pl.col("Date").eq(yesterday))
    .select("Family", "Arrival")
    .unique();

  // Convert yesterday's arrivals to Map<string, number>
  const arrivals = new Map<string, number>();
  yesterdayArrivals.rows().forEach((row) => {
    arrivals.set(row[0] as string, row[1] as number);
  });

  return arrivals;
}

export async function calculateAverages(
  timeRange: "7D" | "1M" | "1Y"
): Promise<Map<string, number>> {
  const df = pl.readCSV("data/kalimati_final.csv", {
    dtypes: {
      Date: pl.Datetime(),
      Average: pl.Float64,
      Commodity: pl.Utf8,
    },
  });

  const latest = df.select(pl.col("Date")).getColumn("Date").max();
  const today = new Date(latest);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day_averages = new Map<string, number>();

  switch (timeRange) {
    case "7D":
    case "1M": {
      const dayCount = timeRange === "7D" ? 7 : 30;
      for (let i = 0; i < dayCount; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        const avgPrice = df
          .filter(pl.col("Date").eq(day))
          .select(pl.col("Average").mean());

        if (avgPrice.getColumn("Average").length > 0) {
          const key = `${monthNames[day.getMonth()]} ${day.getDate()}`;
          day_averages.set(key, avgPrice.getColumn("Average")[0]);
        }
      }
      return new Map([...day_averages].reverse());
    }
    case "1Y": {
      const dayCount = 365;
      for (let i = 0; i < dayCount; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        const avgPrice = df
          .filter(pl.col("Date").eq(day))
          .select(pl.col("Average").mean());

        if (avgPrice.getColumn("Average").length > 0) {
          const key = `${monthNames[day.getMonth()]} ${day.getDate()}`;
          day_averages.set(key, avgPrice.getColumn("Average")[0]);
        }
      }
      return new Map([...day_averages].reverse());
    }
  }
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

export async function arrivalPieChart() {
  const df = pl.readCSV("data/arrival.csv");
}

const commonItems = [
  "Potato Red",
  "Onion Dry",
  "Tomato Small",
  "Cauli Local",
  "Cucumber",
  "Tomato Big",
  "Cabbage",
  "Carrot",
  "Raddish White",
  "Okara",
  "French Bean",
  "Chilli Green",
  "Bitter Gourd",
  "Fish Fresh",
  "Cow pea",
  "Brinjal Long",
  "Squash",
  "Capsicum",
  "Lime",
  "Bottle Gourd",
  "Pointed Gourd",
  "Brd Leaf Mustard",
  "Pumpkin",
  "Ginger",
  "Coriander Green",
  "Christophine",
  "Mushroom",
];

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
  let seasonStart = 11;
  {
    let expr = pl.lit(false);

    for (let i = 2021; i <= 2024; i++) {
      const start = new Date(i, seasonStart, 1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 3);

      expr = expr.or(
        pl
          .col("Date")
          .gtEq(start)
          .and(pl.col("Date").lt(end))
          .and(pl.col("Family").isIn(commonItems).not())
      );
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

export async function priceVsArrival(
  familyName: string
): Promise<BubbleDataPoint[]> {
  const df = pl.readCSV(DataFile.Combined, {
    dtypes: {
      Arrival: pl.Float64,
      "Average - Mean": pl.Float64,
      Family: pl.Utf8,
    },
  });

  const res = df
    .filter(pl.col("Family").eq(pl.lit(familyName)))
    .sort(pl.col("Arrival"))
    .toObject();

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

export async function getFamilyList(): Promise<
  { label: string; key: string }[]
> {
  const list = await getAllUniqueFamilies();
  const ret: { label: string; key: string }[] = [];

  list.forEach((e: string) => {
    ret.push({
      label: e,
      key: e,
    });
  });

  return ret;
}

export async function getFamilyPriceHistory(family: string) {
  const df = pl
    .readCSV(DataFile.PriceData, {
      dtypes: {
        Date: pl.Datetime(),
        Average: pl.Float64,
        Family: pl.Utf8,
        Commodity: pl.Utf8,
      },
    })
    .filter(pl.col("Family").eq(pl.lit(family)));

  // console.log(df.select(pl.col("Commodity")).unique().toObject());

  const latest = df.select(pl.col("Date")).getColumn("Date").max();
  const today = new Date(latest);

  // Get all unique commodities within the family
  const commodities = df
    .select(pl.col("Commodity"))
    .unique()
    .sort("Commodity")
    .getColumn("Commodity")
    .toArray();

  // Calculate date range (7 days including today)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  // Format dates for labels
  const labels = dates.map((date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  // Process data for each commodity
  const datasets = commodities.map((commodity: string) => {
    // Filter data for specific commodity
    const commodityDf = df.filter(pl.col("Commodity").eq(pl.lit(commodity)));

    // Get prices for each date
    const data = dates.map((date) => {
      const price = commodityDf
        .filter(pl.col("Date").eq(date))
        .select(pl.col("Average"))
        .getColumn("Average")
        .toArray();

      // Return null if no price found for that day
      return price.length > 0 ? price[0] : null;
    });

    // Create label based on commodity name
    let label = commodity.replace(`${family}`, "").trim();
    if (label.startsWith("(") && label.endsWith(")")) {
      label = label.slice(1, -1);
    }
    label = label || "Normal"; // Use 'Normal' if no specific variant

    return {
      label,
      data,
    };
  });

  return {
    labels,
    datasets,
  };
}

export async function getIndividualFamilyTableData(
  dfIn: pl.DataFrame<any>,
  family: string,
  today: Date
) {
  const df = dfIn.filter(pl.col("Family").eq(pl.lit(family)));

  const unit = df.select(pl.col("Unit")).getColumn("Unit").toArray()[0];

  // Get today's and yesterday's data
  const todayDf = df.filter(pl.col("Date").eq(pl.lit(today)));

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayDf = df.filter(pl.col("Date").eq(pl.lit(yesterday)));

  // Process commodities data for today
  const commodityPrices: any[] = [];
  const commodities = df
    .select(pl.col("Commodity"))
    .unique()
    .getColumn("Commodity")
    .toArray()
    .map((commodity: string) => {
      const commodityDf = todayDf.filter(
        pl.col("Commodity").eq(pl.lit(commodity))
      );
      const price = commodityDf
        .select(pl.col("Average"))
        .getColumn("Average")
        .toArray();

      let name = commodity.replace(`${family}`, "").trim();
      if (name.startsWith("(") && name.endsWith(")")) {
        name = name.slice(1, -1);
      }
      name = name || "Normal";

      const priceValue = price.length > 0 ? price[0].toFixed(2) : "N/A";
      if (price.length > 0) {
        commodityPrices.push(price[0]);
      }

      return {
        name,
        price: priceValue,
      };
    });

  // Calculate average
  const averagePrice =
    commodityPrices.length > 0
      ? (
          commodityPrices.reduce((a, b) => a + b, 0) / commodityPrices.length
        ).toFixed(2)
      : "N/A";

  // Calculate change percentage
  let changePercent = "N/A";
  let changeSign = 0;

  const todayAvg = todayDf
    .select(pl.mean("Average"))
    .getColumn("Average")
    .toArray()[0];

  const yesterdayAvg = yesterdayDf
    .select(pl.mean("Average"))
    .getColumn("Average")
    .toArray()[0];

  if (todayAvg !== null && yesterdayAvg !== null && yesterdayAvg !== 0) {
    const percentChange = ((todayAvg - yesterdayAvg) / yesterdayAvg) * 100;
    changePercent = `${Math.abs(percentChange).toFixed(1)}%`;
    changeSign = Math.sign(percentChange);
    if (changeSign > 0) changePercent = "+" + changePercent;
    else if (changeSign < 0) changePercent = "-" + changePercent;
  }

  return {
    name: family,
    average: `${averagePrice} / ${unit}`,
    commodities,
    changePercent,
    changeSign,
  };
}

export async function getCommonItemsTableData() {
  const df = pl.readCSV(DataFile.PriceData, {
    dtypes: {
      Date: pl.Datetime(),
      Average: pl.Float64,
      Family: pl.Utf8,
      Commodity: pl.Utf8,
      Unit: pl.Utf8,
    },
  });

  const latest = df.select(pl.col("Date")).getColumn("Date").max();
  const today = new Date(latest);

  const tablePromises = commonItems.map((item) => {
    return getIndividualFamilyTableData(df, item, today);
  });
  const tableData = await Promise.all(tablePromises);

  return tableData;
}
