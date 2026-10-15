# RESQ-ROVER 🚑🤖
**Team NODE-X | BuildFest 2.0 | PS-26**

RESQ-ROVER is a low-cost, fully autonomous 4-wheel rover designed for emergency supply delivery in disaster response scenarios. It features a custom 3-RRS parallel linkage platform that self-balances medical payloads across rough terrain.

## 🌟 Key Features
* **Active Payload Stabilization:** Uses an MPU6050 IMU and a 3-RRS parallel servo linkage to counter-tilt the upper medical kit platform, keeping supplies perfectly level.
* **Obstacle Detection:** 180° sweeping HC-SR04 ultrasonic radar mounted at the front nose.
* **Telemetry & Dashboard:** Real-time data transmission via MQTT to a custom Next.js web dashboard.
* **Low-CoG 3D Printed Chassis:** 100% support-free 3D printed mechanical design built on a wide-track 215x215mm base.

## 📁 Repository Structure
* `/CAD` - OpenSCAD parametric design files and ready-to-print STLs.
* `/Firmware` - C++ code for STM32 (Motor Control/Kinematics) and ESP32 (Sensors/MQTT).
* `/Dashboard` - Next.js web interface for remote monitoring.
* `/Docs` - System schematics, presentation slides, and hardware photos.

---
*Built with ❤️ by Team NODE-X at Guru Nanak Dev University.*