#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>
#include <HTTPClient.h>

#include "secrets.h"

#define SDA_PIN 21
#define SCL_PIN 22
#define SEALEVELPRESSURE_HPA (1020)

Adafruit_BME280 bme; // I2C

BH1750 lightMeter;

unsigned long delayTime;

String get_wifi_status(int status){
    switch(status){
        case WL_IDLE_STATUS:
        return "WL_IDLE_STATUS";
        case WL_SCAN_COMPLETED:
        return "WL_SCAN_COMPLETED";
        case WL_NO_SSID_AVAIL:
        return "WL_NO_SSID_AVAIL";
        case WL_CONNECT_FAILED:
        return "WL_CONNECT_FAILED";
        case WL_CONNECTION_LOST:
        return "WL_CONNECTION_LOST";
        case WL_CONNECTED:
        return "WL_CONNECTED";
        case WL_DISCONNECTED:
        return "WL_DISCONNECTED";
    }
}

void get_network_info(){
    if(WiFi.status() == WL_CONNECTED) {
        Serial.print("[*] Network information for ");
        Serial.println(ssid);

        Serial.println("[+] BSSID : " + WiFi.BSSIDstr());
        Serial.print("[+] Gateway IP : ");
        Serial.println(WiFi.gatewayIP());
        Serial.print("[+] Subnet Mask : ");
        Serial.println(WiFi.subnetMask());
        Serial.println((String)"[+] RSSI : " + WiFi.RSSI() + " dB");
        Serial.print("[+] ESP32 IP : ");
        Serial.println(WiFi.localIP());
    }
}

void printValues() {
    Serial.print("Temperature = ");
    Serial.print(bme.readTemperature());
    Serial.println(" *C");

    Serial.print("Pressure = ");
    Serial.print(bme.readPressure() / 100.0F);
    Serial.println(" hPa");

    Serial.print("Approx. Altitude = ");
    Serial.print(bme.readAltitude(SEALEVELPRESSURE_HPA));
    Serial.println(" m");

    Serial.print("Humidity = ");
    Serial.print(bme.readHumidity());
    Serial.println(" %");

    Serial.print("Light = ");
    Serial.print(lightMeter.readLightLevel());
    Serial.println(" lx");

    Serial.println();
}

void insertValues() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;

        String url = String(SUPABASE_URL) + "/rest/v1/weather_station";
        http.begin(url);

        // Headers requis par Supabase
        http.addHeader("Content-Type", "application/json");
        http.addHeader("apikey", SUPABASE_API_KEY);
        http.addHeader("Authorization", String("Bearer ") + SUPABASE_API_KEY);

        // JSON à envoyer
        String jsonData = "{";
        jsonData += "\"temperature\": " + String(bme.readTemperature(), 2) + ",";
        jsonData += "\"pressure\": " + String(bme.readPressure() / 100.0F, 2) + ",";
        jsonData += "\"humidity\": " + String(bme.readHumidity(), 2) + ",";
        jsonData += "\"light\": " + String(lightMeter.readLightLevel(), 2);
        jsonData += "}";

        // POST
        int httpResponseCode = http.POST(jsonData);

        if (httpResponseCode == 201 || httpResponseCode == 200) {
            Serial.println("Data inserted successfully!");
        } else {
            Serial.print("Failed to insert data. HTTP response: ");
            Serial.println(httpResponseCode);
            String resp = http.getString();
            Serial.println(resp); // détail de l'erreur
        }

        http.end();

    } else {
        Serial.println("WiFi not connected!");
    }
}

void setup(){
    Serial.begin(115200);
    delay(2000);

    WiFi.mode(WIFI_STA); //Optional
    
    Serial.println("\nConnecting");
    int wifi_status = WL_IDLE_STATUS;
    Serial.println(get_wifi_status(wifi_status));

    WiFi.config(ip, gateway, subnet, dns);
    WiFi.begin(ssid, password);

    while(WiFi.status() != WL_CONNECTED){
        delay(500);
        wifi_status = WiFi.status();
        Serial.println(get_wifi_status(wifi_status));
    }

    Serial.println("\nConnected to the WiFi network");
    get_network_info();

    delay(2000);

    Serial.println(F("BME280 test"));

    // Initialiser le bus I2C avec les bons pins
    Wire.begin(SDA_PIN, SCL_PIN);

    bool status;

    status = bme.begin(0x76, &Wire);
    if (!status) {
        Serial.println("Could not find a valid BME280 sensor, check wiring!");
        while (1);
    }

    lightMeter.begin();

    Serial.println("-- Default Test --");
    delayTime = 60000;

    Serial.println();
}

void loop(){
    printValues();
    insertValues();
    delay(delayTime);    
}