import { Document, Page, Text, View, StyleSheet, Link, Image } from "@react-pdf/renderer"
import type { CoverLetterData } from "@/lib/types"

// Create a gradient-like effect with multiple color blocks
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#ffffff",
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientBlock1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "#1e3a8a", // deep blue
  },
  gradientBlock2: {
    position: "absolute",
    top: 250,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#312e81", // indigo
  },
  gradientBlock3: {
    position: "absolute",
    top: 400,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#4c1d95", // purple
  },
  gradientBlock4: {
    position: "absolute",
    top: 550,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#581c87", // deep purple
  },
  contentWrapper: {
    position: "relative",
    padding: 50,
    height: "100%",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    borderBottomStyle: "solid",
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },
  body: {
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 5,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
    borderTopStyle: "solid",
    paddingTop: 15,
  },
  text: {
    marginBottom: 10,
    color: "white",
    lineHeight: 1.5,
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 5,
    fontSize: 9,
    color: "white",
  },
  contactIcon: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  link: {
    color: "#c7d2fe", // light indigo
    textDecoration: "none",
  },
})

interface GradientCoverLetterTemplateProps {
  coverLetterData: CoverLetterData
}

export const GradientCoverLetterTemplate = ({ coverLetterData }: GradientCoverLetterTemplateProps) => {
  // Split the text into paragraphs safely
  const headParagraphs = (coverLetterData?.head || "").split("\n").filter((p) => p.trim() !== "")
  const bodyParagraphs = (coverLetterData?.body || "").split("\n").filter((p) => p.trim() !== "")
  const footerParagraphs = (coverLetterData?.footer || "").split("\n").filter((p) => p.trim() !== "")

  // SVG icons as data URLs for email, phone, location
  const emailIcon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tYWlsIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTYiIHg9IjIiIHk9IjQiIHJ4PSIyIi8+PHBhdGggZD0ibTIyIDdoLTIwbDEwIDggMTAtOHoiLz48L3N2Zz4="
  const phoneIcon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1waG9uZSI+PHBhdGggZD0iTTIyIDE2LjkydjNhMiAyIDAgMCAxLTIuMTggMiAxOS43OSAxOS43OSAwIDAgMS04LjYzLTMuMDcgMTkuNSAxOS41IDAgMCAxLTYtNiAxOS43OSAxOS43OSAwIDAgMS0zLjA3LTguNjdBMiAyIDAgMCAxIDQuMTEgMmgzYTIgMiAwIDAgMSAyIDEuNzIgMTIuODQgMTIuODQgMCAwIDAgLjcgMi44MSAyIDIgMCAwIDEtLjQ1IDIuMTFMOC4wOSA5LjkxYTE2IDE2IDAgMCAwIDYgNmwxLjI3LTEuMjdhMiAyIDAgMCAxIDIuMTEtLjQ1IDEyLjg0IDEyLjg0IDAgMCAwIDIuODEuN0EyIDIgMCAwIDEgMjIgMTYuOTJ6Ii8+PC9zdmc+"
  const locationIcon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tYXAtcGluIj48cGF0aCBkPSJNMjAgMTBjMCA2LTggMTItOCAxMnMtOC02LTgtMTJhOCA4IDAgMCAxIDE2IDB6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg=="

  // Extract email, phone, and location from the header if available
  const emailMatch = headParagraphs.join(" ").match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)
  const phoneMatch = headParagraphs
    .join(" ")
    .match(/(\+?[0-9][\s-]?)?($\$?[0-9]{3}$\$?|[0-9]{3})[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})/i)
  const email = emailMatch ? emailMatch[0] : null
  const phone = phoneMatch ? phoneMatch[0] : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Gradient Background */}
        <View style={styles.gradientBackground}>
          <View style={styles.gradientBlock1} />
          <View style={styles.gradientBlock2} />
          <View style={styles.gradientBlock3} />
          <View style={styles.gradientBlock4} />
        </View>

        <View style={styles.contentWrapper}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cover Letter</Text>

            {/* Contact Info with Icons */}
            <View style={styles.contactInfo}>
              {email && (
                <View style={styles.contactItem}>
                  <Image src={emailIcon || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link src={`mailto:${email}`} style={styles.link}>
                    <Text>{email}</Text>
                  </Link>
                </View>
              )}
              {phone && (
                <View style={styles.contactItem}>
                  <Image src={phoneIcon || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link src={`tel:${phone.replace(/[^\d+]/g, "")}`} style={styles.link}>
                    <Text>{phone}</Text>
                  </Link>
                </View>
              )}
            </View>

            {headParagraphs.map((paragraph, index) => (
              <Text key={`head-${index}`} style={styles.text}>
                {paragraph}
              </Text>
            ))}
          </View>

          {/* Body Section */}
          <View style={styles.body}>
            {bodyParagraphs.map((paragraph, index) => (
              <Text key={`body-${index}`} style={styles.text}>
                {paragraph}
              </Text>
            ))}
          </View>

          {/* Footer Section */}
          <View style={styles.footer}>
            {footerParagraphs.map((paragraph, index) => (
              <Text key={`footer-${index}`} style={styles.text}>
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  )
}