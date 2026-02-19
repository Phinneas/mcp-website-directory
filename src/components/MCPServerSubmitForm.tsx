import React, { useState } from 'react';
import {
  submitServer,
  validateSubmission,
  SUBMISSION_CATEGORIES,
  SUBMISSION_LANGUAGES,
  SubmissionInput
} from '../data/serverSubmissions.js';

interface MCPServerSubmitFormProps {
  onSubmit?: () => void;
}

export default function MCPServerSubmitForm({ onSubmit }: MCPServerSubmitFormProps) {
  const [formData, setFormData] = useState<SubmissionInput>({
    name: '',
    description: '',
    category: 'other',
    language: 'TypeScript',
    author: '',
    email: '',
    githubUrl: '',
    npmPackage: '',
    homepageUrl: '',
    documentationUrl: '',
    transport: 'stdio',
    hasDocker: false,
    dockerImage: '',
    requiredEnvVars: [],
    tags: [],
    notes: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [envVarInput, setEnvVarInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addEnvVar = () => {
    if (envVarInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredEnvVars: [...(prev.requiredEnvVars || []), envVarInput.trim()]
      }));
      setEnvVarInput('');
    }
  };

  const removeEnvVar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredEnvVars: prev.requiredEnvVars?.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    // Validate
    const validation = validateSubmission(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      submitServer(formData);
      setSubmitted(true);
      onSubmit?.();
      
      // Reset form after delay
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: '',
          description: '',
          category: 'other',
          language: 'TypeScript',
          author: '',
          email: '',
          githubUrl: '',
          npmPackage: '',
          homepageUrl: '',
          documentationUrl: '',
          transport: 'stdio',
          hasDocker: false,
          dockerImage: '',
          requiredEnvVars: [],
          tags: [],
          notes: ''
        });
      }, 5000);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to submit server']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="submit-form success">
        <div className="success-icon">✓</div>
        <h3>Server Submitted!</h3>
        <p>Thank you for contributing to the MCP Directory.</p>
        <p className="review-note">Your submission will be reviewed and added to the directory soon.</p>
      </div>
    );
  }

  return (
    <form className="mcp-submit-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>Submit Your MCP Server</h3>
        <p>Share your MCP server with the community</p>
      </div>

      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((error, i) => (
            <div key={i} className="error-item">
              <span>⚠️</span> {error}
            </div>
          ))}
        </div>
      )}

      {/* Basic Information */}
      <fieldset className="form-section">
        <legend>Basic Information</legend>

        <div className="form-group">
          <label htmlFor="name">Server Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="My Awesome MCP Server"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what your server does and what problems it solves..."
            rows={4}
            required
          />
          <small>Minimum 20 characters ({formData.description.length} characters)</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {SUBMISSION_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language *</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              required
            >
              {SUBMISSION_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* URLs */}
      <fieldset className="form-section">
        <legend>Links & URLs</legend>

        <div className="form-group">
          <label htmlFor="githubUrl">GitHub Repository URL *</label>
          <input
            type="url"
            id="githubUrl"
            name="githubUrl"
            value={formData.githubUrl}
            onChange={handleChange}
            placeholder="https://github.com/username/my-mcp-server"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="npmPackage">npm Package Name</label>
          <input
            type="text"
            id="npmPackage"
            name="npmPackage"
            value={formData.npmPackage}
            onChange={handleChange}
            placeholder="@scope/package-name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="homepageUrl">Homepage URL</label>
            <input
              type="url"
              id="homepageUrl"
              name="homepageUrl"
              value={formData.homepageUrl}
              onChange={handleChange}
              placeholder="https://my-server.dev"
            />
          </div>

          <div className="form-group">
            <label htmlFor="documentationUrl">Documentation URL</label>
            <input
              type="url"
              id="documentationUrl"
              name="documentationUrl"
              value={formData.documentationUrl}
              onChange={handleChange}
              placeholder="https://docs.my-server.dev"
            />
          </div>
        </div>
      </fieldset>

      {/* Technical Details */}
      <fieldset className="form-section">
        <legend>Technical Details</legend>

        <div className="form-group">
          <label htmlFor="transport">Transport Type</label>
          <select
            id="transport"
            name="transport"
            value={formData.transport}
            onChange={handleChange}
          >
            <option value="stdio">STDIO (Standard Input/Output)</option>
            <option value="sse">SSE (Server-Sent Events)</option>
            <option value="both">Both Supported</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="hasDocker"
              checked={formData.hasDocker}
              onChange={handleChange}
            />
            Has Docker Image
          </label>
        </div>

        {formData.hasDocker && (
          <div className="form-group">
            <label htmlFor="dockerImage">Docker Image</label>
            <input
              type="text"
              id="dockerImage"
              name="dockerImage"
              value={formData.dockerImage}
              onChange={handleChange}
              placeholder="username/my-mcp-server:latest"
            />
          </div>
        )}

        <div className="form-group">
          <label>Required Environment Variables</label>
          <div className="tag-input-group">
            <input
              type="text"
              value={envVarInput}
              onChange={(e) => setEnvVarInput(e.target.value)}
              placeholder="API_KEY"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEnvVar())}
            />
            <button type="button" onClick={addEnvVar} className="add-btn">Add</button>
          </div>
          {formData.requiredEnvVars && formData.requiredEnvVars.length > 0 && (
            <div className="tags-list">
              {formData.requiredEnvVars.map((env, i) => (
                <span key={i} className="tag">
                  {env}
                  <button type="button" onClick={() => removeEnvVar(i)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-input-group">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="api, tools, automation"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="add-btn">Add</button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="tags-list">
              {formData.tags.map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                  <button type="button" onClick={() => removeTag(i)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      {/* Author Information */}
      <fieldset className="form-section">
        <legend>Author Information</legend>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="author">Your Name / Username *</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="@username or Your Name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (Optional)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            <small>Only used for submission updates, not displayed publicly</small>
          </div>
        </div>
      </fieldset>

      {/* Additional Notes */}
      <div className="form-group">
        <label htmlFor="notes">Additional Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional information about your server..."
          rows={3}
        />
      </div>

      <button type="submit" className="submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Server'}
      </button>

      <p className="submission-note">
        Submissions are reviewed before being added to the directory.
        By submitting, you agree that your server information will be publicly displayed.
      </p>
    </form>
  );
}

// Styles
const styles = `
.mcp-submit-form {
  background: linear-gradient(135deg, hsl(220, 40%, 12%) 0%, hsl(215, 30%, 18%) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  font-family: 'Inter', -apple-system, sans-serif;
  color: white;
  max-width: 800px;
}

.form-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.form-header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
}

.form-errors {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f87171;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
}

.error-item:last-child {
  margin-bottom: 0;
}

.form-section {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-section legend {
  font-weight: 600;
  font-size: 1rem;
  padding: 0 0.5rem;
  color: hsl(var(--primary));
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group select option {
  background: #1e293b;
  color: white;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: hsl(var(--primary));
}

.form-group small {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.tag-input-group {
  display: flex;
  gap: 0.5rem;
}

.tag-input-group input {
  flex: 1;
}

.add-btn {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-size: 0.85rem;
}

.tag button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.tag button:hover {
  color: #ef4444;
}

.submit-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  background: hsl(var(--primary));
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: hsl(var(--primary), 0.9);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.submission-note {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.submit-form.success {
  text-align: center;
  padding: 3rem 2rem;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #22c55e;
}

.submit-form.success h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
}

.submit-form.success p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem 0;
}

.review-note {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 640px) {
  .mcp-submit-form {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
