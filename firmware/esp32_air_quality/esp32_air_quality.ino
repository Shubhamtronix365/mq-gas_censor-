/*
  🌍 SenseGrid - Air Quality Monitoring Device Firmware
  
  This firmware reads:
    - Sensirion SEN66 (I2C via PCA9548A Channel 1)
    - DFRobot Oxygen Sensor (I2C via PCA9548A Channel 0)
    - Adafruit SHT40 Temperature/Humidity (I2C via PCA9548A Channel 3)
    - BMX280 Barometric Pressure (I2C via PCA9548A Channel 2)
    - Analog HCHO Sensor (Pin 34)
    
  It updates:
    - Local DWIN UART Display
    - Local Bluetooth config setup
    - Remote MQTT broker (optional)
    - SenseGrid HTTP Cloud Platform (ingesting the 10 variables)
*/

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <EEPROM.h>
#include "BluetoothSerial.h"
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

#include <SensirionI2cSen66.h>
#include "DFRobot_OxygenSensor.h"
#include <Adafruit_SHT4x.h>
#include <Adafruit_Sensor.h>
#include <ErriezBMX280.h>

#ifdef NO_ERROR
#undef NO_ERROR
#endif
#define NO_ERROR 0

// ======================================================
// 1. CLOUD PLATFORM CONFIGURATION
// ======================================================
// Replace with your active platform server endpoint (HTTP or HTTPS)
const char* platformApiUrl = "https://mq-gas-censor-sensegrid-api-tronix.onrender.com/api/v1/ingest";

// Replace with your registered device ID and secure token
const char* platformDeviceId = "YOUR_DEVICE_ID";
const char* platformDeviceToken = "YOUR_DEVICE_TOKEN";

// ======================================================
// EEPROM & BLUETOOTH
// ======================================================
#define EEPROM_SIZE 100
BluetoothSerial SerialBT;
bool btEnabled = false;

// ======================================================
// WIFI VARIABLES
// ======================================================
String ssid = "";
String pass = "";

// ======================================================
// MQTT
// ======================================================
const char* mqtt_server = "sensuri.io";
const int mqtt_port = 1883;
const char* mqtt_user = "SN052627046";
const char* mqtt_password = "SN052627046@Vidai2026";
const char* mqtt_topic = "sensuri/test";
const char* mqtt_client_id = "sensuri_device_046";

WiFiClient espClient;
PubSubClient client(espClient);

// ======================================================
// DWIN UART
// ======================================================
#define RXD2 16
#define TXD2 17

// ======================================================
// PCA9548A MULTIPLEXER
// ======================================================
#define PCA9548A_ADDR 0x70

// ======================================================
// OXYGEN SENSOR
// ======================================================
#define Oxygen_I2C_ADDRESS ADDRESS_3
#define COLLECT_NUMBER 10

// ======================================================
// HCHO SENSOR
// ======================================================
#define HCHO_PIN 34
int CLEAN_ADC = 0;
const int MAX_ADC = 3200;

// ======================================================
// SENSOR OBJECTS
// ======================================================
SensirionI2cSen66 sen66;
DFRobot_OxygenSensor oxygen;
Adafruit_SHT4x sht4 = Adafruit_SHT4x();
ErriezBMX280 bmx280 = ErriezBMX280(0x76);

// ======================================================
// SENSOR STATUS
// ======================================================
bool sen66_ok = false;
bool oxygen_ok = false;
bool sht40_ok = false;
bool bme280_ok = false;

// ======================================================
// TELEMETRY VARIABLES
// ======================================================
float pm25 = 0;
float pm10 = 0;
float tempSHT = 0;
float humSHT = 0;
float oxygenData = 0;
float pressure = 0;
float hcho = 0;
int voc = 0;
int co2 = 0;
int iaq = 0;

static int16_t error;
unsigned long lastPlatformSendTime = 0;
const long platformSendInterval = 5000; // Post to platform every 5 seconds

// ======================================================
// TCA9548A CHANNEL SELECTOR
// ======================================================
void selectChannel(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(PCA9548A_ADDR);
  Wire.write(1 << channel);
  Wire.endTransmission();
  delay(50);
}

