#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h> // Make sure to install "ArduinoJson" by Benoit Blanchon from Library Manager

// ==========================================
// 1. NETWORK CONFIGURATION
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ==========================================
// 2. SERVER CONFIGURATION
// ==========================================
// IMPORTANT: If running locally, use your computer's IP address (e.g., http://192.168.1.5:8000)
// Do NOT use localhost/127.0.0.1, as that refers to the ESP32 itself
// IMPORTANT: Use the Render URL now.
const char* serverUrl = "https://mq-gas-censor-sensegrid-api.onrender.com/api/v1/ingest"; 

// ... (existing code, ensure imports are there or added if needed, wait, I need to see if I can add the secure client in the loop or setup)

// Let's replace the loop part where http.begin is called.
 

// ==========================================
// 3. DEVICE IDENTITY
// ==========================================
const char* deviceId = "ESP32_01";      // Must match what you register in the web UI
const char* deviceToken = "YOUR_SECRET_TOKEN"; // Must match the device's token

// ==========================================
// 4. SENSOR PINS & SIMULATION
// ==========================================
// Set to true to generate fake random data (useful for testing without sensors)
// Set to false to read from actual pins
const bool SIMULATION_MODE = false; 

// Pin Definitions (Adjust as needed)
#define PIN_MQ135 34    // Analog Input
#define PIN_DHT 4       // Digital Input (requires DHT library if real)
#define PIN_TRIG 5      // Ultrasonic Trig
#define PIN_ECHO 18     // Ultrasonic Echo

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  if (!SIMULATION_MODE) {
    pinMode(PIN_MQ135, INPUT);
    pinMode(PIN_TRIG, OUTPUT);
    pinMode(PIN_ECHO, INPUT);
    // dht.begin(); // Uncomment if using DHT library
  }
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Ignore SSL certificate verification (easiest for testing)
    
    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Device-Token", deviceToken);

    // Prepare JSON payload
    // Using DynamicJsonDocument
    StaticJsonDocument<200> doc;
    
    // Data Variables
    float gas, temp, hum, dist;

    if (SIMULATION_MODE) {
      // Generate realistic fake data
      gas = random(200, 1200);           // PPM
      temp = random(200, 350) / 10.0;    // 20.0 - 35.0 C
      hum = random(40, 80);              // %
      dist = random(5, 400);             // cm
    } else {
      // READ REAL SENSORS HERE
      // 1. Gas
      gas = analogRead(PIN_MQ135); 
      
      // 2. Temp/Hum (Placeholder for DHT logic)
      temp = 25.0; // dht.readTemperature();
      hum = 50.0;  // dht.readHumidity();

      // 3. Distance (HC-SR04)
      digitalWrite(PIN_TRIG, LOW);
      delayMicroseconds(2);
      digitalWrite(PIN_TRIG, HIGH);
      delayMicroseconds(10);
      digitalWrite(PIN_TRIG, LOW);
      long duration = pulseIn(PIN_ECHO, HIGH);
      dist = duration * 0.034 / 2;
    }

    doc["device_id"] = deviceId;
    doc["gas"] = gas;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["distance"] = dist;

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.println("Sending data: " + requestBody);

    // Send POST request
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Response Code: ");
      Serial.println(httpResponseCode);
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  // Wait 5 seconds before next reading
  delay(5000);
}
