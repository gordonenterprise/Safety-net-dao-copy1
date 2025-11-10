'use client'

import { useState } from 'react'
import { format, addDays, addHours } from 'date-fns'
import { Plus, Clock, Users, Target, Tag, ExternalLink } from 'lucide-react'

interface CreateProposalProps {
  onSubmit: (data: any) => Promise<void>
  userVotingPower: {
    totalPower: string
    eligibleToVote: boolean
  }
  canCreate: boolean
  minimumPowerNeeded?: string
}

export default function CreateProposal({
  onSubmit,
  userVotingPower,
  canCreate,
  minimumPowerNeeded
}: CreateProposalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GOVERNANCE',
    discussionUrl: '',
    tags: [] as string[],
    startTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
    quorumRequired: 30,
    votingThreshold: 50,
    executable: false
  })
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCreate) return

    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime)
      })
      setIsOpen(false)
      setFormData({
        title: '',
        description: '',
        category: 'GOVERNANCE',
        discussionUrl: '',
        tags: [],
        startTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
        quorumRequired: 30,
        votingThreshold: 50,
        executable: false
      })
    } catch (error) {
      console.error('Failed to create proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'TREASURY':
        return 'Managing DAO funds, payments, and financial decisions'
      case 'GOVERNANCE':
        return 'Changes to voting rules, membership, and DAO structure'
      case 'MEMBERSHIP':
        return 'Membership requirements, benefits, and access controls'
      case 'CLAIMS':
        return 'Claims process, approval criteria, and payment rules'
      case 'TECHNICAL':
        return 'Platform updates, security improvements, and integrations'
      default:
        return ''
    }
  }

  if (!canCreate) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-medium text-yellow-800">Insufficient Voting Power</h3>
            <p className="text-sm text-yellow-700">
              You need at least {minimumPowerNeeded ? Number(minimumPowerNeeded).toLocaleString() : '10,000'} voting power to create proposals.
              Current power: {Number(userVotingPower.totalPower).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Proposal
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Create New Proposal</h2>
              <p className="text-sm text-gray-600 mt-1">
                Submit a proposal for the DAO to vote on
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief, descriptive title for your proposal"
                  required
                  minLength={10}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="GOVERNANCE">⚖️ Governance</option>
                  <option value="TREASURY">💰 Treasury</option>
                  <option value="MEMBERSHIP">👥 Membership</option>
                  <option value="CLAIMS">📋 Claims</option>
                  <option value="TECHNICAL">⚙️ Technical</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getCategoryDescription(formData.category)}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Detailed explanation of your proposal, including rationale, implementation details, and expected outcomes..."
                  required
                  minLength={50}
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/5000 characters
                </p>
              </div>

              {/* Discussion URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discussion Link
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.discussionUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, discussionUrl: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://forum.safetydao.org/proposal/123"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Link to forum discussion or detailed documentation
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                  <span className="text-gray-400 font-normal ml-1">(optional, max 5)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {formData.tags.length < 5 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a tag..."
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Voting Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Quorum Required (%)
                  </label>
                  <input
                    type="number"
                    value={formData.quorumRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, quorumRequired: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={10}
                    max={90}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum participation needed for validity
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline w-4 h-4 mr-1" />
                    Approval Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={formData.votingThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, votingThreshold: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={50}
                    max={90}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of FOR votes needed to pass
                  </p>
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Voting Starts
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Voting Ends
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={formData.startTime}
                    required
                  />
                </div>
              </div>

              {/* Executable */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="executable"
                  checked={formData.executable}
                  onChange={(e) => setFormData(prev => ({ ...prev, executable: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="executable" className="text-sm text-gray-700">
                  This proposal requires on-chain execution
                </label>
              </div>
              {formData.executable && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Executable proposals require admin intervention after approval
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}