// ======================================================
// DWIN UART SEND
// ======================================================
void sendToDWIN(uint16_t vp, int value) {
  uint8_t data[8] = {
    0x5A,
    0xA5,
    0x05,
    0x82,
    highByte(vp),
    lowByte(vp),
    highByte(value),
    lowByte(value)
  };
  Serial2.write(data, 8);
}

// ======================================================
// HCHO ESTIMATION
// ======================================================
float estimatePPM(int raw) {
  raw = constrain(raw, CLEAN_ADC, MAX_ADC);
  float ppm = 10.0 + ((float)(raw - CLEAN_ADC) * (1000.0 - 10.0)) / (MAX_ADC - CLEAN_ADC);
  ppm = constrain(ppm, 10.0, 1000.0);
  return ppm;
}

float readHCHOppm() {
  int raw = analogRead(HCHO_PIN);
  float voltage = (raw * 3.32) / 4095.0;
  float ppm = estimatePPM(raw);
  ppm = ppm / 1000;
  ppm = ppm * 0.814;
  return ppm;
}

// ======================================================
// IAQ INDEX CALCULATION
// ======================================================
int calculateIAQ(float pm25, int co2, int voc, float hcho, float temp, float hum) {
  int score = 0;
  
  if (pm25 <= 12) score += 25;
  else if (pm25 <= 35) score += 60;
  else if (pm25 <= 55) score += 100;
  else if (pm25 <= 150) score += 160;
  else score += 220;

  if (voc <= 100) score += 5;
  else if (voc <= 200) score += 15;
  else if (voc <= 300) score += 30;
  else if (voc <= 500) score += 45;
  else score += 60;

  if (co2 <= 800) score += 5;
  else if (co2 <= 1200) score += 10;
  else if (co2 <= 2000) score += 20;
  else score += 35;

  if (hcho <= 0.08) score += 5;
  else if (hcho <= 0.2) score += 10;
  else if (hcho <= 0.5) score += 20;
  else score += 40;

  if (temp < 20 || temp > 30) score += 5;
  if (hum < 35 || hum > 70) score += 5;

  if (score > 500) score = 500;
  return score;
}

// ======================================================
// WIFI MANAGEMENT
// ======================================================
void setup_wifi() {
  WiFi.disconnect(true, true);
  delay(2000);
  WiFi.mode(WIFI_STA);
  Serial.print("Connecting WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid.c_str(), pass.c_str());

  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Connected");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi Failed");
  }
}

// ======================================================
// MQTT RECONNECT
// ======================================================
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (client.connected()) return;

  if (client.connect(mqtt_client_id, mqtt_user, mqtt_password)) {
    Serial.println("MQTT Connected");
  } else {
    Serial.print("MQTT Failed: ");
    Serial.println(client.state());
  }
}

// ======================================================
// SENSEGRID PLATFORM HTTP INGEST
// ======================================================
void sendToPlatform() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure secureClient;
  secureClient.setInsecure(); // Bypass SSL verification for ease of hosting/LAN fallback
  HTTPClient http;

  Serial.println("Sending data to SenseGrid Cloud Platform...");

  if (http.begin(secureClient, platformApiUrl)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Device-Token", platformDeviceToken);

    // Create JSON Payload
    StaticJsonDocument<512> doc;
    doc["device_id"] = platformDeviceId;
    doc["temperature"] = tempSHT;
    doc["humidity"] = humSHT;
    doc["pm2.5"] = pm25;
    doc["pm10"] = pm10;
    doc["oxygen"] = oxygenData;
    doc["pressure"] = pressure;
    doc["hcho"] = hcho;
    doc["voc"] = voc;
    doc["co2"] = co2;
    doc["iaq"] = iaq;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.printf("Platform Ingest Response Code: %d\n", httpResponseCode);
      if (httpResponseCode != 200) {
        String response = http.getString();
        Serial.println("Error details: " + response);
      }
    } else {
      Serial.printf("Platform Ingest POST failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("Unable to connect to SenseGrid server.");
  }
}

