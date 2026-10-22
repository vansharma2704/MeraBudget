"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MapPin, Navigation, ShoppingBag, Utensils } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// High Spending Zones (Example coordinates for Malls and Restaurants)
const HIGH_SPENDING_ZONES = [
  { name: "Phoenix Mall", lat: 18.5622, lng: 73.9168, type: "Mall", message: "Check your Shopping budget! You're near Phoenix Mall." },
  { name: "Global IT Park Food Court", lat: 18.5913, lng: 73.7389, type: "Restaurant", message: "Hungry? Your Dining budget has ₹850 remaining." },
  { name: "Select Citywalk", lat: 28.5287, lng: 77.2185, type: "Mall", message: "Premium shopping area detected. Stay within your limits!" }
];

export default function Geofencing() {
  const [isActive, setIsActive] = useState(false);
  const [currentZone, setCurrentZone] = useState(null);
  const [location, setLocation] = useState(null);
  const watchId = useRef(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  useEffect(() => {
    if (isActive) {
      if ("geolocation" in navigator) {
        watchId.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });

            // Check proximity to zones
            let nearbyZone = null;
            HIGH_SPENDING_ZONES.forEach(zone => {
              const distance = calculateDistance(latitude, longitude, zone.lat, zone.lng);
              if (distance < 500) { // 500 meters threshold
                nearbyZone = zone;
              }
            });

            if (nearbyZone && nearbyZone.name !== currentZone?.name) {
              setCurrentZone(nearbyZone);
              toast.warning(`MeraBudget Alert: ${nearbyZone.name}`, {
                description: nearbyZone.message,
                duration: 6000,
              });
            } else if (!nearbyZone) {
              setCurrentZone(null);
            }
          },
          (error) => {
            console.error("Error tracking location:", error);
            toast.error("Location tracking failed. Please enable GPS.");
            setIsActive(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        toast.error("Geolocation is not supported by your browser.");
        setIsActive(false);
      }
    } else {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      setLocation(null);
      setCurrentZone(null);
    }

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isActive, currentZone?.name]);

  return (
    <Card className="glass-card shadow-gold-500/10 h-full flex flex-col border-gold-500/10">
      <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <MapPin size={16} />
          <span>Live Geofencing</span>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className={`text-[9px] font-black tracking-tighter ${isActive ? "bg-primary shadow-[0_0_10px_rgba(212,168,67,0.5)]" : "bg-white/10"}`}>
          {isActive ? "LIVE TRACKING" : "INACTIVE"}
        </Badge>
      </CardHeader>
      <CardContent className="p-6 flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white uppercase tracking-widest">Real-time Alerts</label>
            <p className="text-[10px] text-slate-500 font-medium">Auto-notifies near high-spending zones</p>
          </div>
          <Switch 
            checked={isActive} 
            onCheckedChange={setIsActive} 
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 transition-all duration-500">
          <div className={`p-3 rounded-xl ${currentZone ? "bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" : "bg-primary/10"}`}>
            <Navigation className={`h-5 w-5 ${currentZone ? "text-red-400" : "text-primary"}`} />
          </div>
          <div className="flex-1">
            <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">MeraBudget Tracking</p>
            <p className="text-xs font-bold text-white glow-text">
              {isActive ? (currentZone ? `⚠️ Entering ${currentZone.name}` : "📍 Monitoring live coordinates...") : "Location tracking is disabled"}
            </p>
            {location && isActive && (
              <p className="text-[8px] text-slate-600 mt-1 font-mono">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {currentZone && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: 10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 10 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 shadow-xl"
            >
              {currentZone.type === "Mall" ? <ShoppingBag className="h-5 w-5 text-red-400 shrink-0 mt-0.5" /> : <Utensils className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
              <div className="text-xs">
                <p className="font-black text-white uppercase tracking-widest text-[10px]">Budget Boundary Warning</p>
                <p className="text-red-200/70 mt-1 leading-relaxed font-medium">
                  {currentZone.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isActive && (
          <div className="p-4 rounded-2xl border border-dashed border-white/5 bg-[#141924]/20 text-center">
            <p className="text-[10px] text-slate-600 font-medium italic">
              Enable GPS to track your location against custom budget zones.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
