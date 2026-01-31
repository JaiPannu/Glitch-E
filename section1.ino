const int ENA = 5;
const int IN1 = 8;
const int IN2 = 9;

const int ENB = 6;
const int IN3 = 10;
const int IN4 = 11;

// -------- IR SENSORS --------
const int IR_LEFT  = A0;
const int IR_RIGHT = A1;

// -------- ULTRASONIC --------
const int TRIG_PIN = 2;
const int ECHO_PIN = 3;

// -------- SERVOS --------
#include <Servo.h>
Servo armServo;
Servo clawServo;
const int ARM_PIN  = 12;
const int CLAW_PIN = 13;

int baseSpeed = 150;
int turnSpeed = 120;
int obstacleDistance = 20;


void setup() {
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  pinMode(ENB, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  pinMode(IR_LEFT, INPUT);
  pinMode(IR_RIGHT, INPUT);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  armServo.attach(ARM_PIN);
  clawServo.attach(CLAW_PIN);

  armUp();
  clawOpen();

}

void loop() {
  long distance = readUltrasonic();

  if (distance > 0 && distance < obstacleDistance) {
    avoidObstacle();
  } 
  else {
    followPath();
  }
}

void followPath() {
  int left = digitalRead(IR_LEFT);
  int right = digitalRead(IR_RIGHT);

  if (left == LOW && right == LOW) {
    moveForward();
  }
  else if (left == LOW && right == HIGH) {
    turnLeft();
  }
  else if (left == HIGH && right == LOW) {
    turnRight();
  }
  else {
    stopMotors();
  }
}

void avoidObstacle() {
  stopMotors();
  delay(200);

  turnLeft();
  delay(400);

  moveForward();
  turnRight();
  moveForward();
  stopMotors();
}

long readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 25000);
  if (duration == 0) return -1;

  return duration * 0.034 / 2;
}

void moveForward() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, baseSpeed);
  analogWrite(ENB, baseSpeed);
}

void moveBackward() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  analogWrite(ENA, baseSpeed);
  analogWrite(ENB, baseSpeed);
}

void turnLeft() {
  analogWrite(ENA, turnSpeed);
  analogWrite(ENB, baseSpeed);
}

void turnRight() {
  analogWrite(ENA, baseSpeed);
  analogWrite(ENB, turnSpeed);
}

void stopMotors() {
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
}

void armUp() {
  armServo.write(60);
}

void armDown() {
  armServo.write(120);
}

void clawOpen() {
  clawServo.write(90);
}

void clawClose() {
  clawServo.write(30);
}



