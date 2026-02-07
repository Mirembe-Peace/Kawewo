import FanControl from './components/FanControl'
import './App.css'

function App() {
  return (
    <div id="root">
      <header style={{ padding: '0.5rem 0' }}>
        <h1 style={{ color: '#0b66ff' }}>🌬️Kawewo AC — Dashboard</h1>
      </header>
      <main>
        <FanControl />
      </main>
    </div>
  )
}

export default App
