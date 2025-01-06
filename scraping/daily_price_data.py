import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime, timedelta

# URL and headers
url = "https://kalimatimarket.gov.np/price"
headers = {
    "Cookie": "kalimati_fruits_and_vegetable_market_development_board_session=<session_id>",
}

# Create CSV file
output_file = "daily_price_data.csv"
with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
    csvwriter = csv.writer(csvfile)
    csvwriter.writerow(["Commodity", "Date", "Unit", "Minimum", "Maximum", "Average"])

# Loop through dates
start_date = datetime(2023, 9, 29)
end_date = datetime.today()
current_date = start_date

while current_date <= end_date:
    # Prepare POST data
    data = {
        "_token": "<token>",
        "datePricing": current_date.strftime("%Y-%m-%d"),
    }

    # Make POST request
    response = requests.post(url, headers=headers, data=data)

    if response.status_code == 200:
        # Parse HTML
        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.find("table", {"id": "commodityPriceParticular"})

        if table:
            rows = table.find("tbody").find_all("tr")
            with open(output_file, "a", newline="", encoding="utf-8") as csvfile:
                csvwriter = csv.writer(csvfile)

                for row in rows:
                    cells = row.find_all("td")
                    if len(cells) == 5:  # Ensure it has 5 columns
                        commodity = cells[0].get_text(strip=True)
                        unit = cells[1].get_text(strip=True)
                        min_price = cells[2].get_text(strip=True).replace("Rs", "").replace(",", "").strip()
                        max_price = cells[3].get_text(strip=True).replace("Rs", "").replace(",", "").strip()
                        avg_price = cells[4].get_text(strip=True).replace("Rs", "").replace(",", "").strip()
                        csvwriter.writerow([commodity, current_date.strftime("%Y-%m-%d"), unit, min_price, max_price, avg_price])

        print(f"Data for {current_date.strftime('%Y-%m-%d')} fetched successfully.")
    else:
        print(f"Failed to fetch data for {current_date.strftime('%Y-%m-%d')} (Status Code: {response.status_code}).")

    # Move to the next day
    current_date += timedelta(days=1)

print(f"Data fetching complete. Saved to {output_file}.")
