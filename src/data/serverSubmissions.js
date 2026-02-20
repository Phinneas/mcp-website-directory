/**
 * MCP Server Submissions System
 * Allows visitors to submit their MCP servers to the directory
 * 
 * @typedef {Object} MCPServerSubmission
 * @property {string} id
 * @property {'pending' | 'approved' | 'rejected'} status
 * @property {number} submittedAt
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {string} language
 * @property {string} author
 * @property {string} [email]
 * @property {string} githubUrl
 * @property {string} [npmPackage]
 * @property {string} [homepageUrl]
 * @property {string} [documentationUrl]
 * @property {'stdio' | 'sse' | 'both'} transport
 * @property {boolean} hasDocker
 * @property {string} [dockerImage]
 * @property {string[]} [requiredEnvVars]
 * @property {string[]} [tags]
 * @property {string} [notes]
 * @property {number} [reviewedAt]
 * @property {string} [reviewedBy]
 * @property {string} [reviewNotes]
 * 
 * @typedef {Object} SubmissionInput
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {string} language
 * @property {string} author
 * @property {string} [email]
 * @property {string} githubUrl
 * @property {string} [npmPackage]
 * @property {string} [homepageUrl]
 * @property {string} [documentationUrl]
 * @property {'stdio' | 'sse' | 'both'} transport
 * @property {boolean} hasDocker
 * @property {string} [dockerImage]
 * @property {string[]} [requiredEnvVars]
 * @property {string[]} [tags]
 * @property {string} [notes]
 */

const STORAGE_KEY = 'mcp_server_submissions';
const MAX_SUBMISSIONS = 200;

// Category options for submissions
export const SUBMISSION_CATEGORIES = [
  { value: 'development', label: 'Development', icon: '💻' },
  { value: 'database', label: 'Database', icon: '🗄️' },
  { value: 'cloud', label: 'Cloud Services', icon: '☁️' },
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'ai-tools', label: 'AI & Machine Learning', icon: '🤖' },
  { value: 'browser-automation', label: 'Browser Automation', icon: '🌐' },
  { value: 'file-systems', label: 'File Systems', icon: '📁' },
  { value: 'search', label: 'Search', icon: '🔍' },
  { value: 'productivity', label: 'Productivity', icon: '⚡' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'aggregators', label: 'Aggregators', icon: '📦' },
  { value: 'other', label: 'Other', icon: '📝' }
];

// Language options
export const SUBMISSION_LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C#',
  'Ruby',
  'PHP',
  'Other'
];

/**
 * Generate unique submission ID
 */
function generateSubmissionId() {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all submissions from storage
 */
export function getAllSubmissions() {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const submissions = JSON.parse(stored);
    return Array.isArray(submissions) ? submissions : [];
  } catch (error) {
    console.error('Failed to load submissions:', error);
    return [];
  }
}

/**
 * Save submissions to storage
 */
