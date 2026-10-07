import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { IncidentsView } from './components/incidents/IncidentsView';
import { IncidentDetailView } from './components/incident_detail/IncidentDetailView';
import { AlertsView } from './components/alerts/AlertsView';
import { AttackChainsView } from './components/attack_chains/AttackChainsView';
import { CampaignsView } from './components/campaigns/CampaignsView';
import { MitreView } from './components/mitre/MitreView';
import { AssetsView } from './components/assets/AssetsView';
import { PipelineView } from './components/pipeline/PipelineView';
import { BenchmarksView } from './components/benchmarks/BenchmarksView';
import { AuditView } from './components/audit/AuditView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { SimulationModal } from './components/common/SimulationModal';
import { DatasetManagerModal } from './components/datasets/DatasetManagerModal';
import { api } from './services/api';
import { DashboardKPIs, Incident } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardKPIs | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentRole, setCurrentRole] = useState('Tier-1 Analyst');

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);

  const refreshAllData = async () => {
    try {
      const [dash, incs] = await Promise.all([
        api.getDashboard(),
        api.getIncidents(),
      ]);
      setDashboardData(dash);
      setIncidents(incs);
    } catch (e) {
      console.error('Error fetching platform state:', e);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Hotkey handler: Ctrl+K or Cmd+K for Global Search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    setCurrentView('incidents');
  };

  const handleBackToIncidentList = () => {
    setSelectedIncidentId(null);
  };

  const handleSelectView = (view: NavView) => {
    setCurrentView(view);
    if (view !== 'incidents') {
      setSelectedIncidentId(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink font-sans">
      {/* Fixed Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        activeIncidentsCount={dashboardData?.kpis.active_incidents || incidents.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-canvas">
        <Header
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenSimulation={() => setSimulationModalOpen(true)}
          onOpenDatasets={() => setDatasetModalOpen(true)}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />

        <main className="flex-1 overflow-y-auto bg-canvas">
          {currentView === 'overview' && (
            <DashboardView
              data={dashboardData}
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onNavigateToIncidents={() => setCurrentView('incidents')}
              onOpenSimulation={() => setSimulationModalOpen(true)}
            />
          )}

          {currentView === 'incidents' && (
            <>
              {selectedIncidentId ? (
                <IncidentDetailView
                  incidentId={selectedIncidentId}
                  onBack={handleBackToIncidentList}
                  onIncidentUpdated={refreshAllData}
                  currentRole={currentRole}
                />
              ) : (
                <IncidentsView
                  incidents={incidents}
                  onSelectIncident={handleSelectIncident}
                  onRefresh={refreshAllData}
                />
              )}
            </>
          )}

          {currentView === 'alerts' && <AlertsView />}

          {currentView === 'attack_chains' && (
            <AttackChainsView
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
            />
          )}

          {currentView === 'campaigns' && (
            <CampaignsView onSelectIncident={handleSelectIncident} />
          )}

          {currentView === 'mitre' && (
            <MitreView onSelectIncident={handleSelectIncident} />
          )}

          {currentView === 'assets' && <AssetsView />}

          {currentView === 'pipeline' && <PipelineView />}

          {currentView === 'benchmarks' && <BenchmarksView />}

          {currentView === 'audit' && <AuditView />}

          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectIncident={handleSelectIncident}
      />

      <SimulationModal
        isOpen={simulationModalOpen}
        onClose={() => setSimulationModalOpen(false)}
        onSimulationCompleted={() => {
          refreshAllData();
        }}
      />

      <DatasetManagerModal
        isOpen={datasetModalOpen}
        onClose={() => setDatasetModalOpen(false)}
        onDatasetLoaded={() => {
          refreshAllData();
        }}
      />
    </div>
  );
};

export default App;
