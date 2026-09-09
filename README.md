# SAARTHIIIIII — Hyperlocal Monsoon Intelligence Platform

A Spring Boot backend application for the **Hyperlocal Monsoon Onset & Break Prediction System**.

## Run Locally

### Prerequisites
* Java JDK 17+
* Apache Maven 3.x

### Start Server

```powershell
mvn spring-boot:run
```

Open `http://127.0.0.1:5000` in your browser.

## ML Model Integration

The ML prediction interface is clean and decoupled in [MlPredictionService.java](file:///c:/Users/Aditya%20Gupta/Saarthi/src/main/java/com/saarthi/service/MlPredictionService.java).

To plug in your new ML model:
1. Update `calculateDrySpellProbability` or `predict` in `MlPredictionService.java`.
2. Connect your trained model weights, ONNX/PMML runtime, or Python REST inference endpoint.
3. Re-run `mvn spring-boot:run`.

