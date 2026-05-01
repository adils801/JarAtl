import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Settings, 
  Shield, 
  Activity, 
  Cpu, 
  Zap, 
  Wifi, 
  Bell,
  MessageSquare,
  Thermometer,
  Lightbulb,
  Lock,
  Power,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Device, SensorData, PredictionInsight, Message } from './types';
import { cn } from './lib/utils';
import { processCommand, getPredictiveInsights } from './services/gemini';
import { jarvisVoice } from './services/voice';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Mock Initial Data
const INITIAL_DEVICES: Device[] = [
  { id: '1', name: 'Main Entrance Arc Lock', type: 'lock', status: 'locked', location: 'Exterior' },
  { id: '2', name: 'Workshop Ambience', type: 'light', status: 'on', value: 80, location: 'Stark Tower' },
  { id: '3', name: 'Climate Control', type: 'thermostat', status: 'active', value: 72, location: 'Stark Tower' },
  { id: '4', name: 'Arc Reactor Grid', type: 'power', status: 'active', value: '4.2kW', location: 'Basement' },
  { id: '5', name: 'Security Perimeter', type: 'security', status: 'active', location: 'Exterior' },
  { id: '6', name: 'Mobile Security Link', type: 'security', status: 'active', location: 'Remote Encrypted' },
];

