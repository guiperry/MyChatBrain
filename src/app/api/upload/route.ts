import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    // This endpoint has been deprecated as part of removing GitHub indexing functionality
    return NextResponse.json({
        error: "This endpoint has been deprecated. GitHub indexing and Weaviate functionality have been removed."
    }, { status: 410 });
}