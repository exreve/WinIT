'use client'

import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.velinbangkok.com'

interface MetricDataPoint {
  timestamp: number
  value: number
  time: string
  [key: string]: number | string
}

export default function MetricsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [httpRequestsData, setHttpRequestsData] = useState<MetricDataPoint[]>([])
  const [serviceUpData, setServiceUpData] = useState<MetricDataPoint[]>([])
  const [memoryUsageData, setMemoryUsageData] = useState<MetricDataPoint[]>([])
  const [cpuUsageData, setCpuUsageData] = useState<MetricDataPoint[]>([])
  const [podCountData, setPodCountData] = useState<MetricDataPoint[]>([])
  const [timeRange, setTimeRange] = useState('1h')

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const now = Math.floor(Date.now() / 1000)
      let startTime = now - 3600 // Default: 1 hour
      
      if (timeRange === '1h') startTime = now - 3600
      else if (timeRange === '6h') startTime = now - 21600
      else if (timeRange === '24h') startTime = now - 86400

      // Fetch HTTP requests total
      try {
        const httpResponse = await fetch(
          `${API_URL}/api/prometheus/query_range?query=sum(rate(http_requests_total[1m]))&start=${startTime}&end=${now}&step=30`
        )
        const httpData = await httpResponse.json()
        
        if (httpData.status === 'success' && httpData.data?.result?.[0]?.values) {
          const formatted = httpData.data.result[0].values.map(([timestamp, value]: [string, string]) => ({
            timestamp: parseInt(timestamp) * 1000,
            value: parseFloat(value) || 0,
            time: new Date(parseInt(timestamp) * 1000).toLocaleTimeString()
          }))
          setHttpRequestsData(formatted)
        } else if (httpData.error) {
          console.warn('HTTP requests query error:', httpData.error)
          setHttpRequestsData([])
        } else {
          setHttpRequestsData([])
        }
      } catch (err) {
        console.warn('Failed to fetch HTTP requests:', err)
        setHttpRequestsData([])
      }

      // Fetch service up status
      try {
        const upResponse = await fetch(
          `${API_URL}/api/prometheus/query_range?query=up{job="backend-service"}&start=${startTime}&end=${now}&step=30`
        )
        const upData = await upResponse.json()
        
        if (upData.status === 'success' && upData.data?.result?.[0]?.values) {
          const formatted = upData.data.result[0].values.map(([timestamp, value]: [string, string]) => ({
            timestamp: parseInt(timestamp) * 1000,
            value: parseFloat(value) || 0,
            time: new Date(parseInt(timestamp) * 1000).toLocaleTimeString()
          }))
          setServiceUpData(formatted)
        } else if (upData.error) {
          console.warn('Service up query error:', upData.error)
          setServiceUpData([])
        } else {
          setServiceUpData([])
        }
      } catch (err) {
        console.warn('Failed to fetch service status:', err)
        setServiceUpData([])
      }

      // Fetch cluster memory usage (something that moves a lot)
      try {
        // Try container_memory_usage_bytes (from cAdvisor) or node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
        const memoryQueries = [
          'sum(container_memory_usage_bytes{container!="POD",container!=""}) / 1024 / 1024 / 1024', // GB
          'sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024 / 1024', // GB
        ]
        
        for (const query of memoryQueries) {
          try {
            const memResponse = await fetch(
              `${API_URL}/api/prometheus/query_range?query=${encodeURIComponent(query)}&start=${startTime}&end=${now}&step=30`
            )
            const memData = await memResponse.json()
            
            if (memData.status === 'success' && memData.data?.result?.[0]?.values) {
              const formatted = memData.data.result[0].values.map(([timestamp, value]: [string, string]) => ({
                timestamp: parseInt(timestamp) * 1000,
                value: parseFloat(value) || 0,
                time: new Date(parseInt(timestamp) * 1000).toLocaleTimeString()
              }))
              setMemoryUsageData(formatted)
              break // Use first successful query
            }
          } catch (err) {
            console.warn(`Memory query failed: ${query}`, err)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch memory metrics:', err)
        setMemoryUsageData([])
      }

      // Fetch CPU usage
      try {
        const cpuQueries = [
          'sum(rate(container_cpu_usage_seconds_total{container!="POD",container!=""}[1m])) * 100', // Percentage
          'sum(rate(node_cpu_seconds_total{mode!="idle"}[1m])) / sum(rate(node_cpu_seconds_total[1m])) * 100', // Percentage
        ]
        
        for (const query of cpuQueries) {
          try {
            const cpuResponse = await fetch(
              `${API_URL}/api/prometheus/query_range?query=${encodeURIComponent(query)}&start=${startTime}&end=${now}&step=30`
            )
            const cpuData = await cpuResponse.json()
            
            if (cpuData.status === 'success' && cpuData.data?.result?.[0]?.values) {
              const formatted = cpuData.data.result[0].values.map(([timestamp, value]: [string, string]) => ({
                timestamp: parseInt(timestamp) * 1000,
                value: parseFloat(value) || 0,
                time: new Date(parseInt(timestamp) * 1000).toLocaleTimeString()
              }))
              setCpuUsageData(formatted)
              break
            }
          } catch (err) {
            console.warn(`CPU query failed: ${query}`, err)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch CPU metrics:', err)
        setCpuUsageData([])
      }

      // Fetch pod count (something that changes)
      try {
        const podQuery = 'count(kube_pod_info)'
        const podResponse = await fetch(
          `${API_URL}/api/prometheus/query_range?query=${encodeURIComponent(podQuery)}&start=${startTime}&end=${now}&step=30`
        )
        const podData = await podResponse.json()
        
        if (podData.status === 'success' && podData.data?.result?.[0]?.values) {
          const formatted = podData.data.result[0].values.map(([timestamp, value]: [string, string]) => ({
            timestamp: parseInt(timestamp) * 1000,
            value: parseFloat(value) || 0,
            time: new Date(parseInt(timestamp) * 1000).toLocaleTimeString()
          }))
          setPodCountData(formatted)
        } else {
          // Fallback: try container count
          const containerQuery = 'count(container_start_time_seconds{container!="POD",container!=""})'
          const containerResponse = await fetch(
            `${API_URL}/api/prometheus/query_range?query=${encodeURIComponent(containerQuery)}&start=${startTime}&end=${now}&step=30`
          )
          const containerData = await containerResponse.json()
          
          if (containerData.status === 'success' && containerData.data?.result?.[0]?.values) {
            const formatted = containerData.data.result[0].values.map(([timestamp, value]: [string, string]) => ({
              timestamp: parseInt(timestamp) * 1000,
              value: parseFloat(value) || 0,
              time: new Date(parseInt(timestamp) * 1000).toLocaleTimeString()
            }))
            setPodCountData(formatted)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch pod count:', err)
        setPodCountData([])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchMetrics])

  if (loading && httpRequestsData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Server Metrics Dashboard</h2>
        <p className="text-gray-600">Loading metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Server Metrics Dashboard</h2>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchMetrics}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Server Metrics Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-3 py-1 rounded ${timeRange === '1h' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            1h
          </button>
          <button
            onClick={() => setTimeRange('6h')}
            className={`px-3 py-1 rounded ${timeRange === '6h' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            6h
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1 rounded ${timeRange === '24h' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            24h
          </button>
          <button
            onClick={fetchMetrics}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* HTTP Requests Rate */}
        {httpRequestsData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">HTTP Requests Rate (requests/second)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={httpRequestsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value: unknown) => {
                    if (typeof value === 'number') {
                      return new Date(value).toLocaleString()
                    }
                    return String(value)
                  }}
                  formatter={(value: unknown) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
                    return [numValue.toFixed(2), 'req/s']
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Requests/sec"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Service Status */}
        {serviceUpData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Service Availability</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={serviceUpData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 1.2]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: number) => value === 1 ? 'Up' : 'Down'}
                />
                <Tooltip 
                  labelFormatter={(value: unknown) => {
                    if (typeof value === 'number') {
                      return new Date(value).toLocaleString()
                    }
                    return String(value)
                  }}
                  formatter={(value: unknown) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
                    return [numValue === 1 ? 'Up' : 'Down', 'Status']
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={serviceUpData[serviceUpData.length - 1]?.value === 1 ? "#82ca9d" : "#ff7300"} 
                  strokeWidth={2}
                  dot={false}
                  name="Status"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Memory Usage */}
        {memoryUsageData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Cluster Memory Usage (GB)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={memoryUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value: unknown) => {
                    if (typeof value === 'number') {
                      return new Date(value).toLocaleString()
                    }
                    return String(value)
                  }}
                  formatter={(value: unknown) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
                    return [numValue.toFixed(2), 'GB']
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ff7300" 
                  fill="#ff7300" 
                  fillOpacity={0.6}
                  name="Memory (GB)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CPU Usage */}
        {cpuUsageData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Cluster CPU Usage (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cpuUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(value: unknown) => {
                    if (typeof value === 'number') {
                      return new Date(value).toLocaleString()
                    }
                    return String(value)
                  }}
                  formatter={(value: unknown) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
                    return [numValue.toFixed(2), '%']
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00ff00" 
                  fill="#00ff00" 
                  fillOpacity={0.6}
                  name="CPU (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pod Count */}
        {podCountData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Running Pods Count</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={podCountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip 
                  labelFormatter={(value: unknown) => {
                    if (typeof value === 'number') {
                      return new Date(value).toLocaleString()
                    }
                    return String(value)
                  }}
                  formatter={(value: unknown) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
                    return [Math.round(numValue), 'pods']
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0088fe" 
                  strokeWidth={2}
                  dot={false}
                  name="Pods"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {httpRequestsData.length === 0 && serviceUpData.length === 0 && memoryUsageData.length === 0 && cpuUsageData.length === 0 && podCountData.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No metrics data available.</p>
            <p className="text-sm">This could mean:</p>
            <ul className="text-sm list-disc list-inside mt-2 space-y-1">
              <li>Prometheus is not running or not accessible</li>
              <li>Metrics haven&apos;t been collected yet</li>
              <li>The backend service is not being scraped</li>
            </ul>
            <button
              onClick={fetchMetrics}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

