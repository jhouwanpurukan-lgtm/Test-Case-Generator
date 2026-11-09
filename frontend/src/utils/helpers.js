export function priorityBadge(priority) {
  switch (priority?.toLowerCase()) {
    case 'high': return 'badge-high';
    case 'medium': return 'badge-medium';
    case 'low': return 'badge-low';
    default: return 'badge-medium';
  }
}

export function testTypeBadge(type) {
  switch (type?.toLowerCase()) {
    case 'positive': return 'badge-positive';
    case 'negative': return 'badge-negative';
    case 'boundary': return 'badge-boundary';
    case 'edge case': return 'badge-edge';
    case 'functional': return 'badge-functional';
    case 'validation': return 'badge-validation';
    default: return 'badge-functional';
  }
}

export function statusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'passed': return 'status-passed';
    case 'failed': return 'status-failed';
    case 'blocked': return 'status-blocked';
    default: return 'status-not-executed';
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function truncate(str, max = 80) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}