// ======================================================
// SENSOR READING & LOGIC LOOP
// ======================================================
void readAllSensors() {
  // Read Oxygen
  if (oxygen_ok) {
    selectChannel(0);
    oxygenData = oxygen.getOxygenData(COLLECT_NUMBER);
    if (oxygenData > 20.9) oxygenData = 20.9;
    delay(50);
  }

  // Read SEN66
  if (sen66_ok) {
    selectChannel(1);
    float pm1p0, pm2p5, pm4p0, pm10p0;
    float humidity, temperature;
    float vocIndex, noxIndex;
    uint16_t co2Raw;

    error = sen66.readMeasuredValues(pm1p0, pm2p5, pm4p0, pm10p0, humidity, temperature, vocIndex, noxIndex, co2Raw);
    if (error == NO_ERROR) {
      pm25 = pm2p5;
      pm10 = pm10p0;
      voc = (int)vocIndex;
      co2 = co2Raw;
    }
    delay(50);
  }

  // Read SHT40
  if (sht40_ok) {
    selectChannel(3);
    sensors_event_t humidityEvent, tempEvent;
    if (sht4.getEvent(&humidityEvent, &tempEvent)) {
      tempSHT = tempEvent.temperature - 2.0;
      humSHT = humidityEvent.relative_humidity + 5.0;
    }
    delay(50);
  }

  // Read BMX280
  if (bme280_ok) {
    selectChannel(2);
    pressure = bmx280.readPressure() / 100.0F;
    delay(50);
  }

  // Read HCHO & Calculate IAQ
  hcho = readHCHOppm();
  iaq = calculateIAQ(pm25, co2, voc, hcho, tempSHT, humSHT);
}

// ======================================================
// BLUETOOTH CONFIGURATION & BLE MODE
// ======================================================
void BLEbegin() {
  btEnabled = true;
  sendToDWIN(0x5446, 1);
  SerialBT.begin("Sensuri_IAQ_Monitor_46");
  Serial.println("Bluetooth Configuration Mode Started");

  unsigned long startTime = millis();
  while (millis() - startTime < 120000) {
    readAllSensors();

    // DWIN Display updates
    sendToDWIN(0x5420, tempSHT * 100);
    delay(20);
    sendToDWIN(0x5422, humSHT * 100);
    delay(20);
    sendToDWIN(0x5424, pm25 * 100);
    delay(20);
    sendToDWIN(0x5426, pm10 * 100);
    delay(20);
    sendToDWIN(0x5428, iaq);
    delay(20);
    sendToDWIN(0x5430, voc);
    delay(20);
    sendToDWIN(0x5432, oxygenData * 100);
    delay(20);
    sendToDWIN(0x5434, co2);
    delay(20);
    sendToDWIN(0x5436, hcho * 1000);
    delay(20);
    sendToDWIN(0x5438, pressure * 10);
    delay(20);
    sendToDWIN(0x5440, 0);
    delay(20);
    sendToDWIN(0x5442, 0);
    delay(20);
    sendToDWIN(0x5446, 1);
    delay(20);

    if (SerialBT.available()) {
      String data = SerialBT.readString();
      Serial.println(data);

      int ssidStart = data.indexOf("SSID:") + 5;
      int passStart = data.indexOf("Password:") + 9;

      if (ssidStart != -1 && passStart != -1) {
        String newSSID = data.substring(ssidStart, data.indexOf(';', ssidStart));
        String newPASS = data.substring(passStart);
        newPASS.replace("\n", "");
        newPASS.replace("\r", "");
        newSSID.trim();
        newPASS.trim();

        EEPROM.begin(EEPROM_SIZE);
        for (int i = 0; i < EEPROM_SIZE; i++) {
          EEPROM.write(i, 0);
        }
        EEPROM.commit();
        delay(500);

        for (int i = 0; i < newSSID.length(); i++) {
          EEPROM.write(i, newSSID[i]);
        }
        for (int i = 0; i < newPASS.length(); i++) {
          EEPROM.write(32 + i, newPASS[i]);
        }
        EEPROM.commit();
        delay(1000);

        ssid = newSSID;
        pass = newPASS;
        btEnabled = false;
        sendToDWIN(0x5446, 0);
        SerialBT.end();
        btStop();
        delay(2000);

        setup_wifi();
        return;
      }
    }
    delay(1000);
  }

  btEnabled = false;
  sendToDWIN(0x5446, 0);
  SerialBT.end();
  btStop();

  EEPROM.begin(EEPROM_SIZE);
  ssid = "";
  pass = "";
  for (int i = 0; i < 32; i++) {
    char c = EEPROM.read(i);
    if (c != 0) ssid += c;
  }
  for (int i = 32; i < 64; i++) {
    char c = EEPROM.read(i);
    if (c != 0) pass += c;
  }
  EEPROM.commit();
  setup_wifi();
}

