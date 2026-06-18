import React from "react";
import { MapPin, Globe, ArrowRight } from "lucide-react";
import { Job } from "../../features/useJobs";
import { MatchBreakdown } from "../../features/useRecommendations";
import { MatchRing } from "../match-ring/MatchRing";

interface JobDetailsDrawerProps {
  job: Job;
  match: MatchBreakdown | null;
  onClose: () => void;
}

export const JobDetailsDrawer: React.FC<JobDetailsDrawerProps> = ({
  job,
  match,
  onClose,
}) => {
  const totalSkills = match ? match.matchedSkills.length + match.missingSkills.length : 0;
  const matchedSkillsCount = match ? match.matchedSkills.length : 0;
  const missingSkillsCount = match ? match.missingSkills.length : 0;

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-end p-4">
      <div className="w-full max-w-xl bg-white h-full rounded-l-[24px] shadow-2xl p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-border pb-4">
            <div className="space-y-1 pr-6">
              <span className="text-xs font-semibold bg-indigo-tint text-indigo px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {job.type.replace("-", " ")}
              </span>
              <h2 className="text-2xl font-bold font-display text-ink mt-2 leading-tight">{job.title}</h2>
              <p className="text-base text-indigo font-semibold">{job.company}</p>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:bg-canvas p-1.5 rounded-full transition-colors shrink-0"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Match Score Spotlight in Drawer */}
          {match && (
            <div className="p-5 bg-canvas border border-border rounded-[16px] space-y-4">
              <div className="flex items-center gap-4">
                <MatchRing score={match.score} size="medium" />
                <div>
                  <h4 className="font-bold text-sm text-ink uppercase tracking-wider">AI Match Analysis</h4>
                  <p className="text-xs text-text-muted mt-0.5">{match.explanation}</p>
                </div>
              </div>

              {/* Skills breakdown */}
              {totalSkills > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                    Why you match ({matchedSkillsCount} of {totalSkills} skills)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {match.matchedSkills.map((skill, idx) => (
                      <span
                        key={`match-${idx}`}
                        className="text-[11px] font-semibold bg-emerald/10 text-emerald-700 border border-emerald/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      >
                        {skill} ✓
                      </span>
                    ))}
                    {match.missingSkills.map((skill, idx) => (
                      <span
                        key={`miss-${idx}`}
                        className="text-[11px] font-semibold bg-amber/10 text-amber-700 border border-amber/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      >
                        {skill} •
                      </span>
                    ))}
                  </div>
                  {missingSkillsCount > 0 ? (
                    <p className="text-xs text-amber-600 font-medium">
                      Add {missingSkillsCount} skill{missingSkillsCount > 1 ? "s" : ""} to reach a 100% match score!
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium">
                      Perfect technical skill match!
                    </p>
                  )}
                </div>
              )}

              {/* Preferences breakdown */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                    Location Match
                  </span>
                  {match.locationMatch ? (
                    <span className="text-emerald font-semibold flex items-center gap-1">
                      ✓ Fits preference
                    </span>
                  ) : (
                    <span className="text-text-muted font-medium flex items-center gap-1">
                      Mismatch ({job.location})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                    Work Mode Match
                  </span>
                  {match.workModeMatch ? (
                    <span className="text-emerald font-semibold flex items-center gap-1">
                      ✓ Fits preference
                    </span>
                  ) : (
                    <span className="text-text-muted font-medium flex items-center gap-1">
                      Mismatch ({job.workMode})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Job Metadata Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-canvas text-text-muted px-3 py-1 rounded-full inline-flex items-center gap-1">
              <MapPin size={12} /> {job.location}
            </span>
            <span className="text-xs bg-canvas text-text-muted px-3 py-1 rounded-full inline-flex items-center gap-1">
              <Globe size={12} /> {job.workMode.toUpperCase()}
            </span>
            <span className="text-xs bg-indigo-tint text-indigo px-3 py-1 rounded-full font-medium uppercase tracking-wider text-[10px]">
              {job.source}
            </span>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-ink uppercase tracking-wider">Job Description</h3>
            <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Requirements list */}
          {job.requirements.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-ink uppercase tracking-wider">Requirements</h3>
              <ul className="list-disc pl-5 text-sm text-text-muted space-y-1.5">
                {job.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Button at the Bottom */}
        <div className="border-t border-border pt-6 mt-8 flex gap-4">
          {job.source === "external" ? (
            <a
              href={job.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-indigo text-white font-medium rounded-button text-center flex items-center justify-center gap-1.5 text-sm hover:bg-opacity-95 active:scale-98 transition-all min-h-[44px]"
            >
              Apply on company site <ArrowRight size={16} />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                alert(`One-click apply for internal job: "${job.title}" is implemented in Phase 6. Coming next!`);
              }}
              className="flex-1 py-3 bg-indigo text-white font-medium rounded-button text-sm hover:bg-opacity-95 active:scale-98 transition-all min-h-[44px]"
            >
              One-Click Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// SVG components to bypass missing lucide-react typings
const X = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default JobDetailsDrawer;
