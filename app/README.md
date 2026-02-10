# Supply Chain Decarbonization & Scope 3 Intelligence API

This project is a FastAPI backend designed to dynamically calculate, audit, and report on Scope 3 carbon emissions from a supply chain. It moves beyond static spreadsheets by using interval-based GPS data to provide verifiable and actionable insights.

## Features

- **Dynamic Emission Calculation**: Calculates emissions based on timestamped GPS pings, not just start/end points.
- **Automated Processing**: A single endpoint to ingest and process all data.
- **Verifiable Audit Reports**: Generate detailed, step-by-step calculation logs for any trip, ensuring transparency.
- **Supplier Leaderboard**: Ranks suppliers by carbon efficiency and provides a clear recommendation.
- **Modular & Scalable**: Built with FastAPI, ready to be expanded with a database and frontend.

## Setup & Installation

1.  **Prerequisites**: Make sure you have Python 3.8+ installed.

2.  **Create a Virtual Environment** (recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install Dependencies**:
    ```bash
    pip install "fastapi[all]"
    ```

## How to Run

1.  Place all the files (`main.py`, `utils.py`, `constants.py`, `synthetic_data.json`, `README.md`) in the same directory.

2.  Start the FastAPI server using `uvicorn`:
    ```bash
    uvicorn main:app --reload
    ```
    The `--reload` flag makes the server restart automatically after code changes.

3.  The API will be running at `http://127.0.0.1:8000`.

## API Workflow & Endpoints

Open your browser to `http://127.0.0.1:8000/docs` to see the interactive Swagger UI for testing the endpoints.

### Step 1: Process the Data

First, you must trigger the automated processing. This reads the `synthetic_data.json` file and performs all calculations.

- **Endpoint**: `POST /automation/process-all-data`
- **Action**: Click "Try it out" and then "Execute".

### Step 2: Get Intelligence & Recommendations

Once the data is processed, you can get the supplier leaderboard.

- **Endpoint**: `GET /intelligence/supplier-leaderboard`
- **Action**: This will show you which supplier is the most carbon-efficient and provide a sorted list.

### Step 3: Generate an Audit Report

For full transparency, you can pull a detailed report for any specific trip.

- **Endpoint**: `GET /audit/trip-report/{trip_id}`
- **Action**: Enter a `trip_id` from the `synthetic_data.json` file (e.g., `TRIP_A1` or `TRIP_B1`) to see the verifiable calculation log.