// ======================================================
// CALIBRATION
// ======================================================
void calibrateSensor() {
  long sum = 0;
  Serial.println("Calibrating HCHO Sensor...");
  for (int i = 0; i < 100; i++) {
    sum += analogRead(HCHO_PIN);
    delay(50);
  }
  CLEAN_ADC = sum / 100;
  Serial.println("---------------------------------");
  Serial.printf("Clean Air ADC = %d\n", CLEAN_ADC);
  Serial.println("---------------------------------");
}

// ======================================================
// INITIALIZATION
// ======================================================
void initSensors() {
  selectChannel(0);
  oxygen_ok = oxygen.begin(Oxygen_I2C_ADDRESS);

  selectChannel(1);
  sen66.begin(Wire, SEN66_I2C_ADDR_6B);
  error = sen66.deviceReset();
  if (error == NO_ERROR) {
    delay(1200);
    error = sen66.startContinuousMeasurement();
    if (error == NO_ERROR) sen66_ok = true;
  }

  selectChannel(3);
  sht40_ok = sht4.begin();
  if (sht40_ok) {
    sht4.setPrecision(SHT4X_HIGH_PRECISION);
    sht4.setHeater(SHT4X_NO_HEATER);
  }

  selectChannel(2);
  bme280_ok = bmx280.begin();
  if (bme280_ok) {
    bmx280.setSampling(BMX280_MODE_NORMAL, BMX280_SAMPLING_X16, BMX280_SAMPLING_X16, BMX280_SAMPLING_X16, BMX280_FILTER_X16, BMX280_STANDBY_MS_500);
  }
}

// ======================================================
// MAIN SETUP
// ======================================================
void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, RXD2, TXD2);
  Wire.begin(21, 22);
  analogReadResolution(12);
  pinMode(HCHO_PIN, INPUT);

  calibrateSensor();
  EEPROM.begin(EEPROM_SIZE);
  client.setServer(mqtt_server, mqtt_port);

  initSensors();
  delay(3000);
  Serial.println("All Sensors Initialized");

  BLEbegin();
}

// ======================================================
// MAIN LOOP
// ======================================================
void loop() {
  reconnectMQTT();
  client.loop();

  readAllSensors();

  // DWIN display updates
  sendToDWIN(0x5420, tempSHT * 100);
  delay(50);
  sendToDWIN(0x5422, humSHT * 100);
  delay(50);
  sendToDWIN(0x5424, pm25 * 100);
  delay(50);
  sendToDWIN(0x5426, pm10 * 100);
  delay(50);
  sendToDWIN(0x5428, iaq);
  delay(50);
  sendToDWIN(0x5430, voc);
  delay(50);
  sendToDWIN(0x5432, oxygenData * 100);
  delay(50);
  sendToDWIN(0x5434, co2);
  delay(50);
  sendToDWIN(0x5436, hcho * 1000);
  delay(50);
  sendToDWIN(0x5438, pressure * 10);
  delay(50);
  sendToDWIN(0x5440, WiFi.status() == WL_CONNECTED ? 1 : 0);
  delay(50);
  sendToDWIN(0x5442, client.connected() ? 1 : 0);
  delay(50);
  sendToDWIN(0x5446, btEnabled ? 1 : 0);
  delay(50);

  // Send to MQTT Broker
  if (client.connected()) {
    char payload[500];
    sprintf(payload,
            "{\"temperature\":%.2f,\"humidity\":%.2f,\"pm2.5\":%.2f,\"pm10\":%.2f,\"oxygen\":%.2f,\"pressure\":%.2f,\"hcho\":%.3f,\"voc\":%d,\"co2\":%d,\"iaq\":%d}",
            tempSHT, humSHT, pm25, pm10, oxygenData, pressure, hcho, voc, co2, iaq);
    client.publish(mqtt_topic, payload);
  }

  // Send to SenseGrid Platform via HTTP
  unsigned long currentMillis = millis();
  if (currentMillis - lastPlatformSendTime >= platformSendInterval) {
    lastPlatformSendTime = currentMillis;
    sendToPlatform();
  }

  delay(1000);
}
