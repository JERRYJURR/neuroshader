import { CanvasPreview } from './components/CanvasPreview'
import { Inspector } from './components/Inspector'
import { LayersPanel } from './components/LayersPanel'
import { Toolbar } from './components/Toolbar'

export function App() {
  return (
    <div className="app-shell">
      <Toolbar />
      <div className="app">
        <aside className="panel panel-left">
          <LayersPanel />
        </aside>
        <main className="stage">
          <CanvasPreview />
          <div className="stage-badge">neuroshader · studio</div>
        </main>
        <aside className="panel panel-right">
          <Inspector />
        </aside>
      </div>
    </div>
  )
}
