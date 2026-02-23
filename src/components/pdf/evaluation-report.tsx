"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"

// Register fonts (optional - uses default fonts if not registered)
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf", fontWeight: 700 },
  ],
})

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Roboto",
    fontSize: 11,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#0ea5e9",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0ea5e9",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    marginTop: 20,
    color: "#0ea5e9",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 150,
    fontWeight: 700,
    color: "#374151",
  },
  value: {
    flex: 1,
    color: "#1f2937",
  },
  scoreCard: {
    flexDirection: "row",
    marginTop: 15,
    marginBottom: 15,
    gap: 15,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0ea5e9",
  },
  scoreUnit: {
    fontSize: 10,
    color: "#9ca3af",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0ea5e9",
    padding: 8,
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
    fontSize: 10,
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCol1: {
    flex: 2,
  },
  tableCol2: {
    flex: 1,
    textAlign: "center",
  },
  feedbackItem: {
    backgroundColor: "#f9fafb",
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#0ea5e9",
  },
  feedbackQuestion: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  feedbackComment: {
    fontSize: 11,
    color: "#1f2937",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  gradeExcellent: { color: "#16a34a" },
  gradeGood: { color: "#2563eb" },
  gradeAverage: { color: "#ca8a04" },
  gradeNeedsImprovement: { color: "#dc2626" },
})

// Types
export interface ReportData {
  user: {
    name: string
    email: string
    role: string
  }
  period: {
    name: string
    startDate: Date
    endDate: Date
  }
  summary: {
    overallScore: number
    totalEvaluations: number
    totalQuestions: number
  }
  questionScores?: {
    questionId: string
    questionText: string
    averageScore: number
    totalResponses: number
    questionType: string
  }[]
  feedback?: {
    question: string
    comment: string
  }[]
}

// Helper functions
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const getScoreGrade = (score: number) => {
  if (score >= 4.5) return { label: "Excellent", style: styles.gradeExcellent }
  if (score >= 3.5) return { label: "Good", style: styles.gradeGood }
  if (score >= 2.5) return { label: "Average", style: styles.gradeAverage }
  return { label: "Needs Improvement", style: styles.gradeNeedsImprovement }
}

// PDF Document Component
export function EvaluationReportPDF({ data }: { data: ReportData }) {
  const grade = getScoreGrade(data.summary.overallScore)
  const generatedAt = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Sistem Evaluasi Kinerja</Text>
          <Text style={styles.subtitle}>Tenaga Pastoral</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Laporan Evaluasi Kinerja</Text>

        {/* User Info */}
        <View style={styles.sectionTitle}>
          <Text>Informasi Staff</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama</Text>
          <Text style={styles.value}>{data.user.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{data.user.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Periode Evaluasi</Text>
          <Text style={styles.value}>{data.period.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Rentang Waktu</Text>
          <Text style={styles.value}>
            {formatDate(data.period.startDate)} - {formatDate(data.period.endDate)}
          </Text>
        </View>

        {/* Score Summary */}
        <View style={styles.sectionTitle}>
          <Text>Ringkasan Skor</Text>
        </View>
        <View style={styles.scoreCard}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Skor Keseluruhan</Text>
            <Text style={styles.scoreValue}>{data.summary.overallScore.toFixed(1)}</Text>
            <Text style={styles.scoreUnit}>dari 5.0</Text>
            <Text style={grade.style}>{grade.label}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Total Evaluasi</Text>
            <Text style={styles.scoreValue}>{data.summary.totalEvaluations}</Text>
            <Text style={styles.scoreUnit}>evaluasi diterima</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Total Pertanyaan</Text>
            <Text style={styles.scoreValue}>{data.summary.totalQuestions}</Text>
            <Text style={styles.scoreUnit}>pertanyaan dinilai</Text>
          </View>
        </View>

        {/* Question Scores Table */}
        {data.questionScores && data.questionScores.length > 0 && (
          <>
            <View style={styles.sectionTitle}>
              <Text>Detail Skor per Pertanyaan</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>Pertanyaan</Text>
                <Text style={styles.tableCol2}>Skor</Text>
              </View>
              {data.questionScores.map((item, index) => (
                <View
                  key={index}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <Text style={styles.tableCol1}>{item.questionText}</Text>
                  <Text style={styles.tableCol2}>{item.averageScore.toFixed(1)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Feedback Section */}
        {data.feedback && data.feedback.length > 0 && (
          <>
            <View style={styles.sectionTitle}>
              <Text>Umpan Balik</Text>
            </View>
            {data.feedback.map((fb, index) => (
              <View key={index} style={styles.feedbackItem}>
                <Text style={styles.feedbackQuestion}>{fb.question}</Text>
                <Text style={styles.feedbackComment}>"{fb.comment}"</Text>
              </View>
            ))}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Dokumen ini dibuat secara otomatis oleh Sistem Evaluasi Kinerja Tenaga Pastoral
          </Text>
          <Text>Dicetak pada: {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}
