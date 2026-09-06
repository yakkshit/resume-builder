const React = require("react");
const { createElement: h } = React;
const { Document, Page, Text, View, StyleSheet, Link, renderToFile } = require("@react-pdf/renderer");
const fs = require("fs");
const path = require("path");

function countPdfPages(pdfBuffer) {
  const content = pdfBuffer.toString("latin1");
  const matches = content.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

// -------------------------------------------------------------
// STYLES FOR EXACT 2-PAGE RESUME
// -------------------------------------------------------------
const cvStyles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 34,
    paddingRight: 34,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    lineHeight: 1.35,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
    paddingBottom: 8,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  targetTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    fontSize: 8.2,
    color: "#475569",
  },
  contactItem: {
    color: "#475569",
    textDecoration: "none",
  },
  section: {
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 9.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 2,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 8.6,
    color: "#334155",
    lineHeight: 1.35,
  },
  skillsGrid: {
    flexDirection: "column",
    gap: 3,
  },
  skillRow: {
    flexDirection: "row",
    fontSize: 8.4,
    lineHeight: 1.3,
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    width: "24%",
  },
  skillList: {
    color: "#334155",
    width: "76%",
  },
  itemGroup: {
    marginBottom: 7,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 1.5,
  },
  itemRole: {
    fontSize: 9.2,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  itemCompany: {
    fontSize: 8.8,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
  },
  itemDateLocation: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#64748b",
  },
  itemSubhead: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Oblique",
    color: "#475569",
    marginBottom: 2.5,
  },
  bulletList: {
    paddingLeft: 6,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 8.4,
    color: "#334155",
    lineHeight: 1.3,
  },
  bulletDot: {
    width: 9,
    color: "#2563eb",
    fontFamily: "Helvetica-Bold",
  },
  bulletText: {
    flex: 1,
  },
  pageNumber: {
    position: "absolute",
    bottom: 12,
    right: 34,
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

// -------------------------------------------------------------
// STYLES FOR EXACT 1-PAGE COVER LETTER
// -------------------------------------------------------------
const clStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 46,
    paddingRight: 46,
    fontFamily: "Helvetica",
    fontSize: 9.6,
    color: "#1e293b",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
    paddingBottom: 10,
    marginBottom: 16,
  },
  senderName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  senderTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  senderContact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    fontSize: 8.5,
    color: "#475569",
  },
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    fontSize: 9,
  },
  recipientBlock: {
    color: "#334155",
    lineHeight: 1.35,
  },
  dateBlock: {
    color: "#64748b",
  },
  subject: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  salutation: {
    fontSize: 9.6,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 9.3,
    color: "#334155",
    lineHeight: 1.42,
    marginBottom: 10,
  },
  signOff: {
    marginTop: 12,
    fontSize: 9.4,
    color: "#334155",
  },
  signatureName: {
    marginTop: 16,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
});

