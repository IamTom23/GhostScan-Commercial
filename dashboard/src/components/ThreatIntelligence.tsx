interface ThreatFeed {
  id: string;
  source: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  published: Date;
  affectedApps: string[];
  cve?: string;
  mitigations: string[];
}

interface SecurityAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  affectedApps: string[];
  status: string;
  assignedTo?: string;
  recommendedActions: string[];
}

interface VulnerabilityFinding {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  exploitable: boolean;
}

interface VulnerabilityScan {
  id: string;
  appId: string;
  startTime: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'QUEUED';
  riskScore: number;
  findings: VulnerabilityFinding[];
}

interface IncidentEvent {
  id: string;
  event: string;
  description: string;
  actor: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  assignedTeam: string[];
  affectedSystems: string[];
  timeline: IncidentEvent[];
}

interface Props {
  activeTab: string;
  threatFeeds: ThreatFeed[];
  securityAlerts: SecurityAlert[];
  vulnerabilityScans: VulnerabilityScan[];
  incidents: Incident[];
}

export function ThreatIntelligence({ activeTab, threatFeeds, securityAlerts, vulnerabilityScans, incidents }: Props) {
  if (activeTab === 'threat-feeds') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Live Threat Intelligence Feeds</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Real-time security intelligence from trusted sources</p>
        
        {threatFeeds.map(feed => (
          <div key={feed.id} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: `4px solid ${feed.severity === 'CRITICAL' ? '#DC2626' : '#D97706'}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>{feed.source}</strong>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {new Date(feed.published).toLocaleString()}
                </div>
              </div>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                background: feed.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: feed.severity === 'CRITICAL' ? '#DC2626' : '#D97706'
              }}>{feed.severity}</span>
            </div>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{feed.title}</h3>
            {feed.cve && (
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                display: 'inline-block',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>{feed.cve}</div>
            )}
            <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{feed.description}</p>
            
            {feed.affectedApps.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Affected Apps: </strong>
                {feed.affectedApps.map(app => (
                  <span key={app} style={{
                    background: 'var(--bg-tertiary)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '16px',
                    marginRight: '0.5rem',
                    fontSize: '0.9rem'
                  }}>{app}</span>
                ))}
              </div>
            )}
            
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Recommended Actions:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {feed.mitigations.map((action, idx) => (
                  <li key={idx} style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'security-alerts') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Security Alert Center</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Active security incidents requiring immediate attention</p>
        
        {securityAlerts.map(alert => (
          <div key={alert.id} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#DC2626' : '#D97706'}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>{alert.type.replace(/_/g, ' ')}</strong>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  background: alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: alert.severity === 'CRITICAL' ? '#DC2626' : '#D97706'
                }}>{alert.severity}</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  background: alert.status === 'NEW' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: alert.status === 'NEW' ? '#DC2626' : '#D97706'
                }}>{alert.status}</span>
              </div>
            </div>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{alert.title}</h3>
            <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{alert.description}</p>
            
            {alert.affectedApps.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Affected Apps: </strong>
                {alert.affectedApps.map(app => (
                  <span key={app} style={{
                    background: 'var(--bg-tertiary)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '16px',
                    marginRight: '0.5rem',
                    fontSize: '0.9rem'
                  }}>{app}</span>
                ))}
              </div>
            )}
            
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Recommended Actions:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {alert.recommendedActions.map((action, idx) => (
                  <li key={idx} style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{action}</li>
                ))}
              </ul>
            </div>
            
            {alert.assignedTo && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                <strong>Assigned to: </strong>{alert.assignedTo}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'vulnerability-scans') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Vulnerability Scans</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Automated security assessments of your applications</p>
        
        {vulnerabilityScans.map(scan => (
          <div key={scan.id} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>{scan.appId}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Started: {new Date(scan.startTime).toLocaleString()}
                </div>
              </div>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                background: scan.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                color: scan.status === 'COMPLETED' ? '#059669' : '#2563EB'
              }}>{scan.status}</span>
            </div>
            
            {scan.status === 'COMPLETED' && (
              <>
                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Risk Score: </strong>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: scan.riskScore > 70 ? '#DC2626' : '#D97706'
                  }}>{scan.riskScore}/100</span>
                </div>
                
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Findings:</strong>
                  {scan.findings.map((finding: VulnerabilityFinding) => (
                    <div key={finding.id} style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${finding.severity === 'HIGH' ? '#D97706' : '#059669'}`,
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{finding.title}</h4>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: finding.severity === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: finding.severity === 'HIGH' ? '#D97706' : '#059669'
                        }}>{finding.severity}</span>
                      </div>
                      <p style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{finding.description}</p>
                      {finding.exploitable && (
                        <div style={{
                          padding: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '6px',
                          color: '#DC2626',
                          fontWeight: 'bold'
                        }}>Actively exploitable</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {scan.status === 'RUNNING' && (
              <div>
                <div style={{ marginBottom: '0.5rem', background: 'var(--bg-tertiary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: 'var(--primary-color)' }}></div>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Analyzing security configuration...</div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'incidents') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Incident Response Center</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Active security incidents and coordinated response efforts</p>
        
        {incidents.map(incident => (
          <div key={incident.id} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid #D97706',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>{incident.title}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>#{incident.id}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#D97706'
                }}>{incident.severity}</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#D97706'
                }}>{incident.status}</span>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{incident.description}</p>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Response Team: </strong>
              {incident.assignedTeam.map((member: string, idx: number) => (
                <span key={idx} style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '16px',
                  marginRight: '0.5rem',
                  fontSize: '0.9rem'
                }}>{member}</span>
              ))}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Affected Systems: </strong>
              {incident.affectedSystems.map((system: string) => (
                <span key={system} style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '16px',
                  marginRight: '0.5rem',
                  fontSize: '0.9rem'
                }}>{system}</span>
              ))}
            </div>
            
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Recent Activity:</strong>
              <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)' }}>
                {incident.timeline.slice(-2).map((event: IncidentEvent) => (
                  <div key={event.id} style={{ marginBottom: '1rem', position: 'relative' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--primary-color)',
                      borderRadius: '50%',
                      position: 'absolute',
                      left: '-1.25rem',
                      top: '0.25rem'
                    }}></div>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{event.event}</strong>
                      <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{event.description}</p>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>by {event.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}