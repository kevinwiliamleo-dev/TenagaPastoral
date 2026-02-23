"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations, useFormatter } from "next-intl"

interface Period {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

interface Evaluation {
  id: string
  periodId: string
  periodName: string
  appraiseeId: string | null
  appraiseeName: string | null
  submittedAt: Date
  isFinal: boolean
  isSelfEvaluation: boolean
}

interface EvaluationsClientProps {
  periods: Period[]
  myEvaluations: Evaluation[]
  userId: string
  userRole: "ADMIN" | "PASTORAL_STAFF"
  userName: string
}

export function EvaluationsClient({ periods, myEvaluations, userId, userRole, userName }: EvaluationsClientProps) {
  const t = useTranslations("Evaluations")
  const format = useFormatter()
  const [activeTab, setActiveTab] = useState<"start" | "history">("start")

  const formatDate = (date: Date) => {
    return format.dateTime(new Date(date), {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <>
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("subtitle")}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("start")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "start"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              {t("tabs.start_new")}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">history</span>
              {t("tabs.history")}
              {myEvaluations.length > 0 && (
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {myEvaluations.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "start" && (
          <div className="space-y-6">
            {/* Active Periods */}
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">event_available</span>
                  {t("active_periods.title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("active_periods.subtitle")}
                </p>
              </div>

              {periods.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
                    <span className="material-symbols-outlined text-3xl text-muted-foreground">event_busy</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("active_periods.empty_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("active_periods.empty_desc")}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {periods.map((period) => (
                    <div
                      key={period.id}
                      className="p-6 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {period.name}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            {formatDate(period.startDate)} - {formatDate(period.endDate)}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* Self Evaluation Button */}
                          <Link
                            href={`/evaluations/${period.id}?type=self`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            {t("active_periods.self_eval")}
                          </Link>

                          {/* Peer Evaluation Button (if applicable) */}
                          <Link
                            href={`/evaluations/${period.id}?type=peer`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-card text-foreground rounded-lg font-medium text-sm hover:bg-accent transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">group</span>
                            {t("active_periods.peer_eval")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Evaluation History */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">assignment_turned_in</span>
                  {t("history.title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("history.subtitle")}
                </p>
              </div>

              {myEvaluations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
                    <span className="material-symbols-outlined text-3xl text-muted-foreground">folder_open</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("history.empty_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("history.empty_desc")}
                  </p>
                  <button
                    onClick={() => setActiveTab("start")}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t("history.start_button")}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("history.table.period")}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("history.table.target")}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("history.table.date")}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("history.table.status")}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("history.table.action")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {myEvaluations.map((evaluation) => (
                        <tr key={evaluation.id} className="hover:bg-accent/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-foreground">
                              {evaluation.periodName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-muted-foreground">
                                {evaluation.isSelfEvaluation ? "person" : "group"}
                              </span>
                              <span className="text-sm text-foreground">
                                {evaluation.isSelfEvaluation ? t("history.self") : evaluation.appraiseeName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(evaluation.submittedAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {evaluation.isFinal ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                                {t("history.status.submitted")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                <span className="material-symbols-outlined text-[14px] mr-1">edit</span>
                                {t("history.status.draft")}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!evaluation.isFinal && (
                              <Link
                                href={`/evaluations/${evaluation.periodId}?type=${evaluation.isSelfEvaluation ? "self" : "peer"}&target=${evaluation.appraiseeId || ""}`}
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                {t("history.continue")}
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
