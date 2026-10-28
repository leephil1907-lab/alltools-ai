import { useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, AudioWaveform, BookOpen,
  Bot, Check, ChevronDown, CircleHelp, Command, Compass, Cpu, ExternalLink,
  FileText, Fingerprint, FlaskConical, Gauge, Github, Grid2X2, History, LayoutDashboard,
  LockKeyhole, Menu, MessageSquareText, Monitor, MoreHorizontal, Search, Settings2,
  ShieldCheck, Sparkles, Terminal, Video, WandSparkles, X, Zap, Workflow, Database, Globe, GitBranch
} from 'lucide-react';

const groups = [
  { name: 'All tools', icon: Grid2X2 },
  { name: 'AI workspace', icon: Sparkles },
  { name: 'Knowledge', icon: BookOpen },
  { name: 'Creative studio', icon: WandSparkles },
  { name: 'Developer lab', icon: Terminal },
  { name: 'Security lab', icon: ShieldCheck },
  { name: 'System tools', icon: Cpu },
  { name: 'RAG studio', icon: Database },
  { name: 'Automation hub', icon: Workflow },
];
const tools = [
  { id:'assistant', name:'AI Assistant', desc:'Think through ideas, write, plan, and solve tasks with an adaptable AI workspace.', group:'AI workspace', icon:Bot, tone:'lime', status:'Ready', tag:'Core workspace', action:'Open workspace' },
  { id:'memory', name:'Persistent Memory', desc:'Build a searchable memory layer for projects, preferences, notes, and agent context.', group:'AI workspace', icon:Fingerprint, tone:'violet', status:'Prototype', tag:'memU concept', action:'Explore module' },
  { id:'agents', name:'Agent Workbench', desc:'Organize tool-enabled assistants and reusable task workflows in one place.', group:'AI workspace', icon:Zap, tone:'orange', status:'Prototype', tag:'OpenJarvis concept', action:'Explore module' },
  { id:'knowledge', name:'Knowledge Hub', desc:'Collect notes, organize research, and connect ideas into a personal knowledge base.', group:'Knowledge', icon:BookOpen, tone:'blue', status:'Prototype', tag:'Trilium concept', action:'Explore module' },
  { id:'research', name:'Research Desk', desc:'Keep research tasks, sources, and findings organized in a single workspace.', group:'Knowledge', icon:Compass, tone:'teal', status:'Planned', tag:'Research', action:'View roadmap' },
  { id:'video', name:'Video & Avatars', desc:'A future home for portrait animation, digital humans, and creative media workflows.', group:'Creative studio', icon:Video, tone:'pink', status:'Planned', tag:'PersonaLive concept', action:'View roadmap' },
  { id:'voice', name:'Voice Studio', desc:'A workspace for voice experiments, audio assets, and speech workflow integrations.', group:'Creative studio', icon:AudioWaveform, tone:'orange', status:'Planned', tag:'Media tools', action:'View roadmap' },
  { id:'portfolio', name:'Portfolio Builder', desc:'Create a polished personal site with project cards, biography, and contact details.', group:'Creative studio', icon:Monitor, tone:'blue', status:'Planned', tag:'Website tools', action:'View roadmap' },
  { id:'testing', name:'Test Bench', desc:'Prepare and run JavaScript test suites as a dedicated developer workflow.', group:'Developer lab', icon:FlaskConical, tone:'lime', status:'Integration planned', tag:'Mocha integration', action:'View integration' },
  { id:'terminal', name:'Developer Console', desc:'A home for diagnostics, project utilities, logs, and future developer integrations.', group:'Developer lab', icon:Terminal, tone:'teal', status:'Planned', tag:'Developer tools', action:'View roadmap' },
  { id:'osint', name:'OSINT Research', desc:'Organize authorized open-source research with source notes and review checkpoints.', group:'Security lab', icon:Search, tone:'violet', status:'Planned', tag:'OpenOSINT · Sherlock · GHunt', action:'View safeguards' },
  { id:'password', name:'Password Audit', desc:'Plan defensive password-strength reviews and approved security assessments.', group:'Security lab', icon:LockKeyhole, tone:'orange', status:'Planned', tag:'CUPP concept', action:'View safeguards' },
  { id:'network', name:'Network Privacy', desc:'A future space for privacy checks, network diagnostics, and configuration notes.', group:'Security lab', icon:ShieldCheck, tone:'blue', status:'Planned', tag:'IPGhost review', action:'View integration' },
  { id:'system', name:'System Monitor', desc:'Bring service health, integration status, and runtime diagnostics together.', group:'System tools', icon:Gauge, tone:'teal', status:'Planned', tag:'System health', action:'View roadmap' },
  { id:'documents', name:'Document Desk', desc:'A home for project briefs, reports, exports, and reusable templates.', group:'Knowledge', icon:FileText, tone:'pink', status:'Planned', tag:'Productivity', action:'View roadmap' },
  { id:'rag', name:'RAG Knowledge Engine', desc:'Ground AI answers in indexed documents with retrieval, citations, and source-aware context.', group:'RAG studio', icon:Database, tone:'blue', status:'Integration planned', tag:'RAGFlow · LlamaIndex · Haystack', action:'View integration' },
  { id:'ingestion', name:'Data Ingestion Pipeline', desc:'Prepare documents, web pages, and structured sources for search and retrieval workflows.', group:'RAG studio', icon:FileText, tone:'teal', status:'Planned', tag:'Document parsing', action:'View roadmap' },
  { id:'workflow', name:'Workflow Automation', desc:'Design trigger-action flows that connect APIs, apps, AI agents, and scheduled jobs.', group:'Automation hub', icon:Workflow, tone:'lime', status:'Integration planned', tag:'n8n · Activepieces', action:'View integration' },
  { id:'webcrawl', name:'Web Research & Crawl', desc:'Collect and normalize public web content for research and approved knowledge pipelines.', group:'Automation hub', icon:Globe, tone:'violet', status:'Planned', tag:'Crawling adapters', action:'View safeguards' },
  { id:'orchestration', name:'Task Orchestration', desc:'Coordinate background tasks, retries, execution status, and run history across tools.', group:'Automation hub', icon:GitBranch, tone:'orange', status:'Planned', tag:'Worker orchestration', action:'View roadmap' },
];
const statusTone = s => s === 'Ready' ? 'ready' : s === 'Prototype' ? 'prototype' : 'planned';

