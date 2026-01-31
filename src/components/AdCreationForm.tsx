// src/components/AdCreationForm.tsx

import React, { useState } from "react";
import type { AdFormData, FormErrors, UserFriendlyError } from "../types/tiktok";

import { useAuth } from "../contexts/AuthContext";
import { FormField } from "./FormField";
import { MusicSelector } from "./MusicSelector";
import { ErrorBanner } from "./ErrorBanner";
import { validateAdForm, hasErrors } from "../services/validation";
import { createAd } from "../services/tiktokApi";
import { mapApiErrorToUserError } from "../utils/errorMessages";
import { CTA_OPTIONS, OBJECTIVE_OPTIONS } from "../utils/constants";

export function AdCreationForm() {
  const { accessToken } = useAuth();

  const [formData, setFormData] = useState<AdFormData>({
    campaignName: "",
    objective: "TRAFFIC",
    adText: "",
    cta: "LEARN_MORE",
    musicOption: "existing",
    musicId: "",
    uploadedMusicFile: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [systemError, setSystemError] = useState<UserFriendlyError | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user makes changes
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }

    // Clear system error when user makes changes
    if (systemError) {
      setSystemError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemError(null);
    setSuccess(false);

    // Validate form
    const validationErrors = validateAdForm(formData);

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

   if (!accessToken) {
     setSystemError({
       type: "OAUTH_EXPIRED_TOKEN",
       title: "Not Authenticated",
       message: "Please connect your TikTok Ads account to continue.",
       action: 'Click "Connect TikTok Ads Account" above',
       canRetry: false,
     });
     return;
   }

    setSubmitting(true);

    try {
    const result = await createAd(formData, accessToken);

      if (result.success) {
        setSuccess(true);
        setFormData({
          campaignName: "",
          objective: "TRAFFIC",
          adText: "",
          cta: "LEARN_MORE",
          musicOption: "existing",
          musicId: "",
          uploadedMusicFile: undefined,
        });
        setErrors({});

        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else if (result.error) {
        const userError = mapApiErrorToUserError(result.error);
        setSystemError(userError);
      }
    } catch (error) {
      const userError = mapApiErrorToUserError(error);
      setSystemError(userError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSystemError(null);
    handleSubmit(new Event("submit") as any);
  };

  const adTextLength = formData.adText.length;
  const adTextMaxLength = 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* System Error */}
      {systemError && (
        <div className="mb-6">
          <ErrorBanner
            error={systemError}
            onDismiss={() => setSystemError(null)}
          />
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-green-500">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-green-900">
                Ad Created Successfully!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your TikTok ad has been submitted and is being reviewed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white rounded-xl shadow-lg p-8 border border-gray-100"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Create TikTok Ad</h2>
          <p className="text-sm text-gray-600 mt-1">
            Fill in the details below to create your ad campaign
          </p>
        </div>

        {/* Campaign Name */}
        <FormField label="Campaign Name" required error={errors.campaignName}>
          <input
            type="text"
            value={formData.campaignName}
            onChange={(e) => handleChange("campaignName", e.target.value)}
            placeholder="e.g., Summer Sale 2024"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </FormField>

        {/* Campaign Objective */}
        <FormField label="Campaign Objective" required error={errors.objective}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OBJECTIVE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`relative flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.objective === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="objective"
                  value={option.value}
                  checked={formData.objective === option.value}
                  onChange={(e) => handleChange("objective", e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </FormField>

        {/* Ad Text */}
        <FormField label="Ad Text" required error={errors.adText}>
          <div className="relative">
            <textarea
              value={formData.adText}
              onChange={(e) => handleChange("adText", e.target.value)}
              placeholder="Write compelling ad copy that captures attention..."
              rows={4}
              maxLength={adTextMaxLength}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {adTextLength}/{adTextMaxLength}
            </div>
          </div>
        </FormField>

        {/* Call to Action */}
        <FormField label="Call to Action" required error={errors.cta}>
          <select
            value={formData.cta}
            onChange={(e) => handleChange("cta", e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
          >
            {CTA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Music Selector */}
        <MusicSelector
          musicOption={formData.musicOption}
          musicId={formData.musicId}
          uploadedFile={formData.uploadedMusicFile}
          objective={formData.objective}
          errors={errors}
          onChange={handleChange}
        />

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Ad...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Create Ad
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
