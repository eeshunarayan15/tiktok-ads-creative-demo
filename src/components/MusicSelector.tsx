// src/components/MusicSelector.tsx

import React, { useState, useEffect } from "react";
import type {
  MusicOption,
  CampaignObjective,
  FormErrors,
} from "../types/tiktok";
import { MUSIC_OPTIONS } from "../utils/constants";
import { FormField } from "./FormField";
import { useAuth } from "../contexts/AuthContext";
import { validateMusicId, uploadMusic } from "../services/tiktokApi";

interface MusicSelectorProps {
  musicOption: MusicOption;
  musicId?: string; // ✅ Optional
  uploadedFile?: File | null; // ✅ Match AdFormData
  objective: CampaignObjective;
  errors: FormErrors;
  onChange: (field: string, value: any) => void;
}
export function MusicSelector({
  musicOption,
  musicId,
  uploadedFile,
  objective,
  errors,
  onChange,
}: MusicSelectorProps) {
const { accessToken } = useAuth();
  const [validatingMusic, setValidatingMusic] = useState(false);
  const [musicValidationResult, setMusicValidationResult] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);
  const [uploadingMusic, setUploadingMusic] = useState(false);

  // Reset validation when music option changes
  useEffect(() => {
    setMusicValidationResult(null);
  }, [musicOption]);

  // Validate music ID when it changes
  useEffect(() => {
    if (musicOption === "existing" && musicId && accessToken) {
      const timer = setTimeout(() => {
        handleValidateMusicId();
      }, 500); // Debounce validation

      return () => clearTimeout(timer);
    }
  }, [musicId, musicOption, accessToken]);

  const handleValidateMusicId = async () => {
    if (!musicId || !accessToken) return;

    setValidatingMusic(true);
    setMusicValidationResult(null);

    try {
    const result = await validateMusicId(musicId, accessToken);

      if (result.valid) {
        setMusicValidationResult({
          valid: true,
          message: result.title
            ? `✓ "${result.title}" by ${result.artist}`
            : "✓ Music ID is valid",
        });
      } else {
        setMusicValidationResult({
          valid: false,
          message: result.error || "Music ID not found",
        });
      }
    } catch (error) {
      setMusicValidationResult({
        valid: false,
        message: "Failed to validate music ID",
      });
    } finally {
      setValidatingMusic(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    onChange("uploadedMusicFile", file);
    setUploadingMusic(true);

    try {
      // Simulate upload and get music ID
     const generatedMusicId = await uploadMusic(file, accessToken);
      onChange("musicId", generatedMusicId);

      setMusicValidationResult({
        valid: true,
        message: `✓ Uploaded "${file.name}" successfully`,
      });
    } catch (error) {
      setMusicValidationResult({
        valid: false,
        message: "Failed to upload music file",
      });
    } finally {
      setUploadingMusic(false);
    }
  };

  const isNoneDisabled = objective === "CONVERSIONS";

  return (
    <div className="space-y-4">
      <FormField
        label="Music Selection"
        required
        error={errors.musicOption}
        description={
          isNoneDisabled
            ? "⚠️ Music is required for Conversions campaigns"
            : undefined
        }
      >
        <div className="space-y-3">
          {MUSIC_OPTIONS.map((option) => {
            const disabled = option.value === "none" && isNoneDisabled;

            return (
              <label
                key={option.value}
                className={`relative flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  disabled
                    ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                    : musicOption === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="musicOption"
                  value={option.value}
                  checked={musicOption === option.value}
                  onChange={(e) => onChange("musicOption", e.target.value)}
                  disabled={disabled}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {option.description}
                  </div>
                  {disabled && (
                    <div className="text-xs text-red-600 mt-1 font-medium">
                      Not available for Conversions campaigns
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </FormField>

      {/* Existing Music ID Input */}
      {musicOption === "existing" && (
        <FormField
          label="Music ID"
          required
          error={
            errors.musicId ||
            (musicValidationResult?.valid === false
              ? musicValidationResult.message
              : undefined)
          }
        >
          <div className="relative">
            <input
              type="text"
              value={musicId}
              onChange={(e) => onChange("musicId", e.target.value)}
              placeholder="Enter 10-20 digit music ID"
              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                musicValidationResult?.valid === false
                  ? "border-red-300 bg-red-50"
                  : musicValidationResult?.valid === true
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200"
              }`}
            />

            {validatingMusic && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {musicValidationResult?.valid === true && (
            <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
              {musicValidationResult.message}
            </p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            💡 Example valid IDs: 1234567890123456, 9876543210987654
          </p>
        </FormField>
      )}

      {/* Music File Upload */}
      {musicOption === "upload" && (
        <FormField
          label="Upload Music File"
          required
          error={errors.uploadedMusicFile}
        >
          <div className="relative">
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
              onChange={handleFileUpload}
              disabled={uploadingMusic}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />

            {uploadingMusic && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {uploadedFile && !uploadingMusic && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              {uploadedFile.name} (
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {musicValidationResult?.valid === true && (
            <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
              {musicValidationResult.message}
            </p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            Accepted formats: MP3, WAV, M4A (Max 10MB)
          </p>
        </FormField>
      )}

      {/* No Music - Show confirmation */}
      {musicOption === "none" && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            ℹ️ Your ad will be created without background music. This is only
            available for Traffic campaigns.
          </p>
        </div>
      )}
    </div>
  );
}