// -------------------------------------------------------------
// RESUME COMPONENT (EXACT 2 PAGES)
// -------------------------------------------------------------
function ResumeDocument({ data }) {
  return h(
    Document,
    null,
    // ================= PAGE 1 =================
    h(
      Page,
      { size: "A4", style: cvStyles.page },
      // Header
      h(
        View,
        { style: cvStyles.header },
        h(Text, { style: cvStyles.name }, data.personalInfo.name),
        h(Text, { style: cvStyles.targetTitle }, data.personalInfo.title),
        h(
          View,
          { style: cvStyles.contactRow },
          h(Text, { style: cvStyles.contactItem }, data.personalInfo.email),
          h(Text, { style: cvStyles.contactItem }, "•"),
          h(Text, { style: cvStyles.contactItem }, data.personalInfo.phone),
          h(Text, { style: cvStyles.contactItem }, "•"),
          h(Text, { style: cvStyles.contactItem }, data.personalInfo.location),
          h(Text, { style: cvStyles.contactItem }, "•"),
          h(Link, { src: data.personalInfo.linkedin, style: cvStyles.contactItem }, "LinkedIn"),
          h(Text, { style: cvStyles.contactItem }, "•"),
          h(Link, { src: data.personalInfo.github, style: cvStyles.contactItem }, "GitHub"),
          h(Text, { style: cvStyles.contactItem }, "•"),
          h(Link, { src: data.personalInfo.website, style: cvStyles.contactItem }, "Portfolio")
        )
      ),
      // Summary
      h(
        View,
        { style: cvStyles.section },
        h(Text, { style: cvStyles.sectionTitle }, "Professional Summary"),
        h(Text, { style: cvStyles.summaryText }, data.summary)
      ),
      // Technical Skills
      h(
        View,
        { style: cvStyles.section },
        h(Text, { style: cvStyles.sectionTitle }, "Core Technical Competencies"),
        h(
          View,
          { style: cvStyles.skillsGrid },
          data.skills.map((skillGroup, idx) =>
            h(
              View,
              { key: idx, style: cvStyles.skillRow },
              h(Text, { style: cvStyles.skillCategory }, skillGroup.category + ":"),
              h(Text, { style: cvStyles.skillList }, skillGroup.items.join(" • "))
            )
          )
        )
      ),
      // Experience (Page 1 Entries)
      h(
        View,
        { style: cvStyles.section },
        h(Text, { style: cvStyles.sectionTitle }, "Professional Experience"),
        data.experiencePage1.map((exp, idx) =>
          h(
            View,
            { key: idx, style: cvStyles.itemGroup },
            h(
              View,
              { style: cvStyles.itemHeader },
              h(Text, { style: cvStyles.itemRole }, exp.position),
              h(Text, { style: cvStyles.itemDateLocation }, exp.startDate + " – " + exp.endDate)
            ),
            h(
              View,
              { style: cvStyles.itemHeader },
              h(Text, { style: cvStyles.itemCompany }, exp.company),
              h(Text, { style: cvStyles.itemDateLocation }, exp.location || "")
            ),
            h(
              View,
              { style: cvStyles.bulletList },
              exp.bullets.map((bullet, bIdx) =>
                h(
                  View,
                  { key: bIdx, style: cvStyles.bulletItem },
                  h(Text, { style: cvStyles.bulletDot }, "›"),
                  h(Text, { style: cvStyles.bulletText }, bullet)
                )
              )
            )
          )
        )
      ),
      h(Text, { style: cvStyles.pageNumber }, "Page 1 of 2")
    ),

    // ================= PAGE 2 =================
    h(
      Page,
      { size: "A4", style: cvStyles.page },
      // Experience Continued (Page 2 Entries)
      h(
        View,
        { style: cvStyles.section },
        h(Text, { style: cvStyles.sectionTitle }, "Professional Experience (Continued)"),
        data.experiencePage2.map((exp, idx) =>
          h(
            View,
            { key: idx, style: cvStyles.itemGroup },
            h(
              View,
              { style: cvStyles.itemHeader },
              h(Text, { style: cvStyles.itemRole }, exp.position),
              h(Text, { style: cvStyles.itemDateLocation }, exp.startDate + " – " + exp.endDate)
            ),
            h(
              View,
              { style: cvStyles.itemHeader },
              h(Text, { style: cvStyles.itemCompany }, exp.company),
              h(Text, { style: cvStyles.itemDateLocation }, exp.location || "")
            ),
            h(
              View,
              { style: cvStyles.bulletList },
              exp.bullets.map((bullet, bIdx) =>
                h(
                  View,
                  { key: bIdx, style: cvStyles.bulletItem },
                  h(Text, { style: cvStyles.bulletDot }, "›"),
                  h(Text, { style: cvStyles.bulletText }, bullet)
                )
              )
            )
          )
        )
      ),
      // Key Projects
      h(
        View,
        { style: cvStyles.section },
        h(Text, { style: cvStyles.sectionTitle }, "Featured MLOps & AI Engineering Projects"),
        data.projects.map((proj, idx) =>
          h(
            View,
            { key: idx, style: cvStyles.itemGroup },
            h(
              View,
              { style: cvStyles.itemHeader },
              h(Text, { style: cvStyles.itemRole }, proj.name),
              h(Text, { style: cvStyles.itemDateLocation }, proj.technologies.join(" • "))
            ),
            h(
              View,
              { style: cvStyles.bulletList },
              proj.bullets.map((bullet, bIdx) =>
                h(
                  View,
                  { key: bIdx, style: cvStyles.bulletItem },
                  h(Text, { style: cvStyles.bulletDot }, "›"),
                  h(Text, { style: cvStyles.bulletText }, bullet)
                )
              )
            )
          )
        )
      ),
      // Education
      h(
        View,
        { style: cvStyles.section },
        h(Text, { style: cvStyles.sectionTitle }, "Education"),
        data.education.map((edu, idx) =>
          h(
            View,
            { key: idx, style: cvStyles.itemGroup },
            h(
              View,
              { style: cvStyles.itemHeader },
              h(Text, { style: cvStyles.itemRole }, edu.degree),
              h(Text, { style: cvStyles.itemDateLocation }, edu.period)
            ),
            h(
              View,
              { style: cvStyles.itemHeader },
              h(Text, { style: cvStyles.itemCompany }, edu.institution),
              h(Text, { style: cvStyles.itemDateLocation }, edu.location || "")
            ),
            edu.details ? h(Text, { style: cvStyles.itemSubhead }, edu.details) : null
          )
        )
      ),
      // Certifications & Languages
      h(
        View,
        { style: cvStyles.section },
        h(Text, { style: cvStyles.sectionTitle }, "Certifications & Languages"),
        h(
          View,
          { style: cvStyles.skillsGrid },
          h(
            View,
            { style: cvStyles.skillRow },
            h(Text, { style: cvStyles.skillCategory }, "Certifications:"),
            h(Text, { style: cvStyles.skillList }, data.certifications.join(" • "))
          ),
          h(
            View,
            { style: cvStyles.skillRow },
            h(Text, { style: cvStyles.skillCategory }, "Languages:"),
            h(Text, { style: cvStyles.skillList }, data.languages.join(" • "))
          )
        )
      ),
      h(Text, { style: cvStyles.pageNumber }, "Page 2 of 2")
    )
  );
}

