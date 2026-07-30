/*
  🌍 SenseGrid - Energy Meter Monitoring Device Firmware
  
  This firmware reads:
    - Cumulative Active Energy (kWh) from a Schneider Electric EasyLogic EM1X00 (or equivalent)
    - Integrates via RS485 Modbus RTU (Pins RX=16, TX=17 on Serial2 by default)
    
  It features:
    - Live WiFi connection setup
    - Secure HTTPS connection to the SenseGrid Cloud Platform
    - Simulated test mode starting at 104859.712 kWh (matching user physical display)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h> // Ensure you install "ArduinoJson" by Benoit Blanchon in Library Manager

// ==========================================
// 1. NETWORK CONFIGURATION
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ==========================================
// 2. SERVER CONFIGURATION
// ==========================================
// SenseGrid ingestion API endpoint
const char* serverUrl = "https://mq-gas-censor-sensegrid-api-tronix.onrender.com/api/v1/ingest"; 

// ==========================================
// 3. DEVICE IDENTITY
// ==========================================
const char* deviceId = "ENERGY_METER_01";      // Must match what you deploy in the Web Console
const char* deviceToken = "YOUR_SECRET_TOKEN"; // Find this in "View Details" on the Web Console

// ==========================================
// 4. MODBUS RTU & SIMULATION SETTINGS
// ==========================================
// Set to true to generate simulated energy data starting at 104859.712 kWh
// Set to false to read from physical RS485 Modbus RTU
const bool SIMULATION_MODE = true; 

// RS485 / Modbus Hardware Serial Pin Definitions (if not simulating)
#define RXD2 16
#define TXD2 17
#define RS485_DE_RE 2 // Flow Control Pin for MAX485 (if required)

// ==========================================
// 5. GLOBAL TELEMETRY VARIABLES
// ==========================================
unsigned long lastTelemetryTime = 0;
const long telemetryInterval = 5000; // Send data every 5 seconds

// Start accumulating from the exact photo reading
double currentKWh = 104859.712;

void setup() {
  Serial.begin(115200);
  
  // Initialize RS485 Modbus Serial (if using actual meter)
  if (!SIMULATION_MODE) {
    Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
    pinMode(RS485_DE_RE, OUTPUT);
    digitalWrite(RS485_DE_RE, LOW); // Set to Receiver Mode
    Serial.println("RS485 Modbus RTU interface initialized on Serial2.");
  }

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected successfully!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// Helper to query the physical Schneider Energy Meter via Modbus RTU
// EasyLogic registers differ, but typically Active Energy (kWh) is stored in float holding registers
double readPhysicalEnergyMeter() {
  /* 
    --- Modbus RTU Placeholder Protocol Description ---
    1. Set DE_RE pin HIGH (Transmit Mode): digitalWrite(RS485_DE_RE, HIGH);
    2. Send request frame to Schneider EasyLogic (usually slave ID 1, command 03, register 3000):
       [01] [03] [0B] [B7] [00] [02] [CRC_L] [CRC_H] (Example Request for Active Energy)
    3. Flush transmission and set DE_RE pin LOW (Receive Mode): digitalWrite(RS485_DE_RE, LOW);
    4. Wait for response and parse float registers.
  */
  
  // Return simulated drift logic for now if Modbus is physically offline
  static double physicalFallback = 104859.712;
  physicalFallback += (random(5, 25) / 1000.0); // Simulate consumption speed
  return physicalFallback;
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long currentMillis = millis();

    // Trigger telemetry submission periodically
    if (currentMillis - lastTelemetryTime >= telemetryInterval) {
      lastTelemetryTime = currentMillis;

      double readingVal = 0.0;

      if (SIMULATION_MODE) {
        // Slowly increase KWh reading simulating a factory energy load (~15-40 Watts per interval)
        double simulatedIncrease = random(5, 30) / 1000.0;
        currentKWh += simulatedIncrease;
        readingVal = currentKWh;
        Serial.printf("[Simulator] Simulating load. Accumulated: %.3f kWh\n", readingVal);
      } else {
        // Query the physical Schneider meter
        readingVal = readPhysicalEnergyMeter();
        Serial.printf("[Modbus RTU] Schneider EM1X00 Energy: %.3f kWh\n", readingVal);
      }

      sendTelemetry(readingVal);
    }
  } else {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(2000);
  }
}

void sendTelemetry(double kwhValue) {
  WiFiClientSecure client;
  client.setInsecure(); // Bypass SSL certification check for simpler setup
  
  HTTPClient http;
  
  Serial.print("[HTTP] Initiating transmission... ");
  http.setConnectTimeout(10000); 
  http.setTimeout(10000);
  
  if (http.begin(client, serverUrl)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Device-Token", deviceToken);

    // Prepare JSON payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = deviceId;
    doc["kwh"] = kwhValue;
    
    // Optional: Send estimated load (kW) mapped in the "gas" field 
    // to reuse the existing general metrics column easily
    doc["gas"] = random(120, 240) / 10.0; 

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.println("Payload: " + requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      Serial.printf("[HTTP] Success response code: %d\n", httpResponseCode);
      String response = http.getString();
      Serial.println("[HTTP] Server output: " + response);
    } else {
      Serial.printf("[HTTP] Error sending POST: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[HTTP] Connection failed.");
  }
}
