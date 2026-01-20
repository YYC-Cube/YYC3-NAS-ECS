import { useState, useEffect, useRef } from 'react';

interface Stats {
  connections: number;
  traffic: number;
  load: number;
  threats: number;
}

interface ChartData {
  time: string;
  value: number;
}

interface MonitoringData {
  cpu: {
    percent: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    percent: number;
  };
  network: {
    bytesSent: number;
    bytesRecv: number;
    packetsSent: number;
    packetsRecv: number;
  };
  loadAverage: number[];
}

export const useWebSocket = (url: string) => {
  const [data, setData] = useState<Stats>({
    connections: 0,
    traffic: 0,
    load: 0,
    threats: 0
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'websocket' | 'polling' | 'mock'>('mock');
  
  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/v2/monitoring/system?metrics=all');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const { cpu, memory, disk, network } = result.data;
          
          setMonitoringData(result.data);
          
          setData({
            connections: Math.floor(Math.random() * 100) + 1000,
            traffic: Math.floor((network.bytesRecv / 1024 / 1024)),
            load: cpu.percent,
            threats: 0
          });

          setChartData(prev => {
            const newData = [
              ...prev.slice(-19),
              {
                time: new Date().toLocaleTimeString(),
                value: cpu.percent
              }
            ];
            return newData.length > 20 ? newData.slice(-20) : newData;
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    }
  };

  const connectWebSocket = () => {
    try {
      const wsUrl = url === 'ws://mock' 
        ? `ws://${window.location.host}/ws` 
        : url;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionMode('websocket');
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'system_status') {
            const { metrics } = message;
            if (metrics) {
              setMonitoringData(metrics);
              
              setData({
                connections: metrics.connections || 0,
                traffic: Math.floor((metrics.network?.bytesRecv || 0) / 1024 / 1024),
                load: metrics.cpu?.percent || 0,
                threats: 0
              });

              setChartData(prev => {
                const newData = [
                  ...prev.slice(-19),
                  {
                    time: new Date().toLocaleTimeString(),
                    value: metrics.cpu?.percent || 0
                  }
                ];
                return newData.length > 20 ? newData.slice(-20) : newData;
              });
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        fallbackToPolling();
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        if (connectionMode === 'websocket') {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 5000);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      fallbackToPolling();
    }
  };

  const fallbackToPolling = () => {
    console.log('Falling back to HTTP polling');
    setConnectionMode('polling');
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    fetchMonitoringData();
    pollingIntervalRef.current = setInterval(fetchMonitoringData, 2000);
  };

  useEffect(() => {
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (20 - i) * 1000).toLocaleTimeString(),
      value: Math.floor(Math.random() * 50) + 20
    }));
    setChartData(initialData);

    if (url !== 'ws://mock') {
      connectWebSocket();
    } else {
      setConnectionMode('mock');
      const mockInterval = setInterval(() => {
        setData(prev => ({
          connections: Math.max(0, prev.connections + Math.floor(Math.random() * 10) - 5),
          traffic: Math.floor(Math.random() * 800) + 200,
          load: Math.min(100, Math.max(0, prev.load + Math.floor(Math.random() * 10) - 5)),
          threats: prev.threats + (Math.random() > 0.95 ? 1 : 0)
        }));

        setChartData(prev => {
          const newData = [
            ...prev.slice(1),
            {
              time: new Date().toLocaleTimeString(),
              value: Math.floor(Math.random() * 100) + 50
            }
          ];
          return newData;
        });
      }, 2000);

      return () => clearInterval(mockInterval);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);

  return { data, chartData, monitoringData, isConnected, connectionMode };
};