export default function App() {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [insights, setInsights] = useState<PredictionInsight[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'info' | 'alert'}[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize sensors and run loops
  useEffect(() => {
    const sensorInterval = setInterval(() => {
      const newData: SensorData = {
        timestamp: Date.now(),
        cpuLoad: Math.floor(Math.random() * 30) + 10,
        memoryUsage: Math.floor(Math.random() * 20) + 40,
        networkTraffic: Math.floor(Math.random() * 50) + 10,
        energyConsumption: Math.floor(Math.random() * 10) + 2,
        externalThreats: Math.random() > 0.9 ? 1 : 0
      };
      setSensorHistory(prev => [...prev.slice(-20), newData]);

      if (newData.externalThreats > 0) {
        addNotification("Intrusion attempt detected on Stark Mobile Link. Counter-measures active.", 'alert');
      }
    }, 3000);

    return () => clearInterval(sensorInterval);
  }, []);

  // Run predictive analysis periodically
  useEffect(() => {
    if (sensorHistory.length >= 10) {
      const runAnalysis = async () => {
        const newInsights = await getPredictiveInsights(sensorHistory);
        if (newInsights.length > 0) {
          setInsights(newInsights);
        }
      };
      
      const analysisTimer = setTimeout(runAnalysis, 1000);
      return () => clearTimeout(analysisTimer);
    }
  }, [sensorHistory]);

  const addNotification = (text: string, type: 'info' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, text, type }, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  const handleVoiceCommand = () => {
    if (isListening) {
      jarvisVoice.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    jarvisVoice.listen(
      (text) => {
        setIsListening(false);
        handleCommand(text);
      },
      (err) => {
        setIsListening(false);
        console.error("Listening error:", err);
      }
    );
  };

  const handleCommand = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await processCommand(text, messages);
      
      const jarvisMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'atlas',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, jarvisMessage]);
      jarvisVoice.speak(response);
    } catch (err) {
      console.error("Command processing failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar - Device Control */}
      <aside className="w-full md:w-80 border-r border-white/10 bg-[#0A0A0A] p-6 overflow-y-auto flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield className="text-cyan-400 w-5 h-5" />
            </div>
            <div>
              <h1 className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">JARVIS System</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-tighter">Stark Industries Intelligence</p>
            </div>
          </div>

        <section className="space-y-4">
          <h2 className="text-[10px] uppercase tracking-widest text-white/40 font-bold px-1">Orchestration Nodes</h2>
          <div className="space-y-2">
            {devices.map(device => (
              <motion.div 
                key={device.id}
                whileHover={{ x: 4 }}
                className={cn(
                  "p-3 rounded-lg border bg-white/5 flex items-center justify-between group cursor-pointer transition-all",
                  device.status === 'active' || device.status === 'on' || device.status === 'locked' 
                    ? "border-white/10" 
                    : "border-red-500/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-black/40 text-white/60 group-hover:text-cyan-400 transition-colors">
                    {device.type === 'light' && <Lightbulb size={16} />}
                    {device.type === 'thermostat' && <Thermometer size={16} />}
                    {device.type === 'security' && <Shield size={16} />}
                    {device.type === 'lock' && <Lock size={16} />}
                    {device.type === 'power' && <Power size={16} />}
                  </div>
                  <div>
                    <p className="font-mono text-xs font-medium tracking-tight">{device.name}</p>
                    <p className="text-[9px] text-white/30 uppercase">{device.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-[10px] font-mono",
                    device.status === 'active' || device.status === 'on' || device.status === 'locked' ? "text-cyan-400" : "text-red-400"
                  )}>
                    {device.value || device.status.toUpperCase()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Network Status</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-400">UP</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 p-2 rounded border border-white/10">
              <p className="text-[8px] text-white/30 uppercase italic">Uplink</p>
              <p className="font-mono text-[10px]">842.1 Mbps</p>
            </div>
            <div className="bg-white/5 p-2 rounded border border-white/10">
              <p className="text-[8px] text-white/30 uppercase italic">Downlink</p>
              <p className="font-mono text-[10px]">1.2 Gbps</p>
            </div>
          </div>
        </section>
      </aside>

      {/* Main View - AI Interaction & Analytics */}
      <main className="flex-1 flex flex-col min-w-0 bg-black/40 backdrop-blur-sm relative">
        {/* Header/Status Bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#080808]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-cyan-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">IRON SHIELD</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-cyan-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">ARC-CORE: STABLE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Bell size={18} className="text-white/40 hover:text-white transition-colors cursor-pointer" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black" />
              )}
            </div>
            <Settings size={18} className="text-white/40 hover:text-white transition-colors cursor-pointer" />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
          {/* Top Row - Core Visualization & Predictive Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-fit lg:h-[400px]">
            {/* Core Visualization */}
            <div className="relative bg-[#0A0A0A] rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
              
              {/* Animated HUD Grid */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

              <div className="relative w-48 h-48 flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-cyan-500/20 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border-2 border-cyan-500/30 rounded-full border-t-transparent border-b-transparent"
                />
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)]"
                >
                  <div className="w-28 h-28 rounded-full bg-black flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full relative">
                      {/* Pulse Effect */}
                      <motion.div 
                        animate={{ 
                          height: isListening || isProcessing ? "70%" : "30%",
                          opacity: isProcessing ? [0.4, 1, 0.4] : 1
                        }}
                        className="absolute inset-0 m-auto w-1 bg-cyan-400 rounded-full blur-[2px]"
                      />
                      <motion.div 
                        animate={{ 
                          height: isListening || isProcessing ? "50%" : "20%",
                          opacity: isProcessing ? [0.6, 1, 0.6] : 1
                        }}
                        className="absolute inset-0 m-auto w-1 left-4 bg-cyan-400/50 rounded-full blur-[1px]"
                      />
                      <motion.div 
                        animate={{ 
                          height: isListening || isProcessing ? "50%" : "20%",
                          opacity: isProcessing ? [0.6, 1, 0.6] : 1
                        }}
                        className="absolute inset-0 m-auto w-1 right-4 bg-cyan-400/50 rounded-full blur-[1px]"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-8 text-center space-y-2">
                <h3 className="font-mono text-sm uppercase tracking-widest text-white/80 font-bold">
                  {isProcessing ? "Processing Response..." : isListening ? "Listening..." : "System Idle"}
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-tighter">Ready for Voice Input</p>
              </div>
            </div>

            {/* Predictive Analysis Panel */}
            <div className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-cyan-400" />
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Predictive Insights</h3>
                </div>
                <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded">
                  <span className="text-[8px] font-mono text-cyan-400 uppercase">Analysis Confidence: 94.2%</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <AnimatePresence mode="popLayout">
                  {insights.length > 0 ? (
                    insights.map((insight, idx) => (
                      <motion.div 
                        key={insight.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 rounded-xl border border-white/5 bg-white/5 group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                          {insight.category === 'security' && <Shield size={32} />}
                          {insight.category === 'efficiency' && <Zap size={32} />}
                          {insight.category === 'maintenance' && <Settings size={32} />}
                          {insight.category === 'optimization' && <TrendingUp size={32} />}
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              insight.probability > 0.8 ? "bg-red-400" : "bg-cyan-400"
                            )} />
                            <h4 className="text-xs font-bold leading-none">{insight.title}</h4>
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed max-w-[80%]">{insight.description}</p>
                          <div className="mt-3 flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-white/30 uppercase font-bold">Probability</span>
                              <span className="text-xs font-mono">{(insight.probability * 100).toFixed(0)}%</span>
                            </div>
                            {insight.actionRequired && (
                              <button className="ml-auto text-[9px] uppercase tracking-widest font-bold text-cyan-400 hover:text-white flex items-center gap-1 bg-cyan-400/10 px-2 py-1 rounded border border-cyan-500/20 transition-all">
                                Protocol Ready <ChevronRight size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-white/20 italic text-xs">
                      Acquiring baseline heuristics...
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bottom Row - Real-time Logs & Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[400px]">
            {/* System Sensors Area Chart */}
            <div className="lg:col-span-5 bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" />
                <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Core Telemetry</h3>
              </div>
              
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensorHistory}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="timestamp" 
                      hide 
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#444', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }}
                      itemStyle={{ color: '#22d3ee' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cpuLoad" 
                      stroke="#22d3ee" 
                      fillOpacity={1} 
                      fill="url(#colorCpu)" 
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[8px] text-white/30 uppercase mb-1">Energy Flux</p>
                  <div className="flex items-center gap-2">
                    <Zap size={10} className="text-yellow-400" />
                    <span className="text-xs font-mono">{sensorHistory[sensorHistory.length-1]?.energyConsumption || 0} kWh</span>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] text-white/30 uppercase mb-1">Memory</p>
                  <div className="flex items-center gap-2">
                    <Activity size={10} className="text-cyan-400" />
                    <span className="text-xs font-mono">{sensorHistory[sensorHistory.length-1]?.memoryUsage || 0}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] text-white/30 uppercase mb-1">Traffic</p>
                  <div className="flex items-center gap-2">
                    <Wifi size={10} className="text-green-400" />
                    <span className="text-xs font-mono">{sensorHistory[sensorHistory.length-1]?.networkTraffic || 0} Mbps</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-7 bg-[#0A0A0A] rounded-2xl border border-white/10 flex flex-col overflow-hidden">
               <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-cyan-400" />
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Encrypted Uplink</h3>
                </div>
                <div className="text-[10px] text-white/30 font-mono italic">
                  Security Protocol: IRON SHIELD
                </div>
              </div>

              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center opacity-20">
                      <MessageSquare size={32} />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 italic">Waiting for authentication...</p>
                      <p className="text-[10px] text-white/20 mt-2">Initialize JARVIS with a biometric voice command or text entry.</p>
                    </div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "max-w-[85%] p-4 rounded-xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "ml-auto bg-cyan-500/10 border border-cyan-500/20 rounded-tr-none" 
                          : "mr-auto bg-white/5 border border-white/10 rounded-tl-none"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] uppercase tracking-widest font-bold text-white/40">
                          {msg.role === 'user' ? 'Stark' : 'Jarvis'}
                        </span>
                        <span className="text-[8px] font-mono text-white/20">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={cn(
                        "font-sans",
                        msg.role === 'atlas' ? "text-white/90" : "text-cyan-100"
                      )}>
                        {msg.content}
                      </p>
                    </motion.div>
                  ))
                )}
                {isProcessing && (
                  <div className="mr-auto bg-white/5 border border-white/10 rounded-xl rounded-tl-none p-4 w-24">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" />
                      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                 <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-xl p-1 pr-3 focus-within:border-cyan-500/50 transition-colors">
                  <div className="flex-1 flex items-center">
                    <input 
                      type="text" 
                      placeholder="Enter command manually..."
                      className="w-full bg-transparent border-none focus:ring-0 text-sm px-4 py-2 placeholder:text-white/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value;
                          if (val) {
                            handleCommand(val);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  <button 
                    onClick={handleVoiceCommand}
                    className={cn(
                      "p-3 rounded-lg transition-all flex items-center justify-center relative",
                      isListening 
                        ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
                        : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black"
                    )}
                  >
                    <Mic size={20} />
                    {isListening && (
                      <motion.span 
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-red-500 rounded-lg -z-10"
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Notifications */}
      <div className="fixed top-20 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div 
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className={cn(
                "w-72 p-4 rounded-xl backdrop-blur-xl border flex items-start gap-4 shadow-2xl pointer-events-auto",
                notif.type === 'alert' 
                  ? "bg-red-500/10 border-red-500/30 text-red-100" 
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-100"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                notif.type === 'alert' ? "bg-red-500/20" : "bg-cyan-500/20"
              )}>
                {notif.type === 'alert' ? <AlertTriangle size={18} className="text-red-400" /> : <Bell size={18} className="text-cyan-400" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-60">System Update</p>
                <p className="text-xs leading-relaxed">{notif.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.3);
        }
      `}} />
    </div>
  );
}

