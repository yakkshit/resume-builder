import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { StandardCoverLetterPDFTemplate } from "./components/pdf-templates/coverletter/standard-cover-letter-template";

async function test() {
  const coverLetterData = { head: "head\nline2", body: "body\nline2", footer: "footer\nline2" };
  try {
    const stream = await renderToStream(React.createElement(StandardCoverLetterPDFTemplate, { coverLetterData }));
    console.log("Stream generated successfully");
  } catch (error) {
    console.error("Error with React.createElement:", error);
  }

  try {
    const element = StandardCoverLetterPDFTemplate({ coverLetterData });
    const stream = await renderToStream(element);
    console.log("Stream generated successfully with direct call");
  } catch (error) {
    console.error("Error with direct call:", error);
  }
}

test();
