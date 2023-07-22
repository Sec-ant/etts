import { getDocument } from "pdfjs-dist";

export async function* getPDFContent(filePath: string) {
  const doc = await getDocument(filePath).promise;
  const numPages = doc.numPages;
  for (let pageNum = 1; pageNum <= numPages; ++pageNum) {
    const page = await doc.getPage(pageNum);
    const pageContentStream = page.streamTextContent();
    for await (const { items } of pageContentStream) {
      for (const { str, hasEOL } of items as {
        str: string;
        hasEOL: boolean;
      }[]) {
        if (str.endsWith("-") && hasEOL) {
          yield str.slice(0, -1);
        } else {
          yield str;
          if (hasEOL) {
            yield " ";
          }
        }
      }
    }
  }
}
