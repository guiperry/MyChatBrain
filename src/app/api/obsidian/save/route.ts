import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Obsidian save API called');
  try {
    // Parse request body
    const { title, content, vaultName } = await request.json();
    console.log('Request data:', { title, contentLength: content?.length, vaultName });

    if (!title || !content || !vaultName) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Title, content, and vaultName are required' },
        { status: 400 }
      );
    }

    // Sanitize the title for use in a filename - replace spaces with underscores but keep the case
    const sanitizedTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const fileName = `${sanitizedTitle}.md`;

    // Process the content to remove the title if it's already the first line
    // This prevents duplicate titles in Obsidian
    let processedContent = content;
    const firstLine = content.split('\n')[0];
    if (firstLine.startsWith('# ') && firstLine.substring(2).trim() === title) {
      // If the first line is the title, remove it and any blank lines that follow
      processedContent = content.split('\n').slice(1).join('\n').replace(/^\s+/, '');
      console.log('Removed title from content to prevent duplication');
    }

    // Construct the Obsidian URI
    // We'll use obsidian://new to create a new file with the content
    const encodedVaultName = encodeURIComponent(vaultName);
    const encodedFilePath = encodeURIComponent(fileName);
    const encodedContent = encodeURIComponent(processedContent);

    // Construct the Obsidian URI with content
    const obsidianUri = `obsidian://new?vault=${encodedVaultName}&file=${encodedFilePath}&content=${encodedContent}`;

    // Return all necessary information for both web and desktop environments
    return NextResponse.json({
      success: true,
      uri: obsidianUri,
      fileName: fileName,
      content: processedContent,
      vaultName: vaultName,
      // Include additional metadata that might be useful
      metadata: {
        title: title,
        timestamp: new Date().toISOString(),
        source: 'MY-CHAT-BRAIN'
      }
    });
  } catch (error: any) {
    console.error('Error preparing Obsidian save:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to prepare Obsidian save' },
      { status: 500 }
    );
  }
}