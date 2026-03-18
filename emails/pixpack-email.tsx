/**
 * emails/PixPackEmail.tsx
 *
 * Download link email sent to users after they submit their email
 * in the DownloadGateModal.
 *
 * Renders using @react-email/components.
 * Preview at: http://localhost:3000/api/email-preview (if you set that up)
 * Or run: npx react-email dev
 *
 * Brand: dark, minimal, orange accent (#ff4d1c)
 */

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
    Row,
    Column,
} from '@react-email/components'

interface PixPackEmailProps {
    /** The signed download URL — expires after expiresIn */
    packDownloadUrl: string
    /** How long until the link expires */
    expiresIn?: string
    /** Number of images in the pack */
    imageCount?: number
    /** Platforms included in the pack */
    platforms?: string[]
}

export function PixPackEmail({
    packDownloadUrl,
    expiresIn = '24 hours',
    imageCount = 6,
    platforms = [],
}: PixPackEmailProps) {
    const platformList = platforms.length > 0
        ? platforms.map(p => p.replace('_', ' ')).join(', ')
        : 'Instagram, TikTok, Facebook, Shopify'

    return (
        <Html lang="en" >
            <Head />
            < Preview > Your PixPack content pack is ready to download </Preview>
            < Tailwind >
                <Body className="bg-[#0c0c0b] font-sans m-0 p-0" >
                    <Container className="max-w-[560px] mx-auto px-4 py-10" >

                        {/* Logo */}
                        < Section className="mb-8" >
                            <Text className="text-white text-2xl font-bold m-0 p-0" >
                                Pix < span style={{ color: '#ff4d1c' }
                                }> Pack </span>
                            </Text>
                        </Section>

                        {/* Hero card */}
                        <Section
                            className="rounded-2xl p-8 mb-6"
                            style={{ backgroundColor: '#161614', border: '1px solid #2a2a26' }}
                        >
                            {/* Success indicator */}
                            < Section className="mb-6" >
                                <div
                                    style={
                                        {
                                            width: 48,
                                            height: 48,
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(0, 194, 122, 0.15)',
                                            border: '1px solid rgba(0, 194, 122, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }
                                    }
                                >
                                    <Text style={{ color: '#00c27a', fontSize: 24, margin: 0, lineHeight: 1 }}>✓</Text>
                                </div>
                            </Section>

                            < Heading
                                className="text-white text-2xl font-bold m-0 mb-2"
                                style={{ fontFamily: 'Georgia, serif' }}
                            >
                                Your content pack is ready.
                            </Heading>

                            < Text className="m-0 mb-6" style={{ color: '#6b6760', fontSize: 15, lineHeight: 1.6 }}>
                                {imageCount} AI - generated images for {platformList} — ready to post.
                            </Text>

                            {/* Pack stats row */}
                            <Row className="mb-8" >
                                <Column className="pr-2" >
                                    <Section
                                        style={
                                            {
                                                backgroundColor: '#1f1f1c',
                                                border: '1px solid #2a2a26',
                                                borderRadius: 12,
                                                padding: '12px 16px',
                                            }
                                        }
                                    >
                                        <Text style={{ color: '#ff4d1c', fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1 }}>
                                            {imageCount}
                                        </Text>
                                        < Text style={{ color: '#6b6760', fontSize: 11, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            Images
                                        </Text>
                                    </Section>
                                </Column>
                                < Column className="px-1" >
                                    <Section
                                        style={
                                            {
                                                backgroundColor: '#1f1f1c',
                                                border: '1px solid #2a2a26',
                                                borderRadius: 12,
                                                padding: '12px 16px',
                                            }
                                        }
                                    >
                                        <Text style={{ color: '#ff4d1c', fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1 }}>
                                            {imageCount * 3}
                                        </Text>
                                        < Text style={{ color: '#6b6760', fontSize: 11, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            Ad variants
                                        </Text>
                                    </Section>
                                </Column>
                                < Column className="pl-2" >
                                    <Section
                                        style={
                                            {
                                                backgroundColor: '#1f1f1c',
                                                border: '1px solid #2a2a26',
                                                borderRadius: 12,
                                                padding: '12px 16px',
                                            }
                                        }
                                    >
                                        <Text style={{ color: '#ff4d1c', fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1 }}>
                                            {expiresIn.replace(' hours', 'h')}
                                        </Text>
                                        < Text style={{ color: '#6b6760', fontSize: 11, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            Link valid
                                        </Text>
                                    </Section>
                                </Column>
                            </Row>

                            {/* Download CTA */}
                            <Button
                                href={packDownloadUrl}
                                style={{
                                    backgroundColor: '#ff4d1c',
                                    color: '#ffffff',
                                    borderRadius: 12,
                                    padding: '14px 32px',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    display: 'block',
                                    textAlign: 'center',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                }}
                            >
                                Download your pack →
                            </Button>

                            < Text
                                className="text-center m-0 mt-3"
                                style={{ color: '#6b6760', fontSize: 12 }}
                            >
                                Link expires in {expiresIn} · One - time download
                            </Text>
                        </Section>

                        {/* What's inside */}
                        <Section
                            className="rounded-xl p-6 mb-6"
                            style={{ backgroundColor: '#161614', border: '1px solid #2a2a26' }}
                        >
                            <Text
                                className="m-0 mb-4"
                                style={{
                                    color: '#6b6760',
                                    fontSize: 11,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    fontWeight: 600,
                                }}
                            >
                                What's in your ZIP
                            </Text>

                            {
                                [
                                    { label: `${imageCount} platform-native images`, detail: 'Correct dimensions for each platform' },
                                    { label: `${imageCount * 3} ad copy variants`, detail: 'Awareness · Consideration · Conversion' },
                                    { label: 'Shopify product listing', detail: 'Title, bullets, SEO meta' },
                                    { label: 'Posting schedule', detail: 'Best day and time per platform' },
                                ].map(({ label, detail }) => (
                                    <Row key={label} className="mb-3" >
                                        <Column style={{ width: 20 }}>
                                            <Text style={{ color: '#00c27a', fontSize: 14, margin: 0 }}>✓</Text>
                                        </Column>
                                        < Column >
                                            <Text style={{ color: '#f0ece3', fontSize: 13, fontWeight: 500, margin: 0 }}>
                                                {label}
                                            </Text>
                                            < Text style={{ color: '#6b6760', fontSize: 12, margin: '2px 0 0' }}>
                                                {detail}
                                            </Text>
                                        </Column>
                                    </Row>
                                ))}
                        </Section>

                        {/* Link as fallback */}
                        <Section className="mb-8" >
                            <Text style={{ color: '#6b6760', fontSize: 12, margin: 0 }}>
                                Button not working ? Copy this link into your browser:
                            </Text>
                            < Text
                                style={{
                                    color: '#ff4d1c',
                                    fontSize: 12,
                                    wordBreak: 'break-all',
                                    margin: '4px 0 0',
                                }}
                            >
                                {packDownloadUrl}
                            </Text>
                        </Section>

                        < Hr style={{ borderColor: '#2a2a26', margin: '0 0 24px' }} />

                        {/* Footer */}
                        <Section>
                            <Text style={{ color: '#6b6760', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                                You're receiving this because you requested a content pack at PixPack.
                                This link is single - use and expires after {expiresIn}.
                            </Text>
                            < Text style={{ color: '#6b6760', fontSize: 12, margin: '8px 0 0' }}>
                                © {new Date().getFullYear()} PixPack · AI product content for global merchants
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

// Preview props for react-email dev server
PixPackEmail.PreviewProps = {
    packDownloadUrl: 'https://pixpack.app/api/download?token=eyJhbGciOiJIUzI1NiJ9.example',
    expiresIn: '24 hours',
    imageCount: 6,
    platforms: ['instagram_post', 'tiktok', 'facebook_post', 'shopify_product'],
} satisfies PixPackEmailProps

export default PixPackEmail