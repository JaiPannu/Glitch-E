#ifndef DATA_LOGGER_H
#define DATA_LOGGER_H

// --- MEMORY OPTIMIZATION ---
// We can store ~500 events safely in RAM
#define MAX_LOGS 500

struct LogEvent {
  unsigned long timestamp; // 4 bytes
  byte type;               // 1 byte (Event Code)
  int value;               // 2 bytes (Sensor reading/Score)
};

// Event Codes (minimize data size)
const byte EVENT_START = 1;
const byte EVENT_OBSTACLE = 2;
const byte EVENT_BOX_PICKUP = 3;
const byte EVENT_ZONE_ENTER = 4;
const byte EVENT_SHOT = 5;

LogEvent logs[MAX_LOGS];
int logIndex = 0;

void logEvent(byte type, int value) {
  if (logIndex < MAX_LOGS) {
    logs[logIndex].timestamp = millis();
    logs[logIndex].type = type;
    logs[logIndex].value = value;
    logIndex++;
  }
}

// THE BURST FUNCTION
// Trigger this when you detect Serial connection at the Re-upload point
void dumpData() {
  Serial.println("---BEGIN_BURST---");
  for (int i = 0; i < logIndex; i++) {
    // Format: TIME:TYPE:VALUE
    Serial.print(logs[i].timestamp);
    Serial.print(":");
    Serial.print(logs[i].type);
    Serial.print(":");
    Serial.println(logs[i].value);
    delay(5); // Small delay to prevent serial buffer overflow
  }
  Serial.println("---END_BURST---");
  // Optional: Clear memory after dump?
  // logIndex = 0; 
}

#endif