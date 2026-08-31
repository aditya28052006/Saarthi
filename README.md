# Monsoon Saarthi prototype

A polished web prototype for SIH26086: **Hyperlocal Monsoon Onset & Break Prediction System**. The API uses the same Random Forest, rainfall-window features, and dry-spell risk bands defined in `saarthi_prototype_1.ipynb`.

## Run locally

1. Install Python 3.10+.
2. From this folder, install the dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

3. Start the site:

   ```powershell
   py app.py
   ```

4. Open `http://127.0.0.1:5000`.

## Connect the notebook data

Place the notebook's `Sangrur_Block_Daily_Rainfall_2010_2025.csv` in the `data` folder and restart the server. It must contain `date`, `block`, and `rainfall_mm` columns. The backend automatically recreates the notebook's rolling rainfall and dry-day features, trains the `RandomForestClassifier`, and serves `/api/predict` to the UI.

When the CSV is not present, it uses deterministic **demo data** so the interaction can be presented without pretending it is a live weather forecast. The page labels this in the result card.
