import { NextRequest, NextResponse } from 'next/server'
import { getJobImageBase64 } from '@/lib/queue'

export const maxDuration = 10

export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get('jobId')
    const imageId = request.nextUrl.searchParams.get('imageId')

    if (!jobId || !imageId) {
        return new NextResponse('Missing jobId or imageId', { status: 400 })
    }

    const imageBase64 = await getJobImageBase64(jobId, imageId)

    if (!imageBase64) {
        return new NextResponse('Image not found or expired', { status: 404 })
    }

    const base64Data = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64

    const mimeType = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png'

    const buffer = Buffer.from(base64Data, 'base64')

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=86400',
        },
    })
}
