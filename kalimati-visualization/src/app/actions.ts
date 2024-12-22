"use server";

import pl from "nodejs-polars";

export async function getGroups() {
  const df = pl.readCSV("data/kalimati_final.csv");
  const commodityCounts = df.groupBy("Commodity").len();

  const labels = commodityCounts.getColumn("Commodity").toArray();
  const values = commodityCounts.getColumn("Commodity_count").toArray();

  return { labels, values };
}
