#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h> 

// ==========================================
// 1. NETWORK & API CONFIGURATION
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API Base URL (Render)
const char* apiBase = "https://mq-gas-censor-sensegrid-api-tronix.onrender.com/api/v1";

// ==========================================
// 2. DEVICE CONFIGURATION
// ==========================================
// Use the "Combined Sensor" device ID and Token here
const char* deviceId = "COMBINED_DEVICE_01"; 
const char* deviceToken = "YOUR_DEVICE_TOKEN"; 

// ==========================================
// 3. PIN DEFINITIONS
// ==========================================
// --- Gas & Environment ---
#define PIN_MQ135 34        // Analog Input (ADC1)
#define PIN_TRIG 5          // Ultrasonic Trig
#define PIN_ECHO 18         // Ultrasonic Echo
// #define PIN_DHT 4        // Digital Input (Commented out until DHT lib is added)

// --- LDR & Light ---
// NOTE: Moved LDR Analog to Pin 36 (VP) to avoid conflict with MQ135 on Pin 34
#define PIN_LDR_ANALOG 36   // Analog Input (ADC1) 
#define PIN_LDR_DIGITAL 35  // Digital Input
#define PIN_AUTO_BULB 25    // PWM Output

// ==========================================
// 4. GLOBALS
// ==========================================
unsigned long lastGasTime = 0;
unsigned long lastLdrTime = 0;
unsigned long lastPollTime = 0;

// Intervals (ms)
const long intervalGas = 2000;  // Send Gas Data every 2s
const long intervalLdr = 1000;  // Send LDR Data every 1s
const long intervalPoll = 1000; // Poll Outputs every 1s

void setup() {
  Serial.begin(115200);

  // --- Pin Modes ---
  pinMode(PIN_MQ135, INPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  
  pinMode(PIN_LDR_ANALOG, INPUT);
  pinMode(PIN_LDR_DIGITAL, INPUT);
  
  // --- PWM Setup (Auto Bulb) ---
  // ESP32 Core v3.0+ API
  if (!ledcAttach(PIN_AUTO_BULB, 5000, 10)) {
    Serial.println("PWM Setup Failed!");
  } else {
    ledcWrite(PIN_AUTO_BULB, 0); // Start Off
  }

  // --- WiFi Connection ---
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long currentMillis = millis();

    // --- 1. LDR LOCAL LOGIC (Fast) ---
    // Read LDR and handle Auto-Bulb locally for responsiveness
    int rawLdr = analogRead(PIN_LDR_ANALOG);
    // Map 12-bit ADC (0-4095) to 10-bit PWM (0-1023)
    int pwmVal = map(rawLdr, 0, 4095, 0, 1023);
    
    // Auto Bulb: Brightness increases with Scale (or Inverse? Depend on requirement)
    // Requirement: "as reading increases brightness also increases"
    ledcWrite(PIN_AUTO_BULB, pwmVal);

    // --- 2. SEND GAS DATA ---
    if (currentMillis - lastGasTime >= intervalGas) {
      lastGasTime = currentMillis;
      sendGasData();
    }

    // --- 3. SEND LDR DATA ---
    if (currentMillis - lastLdrTime >= intervalLdr) {
      lastLdrTime = currentMillis;
      // Pass the CURRENT raw values we just read
      sendLdrData(digitalRead(PIN_LDR_DIGITAL), pwmVal); 
    }

    // --- 4. POLL OUTPUTS (Manual Bulb Override) ---
    // Note: If you want manual override to work, you might need flag logic
    // Currently this polls but 'Auto Bulb' overwrites it in the loop immediately above.
    // To support Manual Override, we'd need to check if 'manual mode' is on or similar.
    // For now, we implement the polling as requested, which toggles other GPIOs.
    if (currentMillis - lastPollTime >= intervalPoll) {
      lastPollTime = currentMillis;
      pollOutputs();
    }

  } else {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(2000);
  }
}

// -----------------------------------------------------
// TASK: SEND GAS/ENV DATA
// Endpoint: /api/v1/ingest
// -----------------------------------------------------
void sendGasData() {
  // Read Sensors
  int gasRaw = analogRead(PIN_MQ135);
  
  // UltraSonic Distance
  digitalWrite(PIN_TRIG, LOW); delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long duration = pulseIn(PIN_ECHO, HIGH);
  float distance = duration * 0.034 / 2;

  // Placeholder Temp/Hum (Connect DHT if needed)
  float temp = 25.0; 
  float hum = 60.0;

  // Prepare JSON
  StaticJsonDocument<200> doc;
  doc["device_id"] = deviceId;
  doc["gas"] = gasRaw;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["distance"] = distance;

  String json;
  serializeJson(doc, json);

  // Send
  postData("/ingest", json);
}

// -----------------------------------------------------
// TASK: SEND LDR DATA
// Endpoint: /api/v1/ldr/{id}/readings
// -----------------------------------------------------
void sendLdrData(int digitalVal, int analogVal) {
  StaticJsonDocument<200> doc;
  doc["device_id"] = deviceId;
  doc["digital_value"] = (digitalVal == HIGH);
  doc["analog_value"] = analogVal; // Sending the 10-bit scaled value used for PWM

  String json;
  serializeJson(doc, json);

  String endpoint = String("/ldr/") + String(deviceId) + "/readings";
  postData(endpoint.c_str(), json);
}

// -----------------------------------------------------
// TASK: POLL OUTPUTS
// Endpoint: /api/v1/ldr/{id}/outputs
// -----------------------------------------------------
void pollOutputs() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(apiBase) + "/ldr/" + String(deviceId) + "/outputs";

  if (http.begin(client, url)) {
    http.addHeader("Device-Token", deviceToken);
    int code = http.GET();
    
    if (code == 200) {
      DynamicJsonDocument doc(2048);
      deserializeJson(doc, http.getString());
      JsonArray outputs = doc.as<JsonArray>();

      for (JsonObject out : outputs) {
        int gpio = out["gpio_pin"];
        bool active = out["is_active"];
        
        // Safety: Don't overwrite sensor pins or AutoBulb pin
        if (gpio != PIN_MQ135 && gpio != PIN_LDR_ANALOG && gpio != PIN_AUTO_BULB) {
            pinMode(gpio, OUTPUT);
            digitalWrite(gpio, active ? HIGH : LOW);
        }
      }
    }
    http.end();
  }
}

// -----------------------------------------------------
// HELPER: HTTP POST
// -----------------------------------------------------
void postData(const char* endpoint, String payload) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(apiBase) + endpoint;
  
  // Timeout settings
  client.setTimeout(10000); 

  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Device-Token", deviceToken);
    
    int code = http.POST(payload);
    if (code > 0) {
      Serial.printf("POST %s -> %d\n", endpoint, code);
    } else {
      Serial.printf("POST %s Failed: %s\n", endpoint, http.errorToString(code).c_str());
    }
    http.end();
  } else {
    Serial.printf("Failed to connect to %s\n", url.c_str());
  }
}
