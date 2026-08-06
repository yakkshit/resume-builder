import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { CoverLetterData } from "@/lib/types"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
  },
  accentBar: {
    height: 4,
    backgroundColor: "#2563eb",
    marginBottom: 20,
    marginHorizontal: -40,
    marginTop: -40,
  },
  section: {
    marginBottom: 16,
  },
  headText: {
    fontSize: 9.5,
    color: "#475569",
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 10,
    color: "#1e293b",
    marginBottom: 10,
    textAlign: "justify",
  },
  footerText: {
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
})

interface Props {
  coverLetterData: CoverLetterData
}

export function MinimalCoverLetterPDFTemplate({ coverLetterData }: Props) {
  const headParagraphs = coverLetterData.head.split("\n").filter((p) => p.trim() !== "")
  const bodyParagraphs = coverLetterData.body.split("\n").filter((p) => p.trim() !== "")
  const footerParagraphs = coverLetterData.footer.split("\n").filter((p) => p.trim() !== "")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />

        <View style={styles.section}>
          {headParagraphs.map((paragraph, index) => (
            <Text key={`head-${index}`} style={styles.headText}>
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
