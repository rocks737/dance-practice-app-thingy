"use client";

import { Badge } from "@/components/ui/badge";
import type { EnrichedMatch } from "@/lib/matches/api";
import { FOCUS_AREA_LABELS, type FocusArea } from "@/lib/schedule/types";
import {
  PrimaryRole,
  PRIMARY_ROLE_LABELS,
  WSDC_SKILL_LEVEL_LABELS,
  WsdcSkillLevel,
} from "@/lib/profiles/types";

interface MatchCardProps {
  match: EnrichedMatch;
}

const COMPETITIVENESS_LABELS: Record<number, string> = {
  1: "Very Casual",
  2: "Casual",
  3: "Balanced",
  4: "Competitive",
  5: "Very Competitive",
};

function getDisplayName(match: EnrichedMatch): string {
  if (match.displayName) {
    return match.displayName;
  }
  return `${match.firstName} ${match.lastName}`.trim() || "Unknown";
}

function getRoleIcon(primaryRole: number): { letter: string; label: string } {
  if (primaryRole === PrimaryRole.LEADER) {
    return { letter: "L", label: PRIMARY_ROLE_LABELS[PrimaryRole.LEADER] };
  }
  return { letter: "F", label: PRIMARY_ROLE_LABELS[PrimaryRole.FOLLOWER] };
}

function getWsdcLevelLabel(level: number | null): string {
  if (level === null || level === undefined) {
    return "Not specified";
  }
  return WSDC_SKILL_LEVEL_LABELS[level as WsdcSkillLevel] ?? "Unknown";
}

function getCompetitivenessLabel(level: number): string {
  return COMPETITIVENESS_LABELS[level] ?? "Balanced";
}

export function MatchCard({ match }: MatchCardProps) {
  const roleInfo = getRoleIcon(match.primaryRole);

  return (
    <li className="col-span-1 flex flex-col divide-y divide-gray-200 dark:divide-gray-700 rounded-lg bg-white dark:bg-gray-800 text-center shadow-sm">
      <div className="flex flex-1 flex-col p-6">
        {/* Role Icon */}
        <div className="mx-auto flex items-center justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold ${
              match.primaryRole === PrimaryRole.LEADER
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
            }`}
            title={roleInfo.label}
          >
            {roleInfo.letter}
          </div>
        </div>

        {/* Name */}
        <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          {getDisplayName(match)}
        </h3>

        {/* WSDC Level & Competitiveness */}
        <dl className="mt-2 flex flex-col gap-1">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <dt className="sr-only">WSDC Level</dt>
            <dd>{getWsdcLevelLabel(match.wsdcLevel)}</dd>
            <span aria-hidden="true">•</span>
            <dt className="sr-only">Competitiveness</dt>
            <dd>{getCompetitivenessLabel(match.competitivenessLevel)}</dd>
          </div>
        </dl>

        {/* Bio (About) */}
        {match.bio && (
          <div className="mt-4 text-left">
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              About
            </dt>
            <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {match.bio}
            </dd>
          </div>
        )}

        {/* Dance Goals */}
        {match.danceGoals && (
          <div className="mt-3 text-left">
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Dance Goals
            </dt>
            <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {match.danceGoals}
            </dd>
          </div>
        )}

        {/* Focus Areas */}
        {match.focusAreas.length > 0 && (
          <div className="mt-4">
            <dt className="sr-only">Focus Areas</dt>
            <dd className="flex flex-wrap justify-center gap-1.5">
              {match.focusAreas.map((area: FocusArea) => (
                <Badge
                  key={area}
                  variant="secondary"
                  className="text-xs"
                >
                  {FOCUS_AREA_LABELS[area]}
                </Badge>
              ))}
            </dd>
          </div>
        )}
      </div>

      {/* Match Score Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span title="Match score based on availability, focus areas, and skill level">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {Math.round(match.score)}%
            </span>{" "}
            match
          </span>
          <span>•</span>
          <span>
            {match.overlappingWindows} overlapping{" "}
            {match.overlappingWindows === 1 ? "window" : "windows"}
          </span>
        </div>
      </div>
    </li>
  );
}

