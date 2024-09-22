// /**
//  * Write a function that reads ./generated/zod/index.ts file.
//  * File contains multiple zod schemas and types that are exported.
//  *
//  * It should return an array of strings of statements that are exported from the file.
//  */

// import fs from "fs";
// import path from "path";

// // -------------------------------------------------------------------------------------------------
// // Read file line by line
// const filePath = path.join(__dirname, "./generated/zod/index.ts");

// const fileContent = fs.readFileSync(filePath, "utf-8");
// let lines = fileContent.split("\n");

// // -------------------------------------------------------------------------------------------------
// // Remove all comments
// lines = lines.filter((line) => !line.startsWith("//"));

// // -------------------------------------------------------------------------------------------------
// // Remove all empty lines
// lines = lines.filter((line) => line.trim() !== "");

// // -------------------------------------------------------------------------------------------------
// // Find line indices that start with `export`
// const exportLineIndices: number[] = [];
// lines.forEach((line, idx) => {
//   if (line.startsWith("export")) {
//     exportLineIndices.push(idx);
//   }
// });

// // -------------------------------------------------------------------------------------------------
// // Extract export statements
// const items: string[] = [
//   "import { z } from 'zod';\nimport type { Prisma } from '@prisma/client';",
// ];
// exportLineIndices.forEach((exportLineIndex, idx) => {
//   // Add lines between this exportLine and the next exportLine as one string to items
//   if (idx < exportLineIndices.length - 1) {
//     const nextExportLineIndex = exportLineIndices[idx + 1];
//     const statementLines = lines.slice(exportLineIndex, nextExportLineIndex);
//     // Now combine all statement lines into one string and push to items
//     items.push(statementLines.join("\n"));
//   } else {
//     // Add lines after the last exportLine as one string to items
//     items.push(lines.slice(exportLineIndex).join("\n"));
//   }
// });

// // -------------------------------------------------------------------------------------------------
// // Transform

// items.forEach((item, idx) => {
//   const regex = /export\s+const\s+(\w+)\s*(?:[:=])/;
//   const match = item.match(regex);
//   if (match) {
//     const schemaName = match[1];
//     items[
//       idx
//     ] += `\n//Type:\nexport type T${schemaName} = z.infer<typeof ${schemaName}>;`;
//   }
// });

// // -------------------------------------------------------------------------------------------------
// // Output items to zod-types.ts file (overwrite existing file)
// const outFilePath = path.join(__dirname, "./zod-types.ts");

// fs.writeFileSync(outFilePath, items.join(`\n\n// ${"-".repeat(97)}\n`), {
//   encoding: "utf-8",
//   flag: "w",
// });