// -------------------------------------------------------------
// COVER LETTER COMPONENT (EXACT 1 PAGE)
// -------------------------------------------------------------
function CoverLetterDocument({ data }) {
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: clStyles.page },
      // Header
      h(
        View,
        { style: clStyles.header },
        h(Text, { style: clStyles.senderName }, data.sender.name),
        h(Text, { style: clStyles.senderTitle }, data.sender.title),
        h(
          View,
          { style: clStyles.senderContact },
          h(Text, null, data.sender.email),
          h(Text, null, "•"),
          h(Text, null, data.sender.phone),
          h(Text, null, "•"),
          h(Text, null, data.sender.location),
          h(Text, null, "•"),
          h(Link, { src: data.sender.linkedin }, "LinkedIn")
        )
      ),
      // Meta section
      h(
        View,
        { style: clStyles.metaSection },
        h(
          View,
          { style: clStyles.recipientBlock },
          h(Text, { style: { fontFamily: "Helvetica-Bold", color: "#0f172a" } }, data.recipient.company),
          h(Text, null, data.recipient.team),
          h(Text, null, data.recipient.address)
        ),
        h(Text, { style: clStyles.dateBlock }, data.date)
      ),
      // Subject
      h(Text, { style: clStyles.subject }, data.subject),
      // Salutation
      h(Text, { style: clStyles.salutation }, data.salutation),
      // Paragraphs
      data.paragraphs.map((p, idx) =>
        h(Text, { key: idx, style: clStyles.paragraph }, p)
      ),
      // Sign off
      h(Text, { style: clStyles.signOff }, data.signOff),
      h(Text, { style: clStyles.signatureName }, data.sender.name)
    )
  );
}

module.exports = {
  ResumeDocument,
  CoverLetterDocument,
  countPdfPages,
};
