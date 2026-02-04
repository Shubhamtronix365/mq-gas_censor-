#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h> 

// ==========================================
// 1. NETWORK CONFIGURATION
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ==========================================
// 2. SERVER CONFIGURATION
// ==========================================
// IMPORTANT: Use your hosted URL or local IP
const char* baseUrl = "https://mq-gas-censor-sensegrid-api-tronix.onrender.com/api/v1/ldr"; 

// ==========================================
// 3. DEVICE IDENTITY
// ==========================================
const char* deviceId = "LDR_DEVICE_01"; // Must match "Device ID" in web UI (Type: LDR Sensor)
const char* deviceToken = "YOUR_SECRET_TOKEN"; // Find this in "View Details" on dashboard

// ==========================================
// 4. PIN DEFINITIONS
// ==========================================
// Inputs
#define PIN_LDR_ANALOG 34   // ADC pin for LDR brightness
#define PIN_LDR_DIGITAL 35  // Digital pin for LDR threshold (0/1)

// Auto Bulb (Controlled by Sensor)
#define PIN_AUTO_BULB 25    // PWM capable pin for dimming

// ==========================================
// 5. GLOBAL VARIABLES
// ==========================================
unsigned long lastTelemetryTime = 0;
const long telemetryInterval = 5000; // Send data every 5 seconds

unsigned long lastPollTime = 0;
const long pollInterval = 2000;      // Poll for manual outputs every 2 seconds

void setup() {
  Serial.begin(115200);
  
  // Pin Setup
  pinMode(PIN_LDR_ANALOG, INPUT);
  pinMode(PIN_LDR_DIGITAL, INPUT);
  
  // Auto bulb pin setup (PWM)
  // ESP32 LEDC (PWM) Setup
  ledcSetup(0, 5000, 10); // Channel 0, 5kHz, 10-bit resolution (0-1023)
  ledcAttachPin(PIN_AUTO_BULB, 0);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long currentMillis = millis();

    // --- A. READ SENSORS & AUTO BULB LOGIC ---
    int rawAnalog = analogRead(PIN_LDR_ANALOG); // 0-4095
    int digitalVal = digitalRead(PIN_LDR_DIGITAL); // 0 or 1
    
    // Scale analog 0-4095 to 0-1023 for 10-bit PWM and consistency
    int analog10bit = map(rawAnalog, 0, 4095, 0, 1023);

    // Auto Bulb Logic
    // If Digital is HIGH (Dark/Active) -> Auto Bulb ON with brightness
    // If Digital is LOW (Light/Inactive) -> Auto Bulb OFF
    // Note: Adjust HIGH/LOW logic based on your specific LDR module's behavior
    if (digitalVal == HIGH) {
      ledcWrite(0, analog10bit); 
    } else {
      ledcWrite(0, 0); 
    }

    // --- B. SEND TELEMETRY (Periodic) ---
    if (currentMillis - lastTelemetryTime >= telemetryInterval) {
      lastTelemetryTime = currentMillis;
      sendTelemetry(digitalVal, analog10bit);
    }

    // --- C. POLL MANUAL OUTPUTS (Periodic) ---
    if (currentMillis - lastPollTime >= pollInterval) {
      lastPollTime = currentMillis;
      pollOutputs();
    }
  } else {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(2000); // Wait a bit before retry loop
  }
}

void sendTelemetry(int digitalVal, int analogVal) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  // Endpoint: /api/v1/ldr/{device_id}/readings
  String url = String(baseUrl) + "/" + String(deviceId) + "/readings";
  
  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Device-Token", deviceToken);

    StaticJsonDocument<200> doc;
    doc["device_id"] = deviceId;
    doc["digital_value"] = (digitalVal == HIGH); // Convert to boolean
    doc["analog_value"] = analogVal;

    String requestBody;
    serializeJson(doc, requestBody);

    int responseCode = http.POST(requestBody);
    if (responseCode > 0) {
      Serial.printf("[Telemetry] Sent D:%d A:%d -> Code: %d\n", digitalVal, analogVal, responseCode);
    } else {
      Serial.printf("[Telemetry] Error: %s\n", http.errorToString(responseCode).c_str());
    }
    http.end();
  }
}

void pollOutputs() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  // Endpoint: /api/v1/ldr/{device_id}/outputs
  String url = String(baseUrl) + "/" + String(deviceId) + "/outputs";

  if (http.begin(client, url)) {
    http.addHeader("Device-Token", deviceToken);
    int responseCode = http.GET();
    
    if (responseCode == 200) {
      String response = http.getString();
      
      // Parse Response (Array of outputs)
      DynamicJsonDocument doc(2048); // Adjust size for many outputs
      DeserializationError error = deserializeJson(doc, response);

      if (!error) {
        JsonArray outputs = doc.as<JsonArray>();
        for (JsonObject output : outputs) {
          int gpio = output["gpio_pin"];
          bool isActive = output["is_active"];
          
          // Safety check: Don't control pins used for sensors/comms
          if (gpio > 0 && gpio != PIN_LDR_ANALOG && gpio != PIN_LDR_DIGITAL && gpio != PIN_AUTO_BULB) {
            pinMode(gpio, OUTPUT);
            digitalWrite(gpio, isActive ? HIGH : LOW);
            // Serial.printf("Set GPIO %d -> %s\n", gpio, isActive ? "ON" : "OFF");
          }
        }
      } else {
        Serial.print("JSON Parse Error: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.printf("[Poll] Error Code: %d\n", responseCode);
    }
    http.end();
  }
}
