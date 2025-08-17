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
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'QUEUED' | 'SCHEDULED' | 'FIXED';
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
  onThreatAction?: (feedId: string, action: string) => void;
  onSecurityAction?: (alertId: string, action: string) => void;
  onVulnerabilityAction?: (scanId: string, action: string) => void;
}

export function ThreatIntelligence({ activeTab, threatFeeds, securityAlerts, vulnerabilityScans, incidents, onThreatAction, onSecurityAction, onVulnerabilityAction }: Props) {
  if (activeTab === 'threat-feeds') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Security Updates</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Latest security news and threats that could affect your business</p>
        <div style={{ 
          background: 'var(--bg-tertiary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '2rem',
          fontSize: '0.9rem'
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>💡 What this does:</strong> 
          <span style={{ color: 'var(--text-secondary)' }}>We monitor global security threats and let you know about ones that could impact your business apps or data. This helps you stay ahead of hackers and protect your company.</span>
        </div>
        
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
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>What you should do:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {feed.mitigations.map((action, idx) => (
                  <li key={idx} style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{action}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Action Required:</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Priority: {feed.severity}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="scan-button primary"
                  onClick={() => onThreatAction?.(feed.id, 'acknowledge')}
                >
                  ✅ Acknowledged
                </button>
                <button 
                  className="scan-button secondary"
                  onClick={() => onThreatAction?.(feed.id, 'investigate')}
                >
                  🔍 Investigate Impact
                </button>
                <button 
                  className="scan-button tertiary"
                  onClick={() => onThreatAction?.(feed.id, 'dismiss')}
                >
                  ❌ Not Applicable
                </button>
                <button 
                  className="scan-button secondary"
                  onClick={() => onThreatAction?.(feed.id, 'share')}
                >
                  📤 Share with Team
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                Taking action helps improve your security score and shows stakeholders you're managing risks proactively.
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'security-alerts') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Active Threats</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Security issues affecting your business right now</p>
        <div style={{ 
          background: 'var(--bg-tertiary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '2rem',
          fontSize: '0.9rem'
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>💡 What this does:</strong> 
          <span style={{ color: 'var(--text-secondary)' }}>These are security problems we've detected that need your immediate attention. They could affect your business data or operations, so we recommend taking action quickly.</span>
        </div>
        
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
            
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Incident Response:</strong>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  background: alert.status === 'NEW' ? 'rgba(239, 68, 68, 0.2)' : alert.status === 'INVESTIGATING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: alert.status === 'NEW' ? '#DC2626' : alert.status === 'INVESTIGATING' ? '#D97706' : '#059669'
                }}>{alert.status}</span>
              </div>
              
              {alert.status === 'NEW' && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button 
                    className="scan-button primary"
                    onClick={() => onSecurityAction?.(alert.id, 'investigate')}
                  >
                    🔍 Start Investigation
                  </button>
                  <button 
                    className="scan-button danger"
                    onClick={() => onSecurityAction?.(alert.id, 'block')}
                  >
                    🚫 Block Threat
                  </button>
                  <button 
                    className="scan-button secondary"
                    onClick={() => onSecurityAction?.(alert.id, 'assign')}
                  >
                    👤 Assign to Security Team
                  </button>
                </div>
              )}
              
              {alert.status === 'INVESTIGATING' && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button 
                    className="scan-button primary"
                    onClick={() => onSecurityAction?.(alert.id, 'resolve')}
                  >
                    ✅ Mark as Resolved
                  </button>
                  <button 
                    className="scan-button secondary"
                    onClick={() => onSecurityAction?.(alert.id, 'escalate')}
                  >
                    ⬆️ Escalate Priority
                  </button>
                  <button 
                    className="scan-button tertiary"
                    onClick={() => onSecurityAction?.(alert.id, 'update')}
                  >
                    📝 Add Update
                  </button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="scan-button tertiary"
                  onClick={() => onSecurityAction?.(alert.id, 'notify')}
                >
                  📧 Notify Stakeholders
                </button>
                <button 
                  className="scan-button tertiary"
                  onClick={() => onSecurityAction?.(alert.id, 'export')}
                >
                  📊 Export Report
                </button>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                <strong>Impact:</strong> {alert.severity === 'CRITICAL' ? 'Immediate business disruption risk' : alert.severity === 'HIGH' ? 'Significant security exposure' : 'Moderate security concern'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'vulnerability-scans') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Security Checks</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>How secure your business apps are</p>
        <div style={{ 
          background: 'var(--bg-tertiary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '2rem',
          fontSize: '0.9rem'
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>💡 What this does:</strong> 
          <span style={{ color: 'var(--text-secondary)' }}>We regularly scan your business applications to find security weaknesses that hackers could exploit. Think of it like a health check for your apps.</span>
        </div>
        
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
                  <strong style={{ color: 'var(--text-primary)' }}>Security Risk: </strong>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: scan.riskScore > 70 ? '#DC2626' : '#D97706'
                  }}>{scan.riskScore}/100</span>
                </div>
                
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Security issues found:</strong>
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
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Checking your app security...</div>
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Vulnerability Management:</strong>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  background: scan.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : scan.status === 'RUNNING' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                  color: scan.status === 'COMPLETED' ? '#059669' : scan.status === 'RUNNING' ? '#2563EB' : '#6B7280'
                }}>{scan.status}</span>
              </div>
              
              {scan.status === 'COMPLETED' && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button 
                    className="scan-button primary"
                    onClick={() => onVulnerabilityAction?.(scan.id, 'fix')}
                  >
                    🔧 Apply Fixes
                  </button>
                  <button 
                    className="scan-button secondary"
                    onClick={() => onVulnerabilityAction?.(scan.id, 'schedule')}
                  >
                    📅 Schedule Maintenance
                  </button>
                  <button 
                    className="scan-button tertiary"
                    onClick={() => onVulnerabilityAction?.(scan.id, 'ignore')}
                  >
                    ❌ Accept Risk
                  </button>
                </div>
              )}
              
              {scan.status === 'RUNNING' && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button className="scan-button secondary" disabled>⏳ Scan in Progress</button>
                  <button 
                    className="scan-button tertiary"
                    onClick={() => onVulnerabilityAction?.(scan.id, 'cancel')}
                  >
                    🛑 Cancel Scan
                  </button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="scan-button tertiary"
                  onClick={() => onVulnerabilityAction?.(scan.id, 'rescan')}
                >
                  🔄 Run New Scan
                </button>
                <button 
                  className="scan-button tertiary"
                  onClick={() => onVulnerabilityAction?.(scan.id, 'report')}
                >
                  📊 Download Report
                </button>
                <button 
                  className="scan-button tertiary"
                  onClick={() => onVulnerabilityAction?.(scan.id, 'notify')}
                >
                  📧 Notify IT Team
                </button>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                {scan.status === 'COMPLETED' && (
                  <div>
                    <strong>Risk Level:</strong> {scan.riskScore > 70 ? 'High - Immediate attention required' : scan.riskScore > 40 ? 'Medium - Schedule fixes within 30 days' : 'Low - Monitor for changes'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'incidents') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Security Issues</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Security problems we're helping you fix</p>
        <div style={{ 
          background: 'var(--bg-tertiary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '2rem',
          fontSize: '0.9rem'
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>💡 What this does:</strong> 
          <span style={{ color: 'var(--text-secondary)' }}>When we find security problems affecting your business, we track them here and coordinate with your team to fix them. This ensures nothing falls through the cracks.</span>
        </div>
        
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
              <strong>Who's fixing this: </strong>
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
              <strong>What's affected: </strong>
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
              <strong style={{ color: 'var(--text-primary)' }}>Latest updates:</strong>
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