function App() {
  const [activeGroup, setActiveGroup] = useState('All tools');
  const [query, setQuery] = useState('');
  const [activeTool, setActiveTool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [view, setView] = useState('tools');

  const filtered = useMemo(() => tools.filter(t =>
    (activeGroup === 'All tools' || t.group === activeGroup) &&
    (t.name + ' ' + t.desc + ' ' + t.group + ' ' + t.tag).toLowerCase().includes(query.toLowerCase())
  ), [activeGroup, query]);
  const readyCount = tools.filter(t => t.status === 'Ready').length;

  function launch(tool) {
    setActiveTool(tool);
    setToast(tool.status === 'Ready' ? 'Workspace opened' : 'Module details opened');
    window.setTimeout(() => setToast(''), 2400);
  }

  return <div className="app-shell">
    <aside className={'sidebar ' + (sidebarOpen ? 'sidebar-open' : '')}>
      <div className="brand">
        <div className="brand-mark"><Command size={21} strokeWidth={2.5}/></div>
        <div><div className="brand-name">alltools<span>.ai</span></div><div className="brand-sub">YOUR UNIFIED WORKSPACE</div></div>
        <button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button>
      </div>
      <button className="workspace-switch"><div className="workspace-avatar">A</div><div className="workspace-copy"><strong>Personal workspace</strong><span>Free workspace</span></div><ChevronDown size={15}/></button>
      <div className="side-label">WORKSPACE</div>
      <nav className="nav-list">
        <button className={'nav-item ' + (view === 'overview' ? 'active' : '')} onClick={() => {setView('overview');setActiveGroup('All tools');setSidebarOpen(false)}}><LayoutDashboard size={17}/>Overview</button>
        <button className={'nav-item ' + (view === 'tools' ? 'active' : '')} onClick={() => {setView('tools');setSidebarOpen(false)}}><Grid2X2 size={17}/>Tool library <span className="nav-count">{tools.length}</span></button>
        <button className={'nav-item ' + (view === 'history' ? 'active' : '')} onClick={() => {setView('history');setSidebarOpen(false)}}><History size={17}/>Activity history</button>
      </nav>
      <div className="side-label side-label-spaced">TOOL CATEGORIES</div>
      <nav className="nav-list category-list">
        {groups.map(g => <button key={g.name} className={'nav-item ' + (activeGroup === g.name && view === 'tools' ? 'active' : '')} onClick={() => {setActiveGroup(g.name);setView('tools');setSidebarOpen(false)}}><g.icon size={17}/>{g.name}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={16}/></div><strong>Your tools, connected.</strong><p>Connect providers as the workspace grows. Keep your workflow in one place.</p><button onClick={() => setToast('Integration settings are on the roadmap')}>Explore integrations <ArrowRight size={14}/></button></div>
        <button className="nav-item settings-link" onClick={() => setToast('Settings module is coming soon')}><Settings2 size={17}/>Settings</button>
        <div className="profile-row"><div className="profile-avatar">C</div><div className="profile-copy"><strong>Calvin's workspace</strong><span>Workspace owner</span></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>

    {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}/>}
    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumb"><button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19}/></button><span>Workspace</span><span className="crumb-slash">/</span><strong>{view === 'overview' ? 'Overview' : view === 'history' ? 'Activity history' : activeGroup}</strong></div>
        <div className="top-actions"><div className="system-status"><span className="status-dot"/>Workspace online</div><button className="icon-button help-button" onClick={() => setToast('Help centre is coming soon')} aria-label="Help"><CircleHelp size={18}/></button><div className="top-avatar">C</div></div>
      </header>

      <div className="content">
        {view === 'history' ? <section className="empty-state"><div className="empty-icon"><History size={25}/></div><p className="eyebrow">WORKSPACE ACTIVITY</p><h1>Your activity, in one place.</h1><p>Activity history will appear here as tools become connected and begin recording real runs.</p><button className="primary-button" onClick={() => setView('tools')}>Browse tools <ArrowRight size={16}/></button></section> :
        view === 'overview' ? <>
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>YOUR COMMAND CENTRE</div><h1>Good work starts <span>here.</span></h1><p>One workspace for the tools you use to think, create, build, and explore.</p></div><button className="secondary-button" onClick={() => {setView('tools');setActiveGroup('All tools')}}><Grid2X2 size={16}/> Browse all tools</button></div>
          <section className="welcome-banner"><div className="banner-orb orb-one"/><div className="banner-orb orb-two"/><div className="banner-content"><div className="banner-label"><Sparkles size={14}/> ALL YOUR WORKFLOWS, CONNECTED</div><h2>Less switching.<br/><span>More momentum.</span></h2><p>Your toolset is taking shape. Start with the core workspace and expand as integrations come online.</p><button className="banner-button" onClick={() => launch(tools[0])}>Open AI Assistant <ArrowRight size={16}/></button></div><div className="banner-graphic"><div className="graphic-ring ring-a"/><div className="graphic-ring ring-b"/><div className="graphic-center"><Command size={32}/></div><div className="float-chip chip-a"><Bot size={16}/></div><div className="float-chip chip-b"><BookOpen size={16}/></div><div className="float-chip chip-c"><Terminal size={16}/></div><div className="float-chip chip-d"><WandSparkles size={16}/></div></div></section>
          <div className="section-heading"><div><h2>Workspace at a glance</h2><p>A clear view of what's available and what's next.</p></div></div>
          <div className="stats-grid"><div className="stat-card"><div className="stat-top"><span>Tool modules</span><div className="stat-icon lime"><Grid2X2 size={17}/></div></div><div className="stat-number">{tools.length}<span>modules</span></div><div className="stat-foot"><span className="mini-line"><i/></span> Across {groups.length - 1} categories</div></div><div className="stat-card"><div className="stat-top"><span>Ready to use</span><div className="stat-icon green"><Check size={17}/></div></div><div className="stat-number">{readyCount}<span>module</span></div><div className="stat-foot">Core workspace available now</div></div><div className="stat-card"><div className="stat-top"><span>Integration roadmap</span><div className="stat-icon violet"><Activity size={17}/></div></div><div className="stat-number">{tools.length-readyCount}<span>modules</span></div><div className="stat-foot">Build out features in stages</div></div></div>
          <div className="section-heading tools-heading"><div><h2>Jump back in</h2><p>Start with a workspace or explore the upcoming modules.</p></div><button className="text-button" onClick={() => setView('tools')}>View all tools <ArrowRight size={15}/></button></div>
          <div className="tool-grid">{tools.slice(0,4).map(t => <ToolCard key={t.id} tool={t} onLaunch={launch}/>)}</div>
        </> : <>
          <div className="page-heading library-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>THE TOOL LIBRARY</div><h1>Everything in <span>your orbit.</span></h1><p>One home for AI, knowledge, creativity, development, and security.</p></div><div className="library-count"><strong>{filtered.length.toString().padStart(2,'0')}</strong><span>MODULES SHOWN</span></div></div>
          <div className="library-toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tools, tasks, categories..." aria-label="Search tools"/><kbd>⌘ K</kbd></div><button className="filter-button" onClick={() => {setActiveGroup('All tools');setQuery('')}}><Settings2 size={16}/> Reset filters</button></div>
          <div className="filter-pills">{['All tools',...groups.slice(1).map(g=>g.name)].map(g=><button key={g} className={'filter-pill '+(activeGroup===g?'selected':'')} onClick={()=>setActiveGroup(g)}>{g}</button>)}</div>
          <div className="results-line"><span>{activeGroup === 'All tools' ? 'All modules' : activeGroup}</span><span>{filtered.length} results</span></div>
          {filtered.length ? <div className="tool-grid library-grid">{filtered.map(t=><ToolCard key={t.id} tool={t} onLaunch={launch}/>)}</div> : <div className="no-results"><Search size={24}/><h3>No matching tools</h3><p>Try another search term or clear the category filter.</p><button className="secondary-button" onClick={()=>{setQuery('');setActiveGroup('All tools')}}>Clear filters</button></div>}
        </>}
        <footer className="footer"><span>© 2026 AllTools AI</span><span><span className="footer-dot"/> Built to grow with your workflow</span><a href="https://github.com/leephil1907-lab/alltools-ai" target="_blank" rel="noreferrer"><Github size={14}/> Repository <ExternalLink size={12}/></a></footer>
      </div>
    </main>
    {activeTool && <div className="modal-backdrop" onClick={()=>setActiveTool(null)}><section className="tool-modal" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" onClick={()=>setActiveTool(null)} aria-label="Close"><X size={18}/></button><div className={'tool-icon large '+activeTool.tone}><activeTool.icon size={25}/></div><span className={'status-badge '+statusTone(activeTool.status)}>{activeTool.status}</span><h2>{activeTool.name}</h2><p>{activeTool.desc}</p>{activeTool.status==='Ready'?<div className="modal-ready"><div className="ready-indicator"><span className="status-dot"/> Available in this prototype</div><p>The unified workspace shell is active. Provider-backed AI execution and saved history still need to be configured.</p><button className="primary-button" onClick={()=>{setActiveTool(null);setToast('AI provider connection is not configured yet')}}>Continue <ArrowRight size={16}/></button></div>:<div className="modal-roadmap"><div className="roadmap-row"><span className="roadmap-check"><Check size={13}/></span><div><strong>Workspace module defined</strong><small>Included in the unified navigation</small></div></div><div className="roadmap-row"><span className="roadmap-pending"/><div><strong>Implementation and integration</strong><small>Requires code, dependency, and license review</small></div></div><button className="secondary-button full-button" onClick={()=>{setActiveTool(null);setToast('Roadmap request noted for this session')}}>Add to my focus list <ArrowUpRight size={15}/></button></div>}</section></div>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}

function ToolCard({tool,onLaunch}) {
  return <article className="tool-card"><div className="tool-card-top"><div className={'tool-icon '+tool.tone}><tool.icon size={20}/></div><span className={'status-badge '+statusTone(tool.status)}><i/>{tool.status}</span></div><div className="tool-card-copy"><div className="tool-title-row"><h3>{tool.name}</h3><button className="card-arrow" onClick={()=>onLaunch(tool)} aria-label={'Open '+tool.name}><ArrowUpRight size={17}/></button></div><p>{tool.desc}</p></div><div className="tool-card-bottom"><span className="tool-tag">{tool.tag}</span><button className="launch-link" onClick={()=>onLaunch(tool)}>{tool.status==='Ready'?'Open tool':tool.status==='Planned'?'Explore': 'View details'} <ArrowRight size={14}/></button></div></article>;
}
export default App;