"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Wifi, WifiOff, BatteryMedium, ShieldAlert, Navigation, Lock } from 'lucide-react';

const initialRadarData = Array.from({ length: 19 }, (_, i) => ({
  angle: (i * 10).toString(),
  distance: 400 
}));

export default function ResqRoverDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState("MANUAL");
  const [battery, setBattery] = useState(100);
  const [radarData, setRadarData] = useState(initialRadarData);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://192.168.4.1/ws');

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);

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
          setBattery(data.battery);
        }
      } catch (error) {
        console.error("Error parsing WebSocket data:", error);
      }
    };

    return () => ws.current?.close();
  }, []);

  const sendCommand = (cmd: string) => {
    if (ws.current && isConnected) {
      ws.current.send(cmd);
    }
  };

  const toggleMode = () => {
    const newMode = mode === "AUTO" ? "MANUAL" : "AUTO";
    sendCommand(`MODE:${newMode}`);
    setMode(newMode);
  };

  const handleDrive = (dir: string) => sendCommand(`DRIVE:${dir}`);
  const handleStop = () => sendCommand("DRIVE:STOP");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-red-500 flex items-center gap-3">
            <ShieldAlert size={32} />
            RESQ-ROVER <span className="text-slate-500 text-lg font-normal">Command Center</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Team NODE-X | BuildFest 2.0</p>
        </div>

        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
            <BatteryMedium className="text-green-500" />
            <span className="font-mono">{battery}%</span>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isConnected ? 'bg-green-950/30 border-green-900 text-green-500' : 'bg-red-950/30 border-red-900 text-red-500'}`}>
            {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
            <span className="font-mono text-sm tracking-wide">{isConnected ? "LINK ACTIVE" : "OFFLINE"}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Navigation className="text-blue-500" />
            180° Obstacle Radar
          </h2>
          <div className="h-[400px] w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative">
            
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="80%" outerRadius="120%" data={radarData} startAngle={180} endAngle={0}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="angle" tick={{ fill: '#475569', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 400]} tick={false} axisLine={false} />
                <Radar
                  name="Distance (cm)"
                  dataKey="distance"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                  isAnimationActive={false} 
                />
              </RadarChart>
            </ResponsiveContainer>
            
            <div className="absolute bottom-0 w-full text-center pb-2 text-xs font-mono text-slate-600">
              HC-SR04 SENSOR ARRAY ORIGIN
            </div>
          </div>
        </div>

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
            <h3 className="text-sm text-slate-400 font-bold tracking-widest mb-6">TELEOPERATION</h3>
            
            <div className="grid grid-cols-3 gap-2">
              <div />
              <button 
                onMouseDown={() => handleDrive('W')} onMouseUp={handleStop} onMouseLeave={handleStop}
                className="w-16 h-16 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl transition-colors"
              >W</button>
              <div />
              <button 
                onMouseDown={() => handleDrive('A')} onMouseUp={handleStop} onMouseLeave={handleStop}
                className="w-16 h-16 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl transition-colors"
              >A</button>
              <button 
                onMouseDown={() => handleDrive('S')} onMouseUp={handleStop} onMouseLeave={handleStop}
                className="w-16 h-16 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl transition-colors"
              >S</button>
              <button 
                onMouseDown={() => handleDrive('D')} onMouseUp={handleStop} onMouseLeave={handleStop}
                className="w-16 h-16 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl transition-colors"
              >D</button>
            </div>
            <p className="text-xs text-slate-500 mt-6 font-mono">Press and hold to drive</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <button className="w-full py-3 bg-slate-800 hover:bg-yellow-600 rounded-lg font-bold tracking-widest flex items-center justify-center gap-2 transition-colors">
              <Lock size={18} />
              TOGGLE MEDKIT LATCH
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}