function saveSubmissions(submissions) {
  if (typeof window === 'undefined') return;
  
  const trimmed = submissions.slice(-MAX_SUBMISSIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Submit a new MCP server
 */
export function submitServer(input) {
  const submissions = getAllSubmissions();
  
  // Check for duplicate GitHub URL
  const existingSubmission = submissions.find(
    s => s.githubUrl.toLowerCase() === input.githubUrl.toLowerCase()
  );
  
  if (existingSubmission) {
    throw new Error('A server with this GitHub URL has already been submitted');
  }
  
  const submission = {
    id: generateSubmissionId(),
    status: 'pending',
    submittedAt: Date.now(),
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
    language: input.language,
    author: input.author.trim(),
    email: input.email?.trim(),
    githubUrl: input.githubUrl.trim(),
    npmPackage: input.npmPackage?.trim(),
    homepageUrl: input.homepageUrl?.trim(),
    documentationUrl: input.documentationUrl?.trim(),
    transport: input.transport,
    hasDocker: input.hasDocker,
    dockerImage: input.dockerImage?.trim(),
    requiredEnvVars: input.requiredEnvVars,
    tags: input.tags,
    notes: input.notes?.trim()
  };
  
  submissions.push(submission);
  saveSubmissions(submissions);
  
  return submission;
}

/**
 * Get submissions by status
 */
export function getSubmissionsByStatus(status) {
  return getAllSubmissions().filter(s => s.status === status);
}

/**
 * Get pending submissions
 */
export function getPendingSubmissions() {
  return getSubmissionsByStatus('pending');
}

/**
 * Get approved submissions
 */
export function getApprovedSubmissions() {
  return getSubmissionsByStatus('approved');
}

/**
 * Get submission by ID
 */
export function getSubmissionById(id) {
  return getAllSubmissions().find(s => s.id === id) || null;
}

/**
 * Approve a submission
 */
export function approveSubmission(id, reviewedBy, notes) {
  const submissions = getAllSubmissions();
  const submission = submissions.find(s => s.id === id);
  
  if (submission) {
    submission.status = 'approved';
    submission.reviewedAt = Date.now();
    submission.reviewedBy = reviewedBy;
    submission.reviewNotes = notes;
    saveSubmissions(submissions);
    return submission;
  }
  
  return null;
}

/**
 * Reject a submission
 */
export function rejectSubmission(id, reviewedBy, reason) {
  const submissions = getAllSubmissions();
  const submission = submissions.find(s => s.id === id);
  
  if (submission) {
    submission.status = 'rejected';
    submission.reviewedAt = Date.now();
    submission.reviewedBy = reviewedBy;
    submission.reviewNotes = reason;
    saveSubmissions(submissions);
    return submission;
  }
  
  return null;
}

/**
 * Delete a submission
 */
export function deleteSubmission(id) {
  const submissions = getAllSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  
  if (index >= 0) {
    submissions.splice(index, 1);
    saveSubmissions(submissions);
    return true;
  }
  
  return false;
}

/**
 * Update a submission
 */
export function updateSubmission(id, updates) {
  const submissions = getAllSubmissions();
  const submission = submissions.find(s => s.id === id);
  
  if (submission) {
    Object.assign(submission, updates);
    saveSubmissions(submissions);
    return submission;
  }
  
  return null;
}

/**
 * Get submission statistics
 */
export function getSubmissionStats() {
  const submissions = getAllSubmissions();
  
  return {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    byCategory: submissions.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {}),
    byLanguage: submissions.reduce((acc, s) => {
      acc[s.language] = (acc[s.language] || 0) + 1;
      return acc;
    }, {})
  };
}

/**
 * Export submissions as JSON
 */
export function exportSubmissions() {
  return JSON.stringify(getAllSubmissions(), null, 2);
}

/**
 * Import submissions from JSON
 */
export function importSubmissions(json) {
  try {
    const imported = JSON.parse(json);
    if (!Array.isArray(imported)) throw new Error('Invalid format');
    
    const existing = getAllSubmissions();
    const existingIds = new Set(existing.map(s => s.id));
    
    const newSubmissions = imported.filter(s => 
      !existingIds.has(s.id) && 
      s.name && s.githubUrl
    );
    
    const merged = [...existing, ...newSubmissions];
    saveSubmissions(merged);
    
    return newSubmissions.length;
  } catch (error) {
    console.error('Failed to import submissions:', error);
    return 0;
  }
}

/**
 * Clear all submissions (admin function)
 */
export function clearAllSubmissions() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Convert approved submission to server format
 */
export function submissionToServerFormat(submission) {
  return {
    id: submission.id,
    fields: {
      name: submission.name,
      description: submission.description,
      category: submission.category,
      language: submission.language,
      author: submission.author,
      github_url: submission.githubUrl,
      npm_package: submission.npmPackage,
      homepage_url: submission.homepageUrl,
      documentation_url: submission.documentationUrl,
      transport: submission.transport,
      has_docker: submission.hasDocker,
      docker_image: submission.dockerImage,
      required_env_vars: submission.requiredEnvVars,
      tags: submission.tags,
      status: 'community', // Mark as community-submitted
      submitted_by: submission.author,
      submitted_at: new Date(submission.submittedAt).toISOString()
    }
  };
}

/**
 * Validate GitHub URL format
 */
export function validateGitHubUrl(url) {
  if (!url) {
    return { valid: false, error: 'GitHub URL is required' };
  }
  
  const pattern = /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
  if (!pattern.test(url)) {
    return { valid: false, error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo' };
  }
  
  return { valid: true };
}

/**
 * Validate submission input
 */
export function validateSubmission(input) {
  const errors = [];
  
  if (!input.name?.trim()) {
    errors.push('Server name is required');
  }
  
  if (!input.description?.trim()) {
    errors.push('Description is required');
  } else if (input.description.length < 20) {
    errors.push('Description must be at least 20 characters');
  }
  
  if (!input.category) {
    errors.push('Category is required');
  }
  
  if (!input.language) {
    errors.push('Language is required');
  }
  
  if (!input.author?.trim()) {
    errors.push('Author name is required');
  }
  
  const githubValidation = validateGitHubUrl(input.githubUrl);
  if (!githubValidation.valid) {
    errors.push(githubValidation.error);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
