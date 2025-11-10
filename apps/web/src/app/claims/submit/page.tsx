'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload, AlertCircle, CheckCircle, FileText, DollarSign, Calendar, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import RouteGuard from '../../../components/auth/RouteGuard'
import FeatureGuard from '../../../components/auth/FeatureGuard'

interface ClaimFormData {
  title: string
  description: string
  category: string
  requestedAmount: number
  evidenceNotes: string
  attachments: File[]
}

interface EligibilityStatus {
  isEligible: boolean
  membershipDays: number
  requiredDays: number
  membershipStatus: string
  message: string
}

export default function ClaimsSubmission() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [eligibilityStatus, setEligibilityStatus] = useState<EligibilityStatus | null>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(true)
  
  const [formData, setFormData] = useState<ClaimFormData>({
    title: '',
    description: '',
    category: '',
    requestedAmount: 0,
    evidenceNotes: '',
    attachments: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    { value: 'MEDICAL', label: 'Medical Emergency', description: 'Unexpected medical expenses not covered by insurance' },
    { value: 'VEHICLE', label: 'Vehicle Repair', description: 'Essential vehicle repairs needed for work' },
    { value: 'DEVICE', label: 'Work Equipment', description: 'Replacement of essential work tools or devices' },
    { value: 'INCOME_LOSS', label: 'Income Loss', description: 'Temporary income loss due to unexpected circumstances' },
    { value: 'EMERGENCY', label: 'Emergency Expense', description: 'Other urgent expenses affecting livelihood' }
  ]

  useEffect(() => {
    if (session?.user?.id) {
      checkEligibility()
    }
  }, [session])

  const checkEligibility = async () => {
    try {
      const response = await fetch('/api/claims/eligibility')
      if (response.ok) {
        const data = await response.json()
        setEligibilityStatus(data)
      }
    } catch (error) {
      console.error('Error checking eligibility:', error)
    } finally {
      setCheckingEligibility(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim() || formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.requestedAmount || formData.requestedAmount <= 0) {
      newErrors.requestedAmount = 'Amount must be greater than 0'
    }

    if (formData.requestedAmount > 50000) { // $500 limit
      newErrors.requestedAmount = 'Amount cannot exceed $500'
    }

    if (!formData.evidenceNotes.trim()) {
      newErrors.evidenceNotes = 'Evidence explanation is required'
    }

    if (formData.attachments.length === 0) {
      newErrors.attachments = 'At least one supporting document is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has an unsupported format. Please use JPEG, PNG, PDF, or TXT files.`)
        return false
      }
      return true
    })

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('category', formData.category)
      submitData.append('requestedAmount', (formData.requestedAmount * 100).toString()) // Convert to cents
      submitData.append('evidenceNotes', formData.evidenceNotes)

      formData.attachments.forEach((file, index) => {
        submitData.append(`attachment_${index}`, file)
      })

      const response = await fetch('/api/claims/submit', {
        method: 'POST',
        body: submitData
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/claims/${result.claimId}`)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to submit claim')
      }
    } catch (error) {
      console.error('Error submitting claim:', error)
      alert('Failed to submit claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingEligibility) {
    return (
      <RouteGuard requiredRole="MEMBER">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking claims eligibility...</p>
          </div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRole="MEMBER">
      <FeatureGuard feature="ENABLE_CLAIMS">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Claim</h1>
            <p className="text-gray-600">
              Request financial assistance from the community for unexpected expenses.
            </p>
          </div>

          {/* Eligibility Status */}
          <Card className={`mb-8 ${eligibilityStatus?.isEligible ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {eligibilityStatus?.isEligible ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                Claims Eligibility Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Membership Status</Label>
                  <p className="font-medium">{eligibilityStatus?.membershipStatus}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Membership Duration</Label>
                  <p className="font-medium">{eligibilityStatus?.membershipDays} days</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Required Duration</Label>
                  <p className="font-medium">{eligibilityStatus?.requiredDays} days</p>
                </div>
              </div>
              <p className={`text-sm ${eligibilityStatus?.isEligible ? 'text-green-700' : 'text-amber-700'}`}>
                {eligibilityStatus?.message}
              </p>
            </CardContent>
          </Card>

          {eligibilityStatus?.isEligible ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Claim Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Claim Details
                  </CardTitle>
                  <CardDescription>
                    Provide clear and detailed information about your claim.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title">Claim Title *</Label>
                    <Input
                      id="title"
                      placeholder="Brief, descriptive title (e.g., 'Car transmission repair')"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select claim category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div>
                              <div className="font-medium">{category.label}</div>
                              <div className="text-sm text-gray-500">{category.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <Label htmlFor="requestedAmount">Requested Amount (USD) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="requestedAmount"
                        type="number"
                        min="1"
                        max="500"
                        step="0.01"
                        placeholder="0.00"
                        className={`pl-10 ${errors.requestedAmount ? 'border-red-500' : ''}`}
                        value={formData.requestedAmount || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, requestedAmount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Maximum claim amount: $500</p>
                    {errors.requestedAmount && <p className="text-red-500 text-sm mt-1">{errors.requestedAmount}</p>}
                  </div>

                  <div>
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Explain your situation in detail. Include what happened, why you need assistance, and how this expense affects your ability to work or maintain your livelihood."
                      className={`min-h-32 ${errors.description ? 'border-red-500' : ''}`}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.description.length}/500 characters (minimum 50 required)
                    </p>
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Evidence Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-green-600" />
                    Supporting Evidence
                  </CardTitle>
                  <CardDescription>
                    Upload documents that support your claim (receipts, estimates, medical bills, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="evidenceNotes">Evidence Explanation *</Label>
                    <Textarea
                      id="evidenceNotes"
                      placeholder="Explain what evidence you're providing and how it supports your claim."
                      className={errors.evidenceNotes ? 'border-red-500' : ''}
                      value={formData.evidenceNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, evidenceNotes: e.target.value }))}
                    />
                    {errors.evidenceNotes && <p className="text-red-500 text-sm mt-1">{errors.evidenceNotes}</p>}
                  </div>

                  <div>
                    <Label htmlFor="attachments">Upload Files *</Label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center ${errors.attachments ? 'border-red-500' : 'border-gray-300'}`}>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PDF, PNG, JPG, TXT (max 10MB each)</p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" className="mt-2">
                          Select Files
                        </Button>
                      </Label>
                    </div>
                    {errors.attachments && <p className="text-red-500 text-sm mt-1">{errors.attachments}</p>}

                    {formData.attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label>Uploaded Files:</Label>
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Important Information */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Shield className="w-5 h-5" />
                    Important Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-blue-700 text-sm">
                    <li>• Claims are reviewed by community validators and voted on by members</li>
                    <li>• The review process typically takes 3-7 days</li>
                    <li>• False or fraudulent claims may result in membership termination</li>
                    <li>• Approved claims are paid out within 24-48 hours</li>
                    <li>• You can track your claim status and view community feedback</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/claims')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </div>
            </form>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Claims Not Yet Available</h3>
                <p className="text-gray-600 mb-6">
                  You need to maintain an active membership for {eligibilityStatus?.requiredDays} days before 
                  becoming eligible to submit claims.
                </p>
                <div className="text-sm text-gray-500">
                  Days remaining: {Math.max(0, (eligibilityStatus?.requiredDays || 60) - (eligibilityStatus?.membershipDays || 0))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </FeatureGuard>
    </RouteGuard>
  )
}