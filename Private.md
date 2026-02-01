#include "DataLogger.h"

void loop() {
   // ... your robot logic ...
   
   if (obstacleDetected) {
       logEvent(EVENT_OBSTACLE, distance); 
   }

   // CHECK FOR LAPTOP CONNECTION
   if (Serial.available() > 0) {
       char cmd = Serial.read();
       if (cmd == 'S') { // 'S' for SYNC
           dumpData();
       }
   }
}