'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.velinbangkok.com'

export default function Home() {
  const [healthResult, setHealthResult] = useState<string>('')
  const [metricsResult, setMetricsResult] = useState<string>('')
  const [loading, setLoading] = useState({ health: false, metrics: false })

  const testHealth = async () => {
    setLoading({ ...loading, health: true })
    setHealthResult('Testing...')
    try {
      const response = await fetch(`${API_URL}/health`)
      const data = await response.json()
      setHealthResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setHealthResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading({ ...loading, health: false })
    }
  }

  const testMetrics = async () => {
    setLoading({ ...loading, metrics: true })
    setMetricsResult('Testing...')
    try {
      const response = await fetch(`${API_URL}/metrics`)
      const text = await response.text()
      setMetricsResult(text)
    } catch (error) {
      setMetricsResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading({ ...loading, metrics: false })
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">WinIT Backend Tester</h1>
        
        <div className="space-y-6">
          {/* Project Status Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Project Status</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong className="text-gray-900">Implementation Status:</strong> Normally everything is implemented as requested.
              </p>
              
              <p>
                <strong className="text-gray-900">Deployment Environment:</strong> I had a bit of struggle to run Minikube as I&apos;m using QubesOS (very long loading time and constant high CPU usage). So I use a VPS for it.
              </p>
              
              <p>
                <strong className="text-gray-900">Learning Curve:</strong> That&apos;s a lot of new tools, will have a bit of a learning curve so would require more time, trying to play with it to fully understand all the underlying tech, concepts, and commands.
              </p>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm">
                  <strong className="text-gray-900">GitHub Repository:</strong>{' '}
                  <a 
                    href="https://github.com/exreve/WinIT" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    https://github.com/exreve/WinIT
                  </a>
                </p>
              </div>
              
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm">
                  <strong className="text-gray-900">Access:</strong> The frontend and backend are served through Cloudflare tunnel to the VPS.
                </p>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm">
                  <strong className="text-gray-900">Security Notes:</strong>
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>I&apos;m aware that both Docker repos are public</li>
                  <li>Normally .gitignore and .dockerignore are correctly set so we didn&apos;t leak any credentials</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Health Check Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Health Check</h2>
            <p className="text-gray-600 mb-4">Test the /health endpoint</p>
            <button
              onClick={testHealth}
              disabled={loading.health}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.health ? 'Testing...' : 'Test /health'}
            </button>
            {healthResult && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {healthResult}
                </pre>
              </div>
            )}
          </div>

          {/* Metrics Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Prometheus Metrics</h2>
            <p className="text-gray-600 mb-4">Test the /metrics endpoint</p>
            <button
              onClick={testMetrics}
              disabled={loading.metrics}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.metrics ? 'Testing...' : 'Test /metrics'}
            </button>
            {metricsResult && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm whitespace-pre-wrap">
                  {metricsResult}
                </pre>
              </div>
            )}
          </div>

          {/* API Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>API URL:</strong> {API_URL}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

