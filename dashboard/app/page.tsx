"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Wifi, WifiOff, BatteryMedium, ShieldAlert, Navigation, Activity, Terminal, AlertTriangle, Keyboard } from 'lucide-react';

const initialRadarData = Array.from({ length: 19 }, (_, i) => ({
  angle: (i * 10).toString(),
  distance: 400 
}));

export default function ResqRoverDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState("MANUAL");
  
  const [espBattery, setEspBattery] = useState(98);
  const [stmBattery, setStmBattery] = useState(95);
  const [imu, setImu] = useState({ pitch: 0.0, roll: 0.0 });
  const [logs, setLogs] = useState<string[]>([
    "[12:00:01] System Boot Initialized.",
    "[12:00:03] Status: SIGNAL_LOST (Awaiting ESP32 Link)"
  ]);
  const [activeTab, setActiveTab] = useState<'route' | 'events' | 'delivery'>('route');
  
  const [radarData, setRadarData] = useState(initialRadarData);
  const ws = useRef<WebSocket | null>(null);
  const activeKeys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    ws.current = new WebSocket('ws://192.168.4.1/ws');

    ws.current.onopen = () => {
      setIsConnected(true);
      addLog("LINK ACTIVE: Connected to RESQ-ROVER AP.");
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      addLog("SIGNAL_LOST: Rover connection dropped.");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'radar') {
          setRadarData(prev => prev.map(point => 
            point.angle === data.angle.toString() 
              ? { ...point, distance: data.distance } 
              : point
          ));
        }
        
        if (data.type === 'telemetry') {
          setMode(data.mode);
          if (data.espBatt) setEspBattery(data.espBatt);
          if (data.stmBatt) setStmBattery(data.stmBatt);
          if (data.imu) setImu(data.imu);
          if (data.alert) addLog(`ALERT: ${data.alert}`);
          if (data.isStuck) addLog("STUCK: Traction failure detected!");
        }
      } catch (error) {
        console.error("Error parsing WebSocket data:", error);
      }
    };

    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== "MANUAL") return;
      const key = e.key.toUpperCase();
      if (['W', 'A', 'S', 'D'].includes(key) && !activeKeys.current[key]) {
        activeKeys.current[key] = true;
        sendCommand(`DRIVE:${key}`);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (mode !== "MANUAL") return;
      const key = e.key.toUpperCase();
      if (['W', 'A', 'S', 'D'].includes(key)) {
        activeKeys.current[key] = false;
        if (!Object.values(activeKeys.current).some(Boolean)) {
          sendCommand("DRIVE:STOP");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const sendCommand = (cmd: string) => {
    if (ws.current && isConnected) {
      ws.current.send(cmd);
    }
  };

  const toggleMode = () => {
    const newMode = mode === "AUTO" ? "MANUAL" : "AUTO";
    sendCommand(`MODE:${newMode}`);
    setMode(newMode);
    addLog(`System mode switched to ${newMode}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-red-500 flex items-center gap-3">
            <ShieldAlert size={32} />
            RESQ-ROVER <span className="text-slate-500 text-lg font-normal">Command Center</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Team NODE-X | BuildFest 2.0</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex gap-3 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-1.5"><BatteryMedium className="text-green-500" size={16} />ESP32: {espBattery}%</div>
            <div className="border-r border-slate-700" />
            <div className="flex items-center gap-1.5"><BatteryMedium className="text-blue-500" size={16} />STM32: {stmBattery}%</div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isConnected ? 'bg-green-950/30 border-green-900 text-green-500' : 'bg-red-950/30 border-red-900 text-red-500'}`}>
            {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
            <span className="font-mono text-sm tracking-wide">{isConnected ? "LINK ACTIVE" : "SIGNAL LOST"}</span>
          </div>
        </div>
      </header>

      {/* TOP METRICS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <Activity className="text-yellow-500" size={24} />
          <div>
            <p className="text-xs text-slate-400 font-bold">MPU6050 TILT (PITCH)</p>
            <p className="font-mono text-sm">{imu.pitch.toFixed(1)}°</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <Activity className="text-blue-500" size={24} />
          <div>
            <p className="text-xs text-slate-400 font-bold">MPU6050 TILT (ROLL)</p>
            <p className="font-mono text-sm">{imu.roll.toFixed(1)}°</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-orange-500" size={24} />
          <div>
            <p className="text-xs text-slate-400 font-bold">DIAGNOSTIC STATUS</p>
            <p className="font-mono text-sm text-green-400">Nominal</p>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: RADAR & LOGISTICS */}
        <div className="col-span-2 flex flex-col gap-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Navigation className="text-blue-500" />
              180° Obstacle Radar
            </h2>
            <div className="h-[320px] w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="85%" outerRadius="130%" data={radarData} startAngle={180} endAngle={0}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="angle" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 400]} tick={false} axisLine={false} />
                  <Radar name="Distance (cm)" dataKey="distance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex-1">
            <div className="flex gap-4 border-b border-slate-800 pb-3 mb-4">
              <button onClick={() => setActiveTab('route')} className={`font-bold px-4 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'route' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Route</button>
              <button onClick={() => setActiveTab('events')} className={`font-bold px-4 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'events' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Events</button>
              <button onClick={() => setActiveTab('delivery')} className={`font-bold px-4 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'delivery' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Delivery Result</button>
            </div>

            <div className="text-sm font-mono text-slate-300 min-h-[90px]">
              {activeTab === 'route' && <p>Waypoint A (Start Base) ➔ Waypoint B (Rubble Obstacle Zone) ➔ Waypoint C (Target Drop Zone)</p>}
              {activeTab === 'events' && <p>• [Event]: Radar obstacle detected at 20cm.<br />• [Event]: 3-RRS platform auto-leveled via MPU6050.</p>}
              {activeTab === 'delivery' && <p className="text-green-400 font-bold">STATUS: Medical payload secured. Ready for deployment.</p>}
            </div>
          </div>

        </div>

        {/* RIGHT COL: CONTROLS & TERMINAL */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center shadow-xl">
            <h3 className="text-sm text-slate-400 font-bold tracking-widest mb-4">SYSTEM MODE</h3>
            <button 
              onClick={toggleMode}
              className={`w-full py-4 rounded-lg font-bold tracking-widest transition-all duration-300 ${
                mode === "AUTO" 
                ? "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]" 
                : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              }`}
            >
              {mode === "AUTO" ? "AUTONOMOUS ACTIVE" : "MANUAL OVERRIDE"}
            </button>
          </div>

          <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center shadow-xl transition-opacity duration-300 ${mode === "AUTO" ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            <h3 className="text-sm text-slate-400 font-bold tracking-widest mb-3 flex items-center gap-2">
              <Keyboard size={18} className="text-blue-400" /> KEYBOARD TELEOPERATION
            </h3>
            <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">
              Use your keyboard keys to drive the rover when Manual Override is enabled:
            </p>
            <div className="w-full bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
              <div className="flex justify-between"><span>[ W ]</span> <span className="text-slate-500">Move Forward</span></div>
              <div className="flex justify-between"><span>[ S ]</span> <span className="text-slate-500">Move Backward</span></div>
              <div className="flex justify-between"><span>[ A ]</span> <span className="text-slate-500">Turn Left</span></div>
              <div className="flex justify-between"><span>[ D ]</span> <span className="text-slate-500">Turn Right</span></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col">
            <h3 className="text-xs text-slate-400 font-bold tracking-widest mb-2 flex items-center gap-1.5">
              <Terminal size={14} className="text-red-500" /> SYSTEM MESSAGE LOG
            </h3>
            <div className="bg-slate-950 p-3 rounded-lg h-32 overflow-y-auto font-mono text-xs text-red-400 space-y-1 border border-slate-800">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}