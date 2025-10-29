// src/lib/dataServer.ts
// This file now manages Obsidian MD files and chat interactions.

import { Langfuse } from "langfuse";
import axios from "axios";
import { RecursiveCharacterTextSplitter } from "./vectorstore";

const langfuse = new Langfuse({
  publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY || "pk-lf-public-key",
  secretKey: process.env.NEXT_PUBLIC_LANGFUSE_SECRET_KEY || "sk-lf-secret-key",
});

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId: number | null;
  messages: ChatMessage[];
}

interface ObsidianFile {
  path: string;
  content: string;
}

/**
 * Transforms a chat session into an Obsidian MD note content.
 * @param session The chat session to transform.
 * @returns The content of the Obsidian MD note.
 */
function transformChatToObsidianMD(session: ChatSession): string {
  let mdContent = `# ${session.title}\n\n`;
  mdContent += `**Created At:** ${session.createdAt}\n`;
  mdContent += `**Updated At:** ${session.updatedAt}\n\n`;

  session.messages.forEach((message) => {
    mdContent += `## ${message.role.toUpperCase()} (${message.timestamp})\n\n`;
    mdContent += `${message.content}\n\n`;
  });

  return mdContent;
}

/**
 * Saves a chat session as an Obsidian MD note.
 * @param session The chat session to save.
 * @param vaultName The name of the Obsidian vault.
 * @param folderPath The folder path within the vault where the note should be saved.
 * @returns The path of the saved Obsidian MD note.
 */
async function saveChatAsObsidianNote(
  session: ChatSession,
  vaultName: string,
  folderPath: string = ""
): Promise<string> {
  const trace = langfuse.trace({
    name: "saveChatAsObsidianNote",
    input: { session, vaultName, folderPath },
  });
  const span_name = "SaveChatAsObsidianNote-Span";
  const span = trace.span({ name: span_name });

  try {
    const mdContent = transformChatToObsidianMD(session);
    const fileName = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`; // Sanitize filename
    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Simulate saving to Obsidian (replace with actual Obsidian API call if available)
    // In a real Obsidian integration, you would use the Obsidian API here.
    // For this example, we'll just log the content and path.
    console.log(`Saving chat session "${session.title}" to Obsidian vault "${vaultName}" at path: ${fullPath}`);
    console.log("Content:\n", mdContent);

    trace.update({ output: { message: `Chat session saved to ${fullPath}` } });
    return fullPath;
  } catch (error: any) {
    trace.update({
      output: {
        message: "Error saving chat to Obsidian",
        level: "ERROR",
        exception: error,
      },
    });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Fetches the content of an Obsidian MD file.
 * @param vaultName The name of the Obsidian vault.
 * @param filePath The path to the Obsidian MD file.
 * @returns The content of the Obsidian MD file.
 */
async function fetchObsidianFileContent(vaultName: string, filePath: string): Promise<string> {
  const trace = langfuse.trace({
    name: "fetchObsidianFileContent",
    input: { vaultName, filePath },
  });
  const span_name = "FetchObsidianFileContent-Span";
  const span = trace.span({ name: span_name });

  try {
    // Simulate fetching from Obsidian (replace with actual Obsidian API call if available)
    // In a real Obsidian integration, you would use the Obsidian API here.
    // For this example, we'll just return a placeholder content.
    console.log(`Fetching content from Obsidian vault "${vaultName}" at path: ${filePath}`);
    const content = `# Placeholder Content\n\nThis is placeholder content for the file: ${filePath}`;

    trace.update({ output: { message: `Successfully fetched content from ${filePath}` } });
    return content;
  } catch (error: any) {
    trace.update({
      output: {
        message: "Error fetching Obsidian file content",
        level: "ERROR",
        exception: error,
      },
    });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Lists all Obsidian MD files in a given folder.
 * @param vaultName The name of the Obsidian vault.
 * @param folderPath The folder path within the vault.
 * @returns An array of ObsidianFile objects.
 */
async function listObsidianFiles(vaultName: string, folderPath: string = ""): Promise<ObsidianFile[]> {
  const trace = langfuse.trace({
    name: "listObsidianFiles",
    input: { vaultName, folderPath },
  });
  const span_name = "ListObsidianFiles-Span";
  const span = trace.span({ name: span_name });

  try {
    // Simulate listing files from Obsidian (replace with actual Obsidian API call if available)
    // In a real Obsidian integration, you would use the Obsidian API here.
    // For this example, we'll just return some placeholder files.
    console.log(`Listing files in Obsidian vault "${vaultName}" at folder path: ${folderPath}`);
    const files: ObsidianFile[] = [
      { path: `${folderPath}/note1.md`, content: "# Note 1" },
      { path: `${folderPath}/note2.md`, content: "# Note 2" },
      { path: `${folderPath}/subfolder/note3.md`, content: "# Note 3" },
    ];

    trace.update({ output: { files } });
    return files;
  } catch (error: any) {
    trace.update({
      output: {
        message: "Error listing Obsidian files",
        level: "ERROR",
        exception: error,
      },
    });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Creates documents from text content.
 * @param text The text content to split into documents.
 * @param filePath The file path associated with the text.
 * @returns An array of documents.
 */
async function createDocuments({ text, filePath }: { text: string; filePath: string }): Promise<any[]> {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(text);
    return chunks.map((chunk) => ({ text: chunk, metadata: { source: filePath } }));
  } catch (error: any) {
    throw error;
  }
}

export {
  saveChatAsObsidianNote,
  fetchObsidianFileContent,
  listObsidianFiles,
  createDocuments,
  transformChatToObsidianMD
};
