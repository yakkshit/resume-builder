import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { CoverLetterData } from "@/lib/types"

// German DIN 5008 style layout guidelines for cover letters (Anschreiben)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#1e293b",
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
  },
  topHeader: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
    paddingBottom: 10,
    marginBottom: 20,
  },
  senderName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  senderInfo: {
    fontSize: 8.5,
    color: "#64748b",
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  headText: {
    fontSize: 9.5,
    color: "#334155",
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 9.5,
    color: "#0f172a",
    marginBottom: 10,
    textAlign: "justify",
  },
  footerText: {
    fontSize: 9.5,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
})

interface Props {
  coverLetterData: CoverLetterData
}

export function GermanAnschreibenTemplate({ coverLetterData }: Props) {
  const headParagraphs = (coverLetterData?.head || "").split("\n").filter((p) => p.trim() !== "")
  const bodyParagraphs = (coverLetterData?.body || "").split("\n").filter((p) => p.trim() !== "")
  const footerParagraphs = (coverLetterData?.footer || "").split("\n").filter((p) => p.trim() !== "")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          {headParagraphs.map((paragraph, index) => (
            <Text
              key={`head-${index}`}
              style={[
                styles.headText,
                index === 0 ? { fontFamily: "Helvetica-Bold", color: "#0f172a", fontSize: 11 } : {},
              ]}
            >
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          {bodyParagraphs.map((paragraph, index) => (
            <Text key={`body-${index}`} style={styles.bodyText}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          {footerParagraphs.map((paragraph, index) => (
            <Text key={`footer-${index}`} style={styles.footerText}>
              {paragraph}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  )
}
