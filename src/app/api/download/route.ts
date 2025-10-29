import { jsPDF } from "jspdf";
import MarkdownIt from 'markdown-it';
import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
    text: string;
    type: 'pdf' | 'markdown' | 'html';
}

export async function POST(request: NextRequest) {
    const body: RequestBody = await request.json();
    const { text, type } = body;
    
    try {
        if (type === 'pdf') {
            const doc = new jsPDF();
            doc.text(text, 10, 10);
            const pdfOutput = doc.output();
            
            return new NextResponse(Buffer.from(pdfOutput), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename=chat.pdf'
                }
            });
        } else if (type === 'markdown') {
            return new NextResponse(text, {
                headers: {
                    'Content-Type': 'text/markdown',
                    'Content-Disposition': 'attachment; filename=chat.md'
                }
            });
        } else {
            const md = new MarkdownIt();
            const result = md.render(text);
            
            return new NextResponse(result, {
                headers: {
                    'Content-Type': 'text/html'
                }
            });
        }
    } catch (error) {
        console.error("Error generating file", error);
        return NextResponse.json(
            { error: `Error generating file: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}